import React from 'react';
import {
  Cloud,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DailyQuota, EngineType, ServerMetrics } from '../types';

interface HeaderProps {
  metrics: ServerMetrics | null;
  quota: DailyQuota | null;
  engine: EngineType;
  onSelectEngine: (engine: EngineType) => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  quota,
  engine,
  onSelectEngine,
  onOpenGuide,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Image Upscaler Pro
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Cloud AI
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Cloud Server Processing</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400/90">Zero Device CPU/GPU Load</span>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenGuide}
            className="md:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
            title="Free Deployment & Architecture Guide"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Guide</span>
          </button>
        </div>

        {/* Live Server Stats & Engine Selector */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 sm:gap-4 w-full md:w-auto text-xs">
          {/* Cloud Engine Selector */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Engine:
            </span>
            <select
              value={engine}
              onChange={(e) => onSelectEngine(e.target.value as EngineType)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="cloud-superres">Cloud Super-Resolution Pro (Fast)</option>
              <option value="huggingface-realesrgan">Hugging Face Real-ESRGAN (ZeroGPU)</option>
              <option value="custom-hf">Custom HF Space Endpoint</option>
            </select>
          </div>

          {/* Daily Quota Pill */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <span className="text-slate-400">Daily Free Quota: </span>
              <span className="font-semibold text-emerald-400">
                {quota ? `${quota.remainingToday} / ${quota.totalLimit}` : '250 / 250'}
              </span>
            </div>
          </div>

          {/* Live Cloud Resource Monitor */}
          {metrics && (
            <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>CPU: <b className="text-white">{metrics.cpuUsagePercent}%</b></span>
              </div>
              <div className="w-px h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Workers: <b className="text-white">{metrics.activeWorkers}/{metrics.maxWorkers}</b></span>
              </div>
              <div className="w-px h-3 bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium capitalize">{metrics.status}</span>
              </div>
            </div>
          )}

          {/* Guide Modal Trigger */}
          <button
            onClick={onOpenGuide}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deploy Free Cloud Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
