import React, { useState } from 'react';
import {
  Download,
  Eye,
  RotateCcw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Filter,
  FileImage,
  ArrowRight,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { ImageJob, JobStatus } from '../types';

interface QueueListProps {
  jobs: ImageJob[];
  onDownloadSingle: (job: ImageJob) => void;
  onRetrySingle: (id: string) => void;
  onRemoveSingle: (id: string) => void;
  onComparePreview: (job: ImageJob) => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  jobs,
  onDownloadSingle,
  onRetrySingle,
  onRemoveSingle,
  onComparePreview,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredJobs = jobs.filter((job) => {
    if (filter !== 'all') {
      if (filter === 'failed' && job.status !== 'failed' && job.status !== 'cancelled') return false;
      if (filter !== 'failed' && job.status !== filter) return false;
    }
    if (search.trim()) {
      return job.originalName.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const getStatusBadge = (job: ImageJob) => {
    switch (job.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing ({job.progress}%)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> {job.status === 'cancelled' ? 'Cancelled' : 'Failed'}
          </span>
        );
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 mx-auto flex items-center justify-center text-slate-500 mb-3">
          <FileImage className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No images in processing queue</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Upload images using the drag & drop area above, or click &quot;Load Realistic Test Samples&quot; to test the cloud upscaler pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            Image Processing Queue
          </h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {jobs.length} Total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            {['all', 'queued', 'processing', 'completed', 'failed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                  filter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Queue Items List */}
      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className={`border rounded-xl p-3 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              job.status === 'processing'
                ? 'bg-slate-950/80 border-cyan-500/40 shadow-md shadow-cyan-500/5'
                : job.status === 'completed'
                ? 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700'
                : job.status === 'failed'
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            {/* Left: Thumbnail & Filename Details */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Image Preview Thumbnail */}
              <div
                onClick={() => job.status === 'completed' && onComparePreview(job)}
                className={`w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative ${
                  job.status === 'completed' ? 'cursor-pointer group' : ''
                }`}
              >
                <img
                  src={job.outputUrl || job.originalUrl}
                  alt={job.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {job.status === 'completed' && (
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
              </div>

              {/* Title & Dimension Comparison */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-xs" title={job.originalName}>
                    {job.originalName}
                  </p>
                  {getStatusBadge(job)}
                </div>

                {/* Resolution & Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                  {job.originalWidth && job.originalHeight ? (
                    <span className="text-slate-300">
                      {job.originalWidth} × {job.originalHeight} px
                    </span>
                  ) : (
                    <span>{(job.originalSize / 1024).toFixed(0)} KB</span>
                  )}

                  {job.status === 'completed' && job.outputWidth && job.outputHeight && (
                    <>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-300 font-bold bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800/50">
                        {job.outputWidth} × {job.outputHeight} px ({job.settings.factor}X)
                      </span>
                      <span className="text-purple-300 bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-800/50">
                        {job.settings.dpi} DPI
                      </span>
                      {job.outputSize && (
                        <span className="text-slate-300">
                          {(job.outputSize / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                      {job.processingTimeMs && (
                        <span className="text-emerald-400">
                          {(job.processingTimeMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </>
                  )}
                </div>

                {job.error && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    Error: {job.error}
                  </p>
                )}

                {/* Individual Progress bar when processing */}
                {job.status === 'processing' && (
                  <div className="w-full sm:w-64 bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-cyan-400 h-1.5 transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {job.status === 'completed' && (
                <>
                  <button
                    type="button"
                    onClick={() => onComparePreview(job)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                    title="Compare Before vs After"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownloadSingle(job)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Download upscaled image"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </>
              )}

              {(job.status === 'failed' || job.status === 'cancelled') && (
                <button
                  type="button"
                  onClick={() => onRetrySingle(job.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1 transition cursor-pointer"
                  title="Retry job"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemoveSingle(job.id)}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Remove job from queue"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
