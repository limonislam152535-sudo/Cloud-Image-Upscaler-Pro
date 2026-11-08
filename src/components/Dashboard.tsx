import React from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  XCircle,
  Zap,
  Gauge,
} from 'lucide-react';
import { ImageJob, ServerMetrics } from '../types';

interface DashboardProps {
  jobs: ImageJob[];
  metrics: ServerMetrics | null;
  isPaused: boolean;
  onPauseToggle: () => void;
  onRetryFailed: () => void;
  onClearAll: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  metrics,
  isPaused,
  onPauseToggle,
  onRetryFailed,
  onClearAll,
}) => {
  const total = jobs.length;
  const queued = jobs.filter((j) => j.status === 'queued').length;
  const processing = jobs.filter((j) => j.status === 'processing').length;
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const failed = jobs.filter((j) => j.status === 'failed' || j.status === 'cancelled').length;

  // Overall progress percentage
  const overallPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate ETA (Estimated Time Remaining)
  const remainingJobs = queued + processing;
  const avgSec = metrics?.avgProcessingTimeSec || 2.5;
  const etaSec = remainingJobs > 0 ? Math.ceil((remainingJobs * avgSec) / Math.max(1, metrics?.activeWorkers || 2)) : 0;
  
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Live Cloud Processing Dashboard
            </h2>
            <p className="text-xs text-slate-400">
              Real-time server queue status, throughput, speed, and time estimation
            </p>
          </div>
        </div>

        {/* Global Queue Controls */}
        <div className="flex items-center gap-2">
          {remainingJobs > 0 && (
            <button
              type="button"
              onClick={onPauseToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'Resume Processing' : 'Pause Queue'}</span>
            </button>
          )}

          {failed > 0 && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed ({failed})</span>
            </button>
          )}

          {total > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
              title="Clear all jobs from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Total Images
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">{total}</div>
        </div>

        {/* Queued / Pending */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Queue
          </div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{queued}</div>
        </div>

        {/* Processing */}
        <div className="bg-slate-950/60 border border-indigo-500/30 rounded-xl p-3 relative overflow-hidden">
          {processing > 0 && (
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping m-2" />
          )}
          <div className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Processing
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{processing}</div>
        </div>

        {/* Completed */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{completed}</div>
        </div>

        {/* Failed */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </div>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1">{failed}</div>
        </div>

        {/* Processing Speed / ETA */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-purple-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            Speed & ETA
          </div>
          <div className="text-sm font-bold font-mono text-purple-300 mt-1">
            {remainingJobs > 0 ? `ETA: ${formatEta(etaSec)}` : 'Idle / Ready'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {metrics ? `${metrics.avgProcessingTimeSec}s / img` : '2.5s / img'}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {total > 0 && (
        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              Overall Batch Progress ({completed} of {total} completed)
            </span>
            <span className="font-mono text-cyan-400 font-bold">{overallPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-2.5 transition-all duration-300 ease-out"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
