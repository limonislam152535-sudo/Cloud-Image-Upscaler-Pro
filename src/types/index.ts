export type UpscaleFactor = 2 | 4 | 8;
export type ProcessingQuality = 'low' | 'medium' | 'high' | 'ultra' | 'maximum';
export type OutputFormat = 'jpeg' | 'png' | 'webp';
export type DPIValue = 72 | 150 | 300 | 600 | 1200;
export type EngineType = 'cloud-superres' | 'huggingface-realesrgan' | 'custom-hf';

export interface UpscaleSettings {
  factor: UpscaleFactor;
  quality: ProcessingQuality;
  format: OutputFormat;
  jpegQuality: number; // 70 - 100
  dpi: DPIValue;
  maxUploadSizeMB: number;
  namingPattern: 'original_scale' | 'original_dpi' | 'prefix_index' | 'custom';
  customPrefix?: string;
  engine: EngineType;
  customHfEndpoint?: string;
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ImageJob {
  id: string;
  originalName: string;
  originalSize: number; // bytes
  mimeType: string;
  uploadTimestamp: number;
  originalWidth?: number;
  originalHeight?: number;
  status: JobStatus;
  progress: number; // 0 - 100
  settings: UpscaleSettings;
  outputWidth?: number;
  outputHeight?: number;
  outputSize?: number; // bytes
  outputUrl?: string;
  previewUrl?: string;
  originalUrl: string;
  processingTimeMs?: number;
  error?: string;
  engineUsed?: string;
}

export interface DailyQuota {
  totalLimit: number;
  usedToday: number;
  remainingToday: number;
  resetTimeUtc: string;
  lastResetDate: string;
}

export interface ServerMetrics {
  status: 'online' | 'degraded' | 'busy';
  cpuUsagePercent: number;
  memoryUsageMb: number;
  totalMemoryMb: number;
  activeWorkers: number;
  maxWorkers: number;
  queueLength: number;
  totalProcessedCount: number;
  avgProcessingTimeSec: number;
  currentSpeedItemsPerMin: number;
}
