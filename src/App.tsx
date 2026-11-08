import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { UploadZone } from './components/UploadZone';
import { Dashboard } from './components/Dashboard';
import { QueueList } from './components/QueueList';
import { ComparisonModal } from './components/ComparisonModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import { ZipDownloadBar } from './components/ZipDownloadBar';
import { DailyQuota, EngineType, ImageJob, ServerMetrics, UpscaleSettings } from './types';

export default function App() {
  const [settings, setSettings] = useState<UpscaleSettings>({
    factor: 4,
    quality: 'high',
    format: 'png',
    jpegQuality: 92,
    dpi: 300,
    maxUploadSizeMB: 50,
    namingPattern: 'original_scale',
    engine: 'cloud-superres',
  });

  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [quota, setQuota] = useState<DailyQuota | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPreviewJob, setSelectedPreviewJob] = useState<ImageJob | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Fetch jobs, metrics, and quota
  const fetchStatus = useCallback(async () => {
    try {
      const [jobsRes, metricsRes, quotaRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/metrics'),
        fetch('/api/quota'),
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuota(quotaData);
      }
    } catch {
      // Backend polling will recover on next cycle
    }
  }, []);

  // Polling loop: faster during active processing, slower when idle
  useEffect(() => {
    fetchStatus();
    const hasActiveJobs = jobs.some(
      (j) => j.status === 'queued' || j.status === 'processing'
    );
    const intervalTime = hasActiveJobs ? 1200 : 3500;
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [fetchStatus, jobs]);

  // Upload handler
  const handleUploadStart = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('settings', JSON.stringify(settings));

    try {
      // Simulate smooth upload progress
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (response.ok) {
        await fetchStatus();
      } else {
        const errJson = await response.json();
        alert(errJson.error || 'Upload failed');
      }
    } catch (e: any) {
      console.error('Upload network failure:', e);
      alert('Upload failed. Please check network connection.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleDownloadSingle = (job: ImageJob) => {
    window.location.href = `/api/download/${job.id}`;
  };

  const handleDownloadAllZip = () => {
    window.location.href = '/api/download-all-zip';
  };

  const handleRetrySingle = async (id: string) => {
    await fetch(`/api/jobs/retry/${id}`, { method: 'POST' });
    await fetchStatus();
  };

  const handleRetryAllFailed = async () => {
    await fetch('/api/jobs/retry-all', { method: 'POST' });
    await fetchStatus();
  };

  const handleRemoveSingle = async (id: string) => {
    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    await fetchStatus();
  };

  const handleClearAll = async () => {
    await fetch('/api/jobs/clear', { method: 'POST' });
    await fetchStatus();
  };

  const handlePauseToggle = async () => {
    const endpoint = isPaused ? '/api/queue/resume' : '/api/queue/pause';
    const res = await fetch(endpoint, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setIsPaused(data.isPaused);
      await fetchStatus();
    }
  };

  const completedJobs = jobs.filter(
    (j) => j.status === 'completed' && j.outputUrl
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24">
      {/* Top Header */}
      <Header
        metrics={metrics}
        quota={quota}
        engine={settings.engine}
        onSelectEngine={(engine: EngineType) =>
          setSettings((prev) => ({ ...prev, engine }))
        }
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 w-full space-y-6 flex-1">
        {/* Global Settings Panel */}
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          disabled={isUploading}
        />

        {/* Upload Zone */}
        <UploadZone
          settings={settings}
          onUploadStart={handleUploadStart}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        {/* Live Processing Dashboard */}
        <Dashboard
          jobs={jobs}
          metrics={metrics}
          isPaused={isPaused}
          onPauseToggle={handlePauseToggle}
          onRetryFailed={handleRetryAllFailed}
          onClearAll={handleClearAll}
        />

        {/* Queue & Results List */}
        <QueueList
          jobs={jobs}
          onDownloadSingle={handleDownloadSingle}
          onRetrySingle={handleRetrySingle}
          onRemoveSingle={handleRemoveSingle}
          onComparePreview={(job) => setSelectedPreviewJob(job)}
        />
      </main>

      {/* Floating Zip Download Banner */}
      <ZipDownloadBar
        completedJobs={completedJobs}
        onDownloadAllZip={handleDownloadAllZip}
      />

      {/* Modals */}
      <ComparisonModal
        job={selectedPreviewJob}
        onClose={() => setSelectedPreviewJob(null)}
        onDownload={handleDownloadSingle}
      />

      <DeploymentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
