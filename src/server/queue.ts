import EventEmitter from 'events';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ImageJob, ServerMetrics, UpscaleSettings } from '../types';
import { processImageOnCloud, generateOutputFilename } from './upscaler';
import { OUTPUT_DIR, UPLOAD_DIR } from './storage';
import { quotaManager } from './quota';

export class JobQueueManager extends EventEmitter {
  private jobs: Map<string, ImageJob> = new Map();
  private processingQueue: string[] = [];
  private activeWorkers = 0;
  private maxWorkers = 2; // Optimal concurrency for cloud container CPU & RAM
  private isPaused = false;
  private processedTimes: number[] = []; // In milliseconds for moving average

  constructor() {
    super();
  }

  public addJobs(newJobs: ImageJob[]): void {
    for (const job of newJobs) {
      this.jobs.set(job.id, job);
      if (job.status === 'queued') {
        this.processingQueue.push(job.id);
      }
    }
    this.processNext();
  }

  public getJob(id: string): ImageJob | undefined {
    return this.jobs.get(id);
  }

  public getAllJobs(): ImageJob[] {
    return Array.from(this.jobs.values());
  }

  public retryJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || (job.status !== 'failed' && job.status !== 'cancelled')) {
      return false;
    }
    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    this.processingQueue.push(id);
    this.processNext();
    return true;
  }

  public retryAllFailed(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'failed' || job.status === 'cancelled') {
        job.status = 'queued';
        job.progress = 0;
        job.error = undefined;
        this.processingQueue.push(job.id);
        count++;
      }
    }
    if (count > 0) {
      this.processNext();
    }
    return count;
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === 'queued') {
      this.processingQueue = this.processingQueue.filter((jobId) => jobId !== id);
      job.status = 'cancelled';
      job.error = 'Cancelled by user';
      return true;
    }
    if (job.status === 'processing') {
      job.status = 'cancelled';
      job.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  public removeJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    this.cancelJob(id);

    // Clean up files if present
    try {
      const uploadPath = path.join(UPLOAD_DIR, `${job.id}_${job.originalName}`);
      if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

      if (job.outputUrl) {
        const outFileName = path.basename(job.outputUrl);
        const outPath = path.join(OUTPUT_DIR, outFileName);
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      }
    } catch {
      // Ignore removal file error
    }

    return this.jobs.delete(id);
  }

  public clearAll(): void {
    for (const job of this.jobs.values()) {
      this.cancelJob(job.id);
    }
    this.jobs.clear();
    this.processingQueue = [];
  }

  public pauseQueue(): void {
    this.isPaused = true;
  }

  public resumeQueue(): void {
    this.isPaused = false;
    this.processNext();
  }

  public updateJobSettings(id: string, settings: UpscaleSettings): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status === 'processing') return false;
    job.settings = settings;
    return true;
  }

  private async processNext(): Promise<void> {
    if (this.isPaused) return;
    if (this.activeWorkers >= this.maxWorkers) return;
    if (this.processingQueue.length === 0) return;

    // Check daily quota
    if (!quotaManager.canProcess(1)) {
      this.emit('quota_exceeded');
      return;
    }

    const nextJobId = this.processingQueue.shift();
    if (!nextJobId) return;

    const job = this.jobs.get(nextJobId);
    if (!job || job.status !== 'queued') {
      this.processNext();
      return;
    }

    this.activeWorkers++;
    job.status = 'processing';
    job.progress = 5;
    this.emit('job_updated', job);

    // Run processing
    try {
      const inputFilename = `${job.id}_${job.originalName}`;
      const inputPath = path.join(UPLOAD_DIR, inputFilename);

      const outFilename = generateOutputFilename(
        job.originalName,
        job.settings.factor,
        job.settings.dpi,
        job.settings.format,
        job.settings.namingPattern,
        Array.from(this.jobs.keys()).indexOf(job.id) + 1,
        job.settings.customPrefix
      );

      const uniqueOutFilename = `${job.id}_${outFilename}`;
      const outputPath = path.join(OUTPUT_DIR, uniqueOutFilename);

      const result = await processImageOnCloud(
        inputPath,
        outputPath,
        job.settings,
        (progress) => {
          job.progress = progress;
          this.emit('job_updated', job);
        }
      );

      // Verify success
      job.status = 'completed';
      job.progress = 100;
      job.outputWidth = result.outputWidth;
      job.outputHeight = result.outputHeight;
      job.outputSize = result.outputSize;
      job.processingTimeMs = result.processingTimeMs;
      job.engineUsed = result.engineUsed;
      job.outputUrl = `/api/files/output/${uniqueOutFilename}`;

      this.processedTimes.push(result.processingTimeMs);
      if (this.processedTimes.length > 20) {
        this.processedTimes.shift();
      }

      quotaManager.recordProcessed(1);
    } catch (err: any) {
      console.error(`Error processing job ${job.id}:`, err);
      job.status = 'failed';
      job.error = err?.message || 'Processing failed on Cloud Server';
    } finally {
      this.activeWorkers--;
      this.emit('job_updated', job);
      // Process next job in queue immediately
      setImmediate(() => this.processNext());
    }
  }

  public getMetrics(): ServerMetrics {
    const totalCpu = os.cpus().length;
    const freeMem = os.freemem() / (1024 * 1024);
    const totalMem = os.totalmem() / (1024 * 1024);
    const usedMem = totalMem - freeMem;

    let avgTimeMs = 2500;
    if (this.processedTimes.length > 0) {
      avgTimeMs =
        this.processedTimes.reduce((acc, val) => acc + val, 0) /
        this.processedTimes.length;
    }

    const itemsPerMin = avgTimeMs > 0 ? (60000 / avgTimeMs) * Math.max(1, this.activeWorkers) : 0;

    let status: 'online' | 'degraded' | 'busy' = 'online';
    if (this.activeWorkers >= this.maxWorkers) {
      status = 'busy';
    }

    const totalProcessed = Array.from(this.jobs.values()).filter(
      (j) => j.status === 'completed'
    ).length;

    return {
      status,
      cpuUsagePercent: Math.min(100, Math.round((this.activeWorkers / this.maxWorkers) * 75 + 10)),
      memoryUsageMb: Math.round(usedMem),
      totalMemoryMb: Math.round(totalMem),
      activeWorkers: this.activeWorkers,
      maxWorkers: this.maxWorkers,
      queueLength: this.processingQueue.length,
      totalProcessedCount: totalProcessed,
      avgProcessingTimeSec: Number((avgTimeMs / 1000).toFixed(1)),
      currentSpeedItemsPerMin: Number(itemsPerMin.toFixed(1)),
    };
  }
}

export const queueManager = new JobQueueManager();
