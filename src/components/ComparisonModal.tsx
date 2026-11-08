import React, { useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ImageJob } from '../types';

interface ComparisonModalProps {
  job: ImageJob | null;
  onClose: () => void;
  onDownload: (job: ImageJob) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  job,
  onClose,
  onDownload,
}) => {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [zoomLevel, setZoomLevel] = useState(1); // 1x, 2x, 3x

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {job.originalName}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Original: {job.originalWidth} × {job.originalHeight} px</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 font-bold">
                  {job.outputWidth} × {job.outputHeight} px ({job.settings.factor}X)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(job)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Upscaled</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Visual Canvas / Slider Area */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden select-none flex items-center justify-center min-h-[350px] max-h-[60vh]">
          {/* Zoom container */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 transition-transform duration-150"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Split Comparison Container */}
            <div className="relative max-w-full max-h-full aspect-auto flex items-center justify-center overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
              {/* Processed (After) Image - Full underneath */}
              <img
                src={job.outputUrl}
                alt="Upscaled result"
                className="max-h-[50vh] max-w-full object-contain pointer-events-none"
              />

              {/* Original (Before) Image - Clipped on top */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              >
                <img
                  src={job.originalUrl}
                  alt="Original image"
                  className="max-h-[50vh] max-w-full object-contain pointer-events-none w-full h-full"
                />
              </div>

              {/* Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] pointer-events-none z-10"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 text-slate-950 font-bold flex items-center justify-center shadow-md text-[10px]">
                  ↔
                </div>
              </div>

              {/* Badges on canvas */}
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-300 pointer-events-none z-20">
                Original ({job.originalWidth}×{job.originalHeight})
              </div>
              <div className="absolute bottom-3 right-3 bg-cyan-950/80 backdrop-blur border border-cyan-500/40 px-2.5 py-1 rounded-md text-[11px] font-bold text-cyan-300 pointer-events-none z-20">
                Upscaled {job.settings.factor}X ({job.outputWidth}×{job.outputHeight})
              </div>
            </div>
          </div>

          {/* Interactive slider input on the bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 z-30 shadow-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Original</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-ew-resize accent-cyan-400"
            />
            <span className="text-[10px] text-cyan-400 uppercase font-bold">Enhanced</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-xl border border-slate-800 z-30 shadow-lg">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1 text-slate-200">
              {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.5))}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Footer Specs Bar */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-500">Engine: </span>
              <span className="text-slate-200 font-medium">{job.engineUsed || 'Cloud Super-Res'}</span>
            </div>
            <div>
              <span className="text-slate-500">Target DPI: </span>
              <span className="text-purple-300 font-mono font-semibold">{job.settings.dpi} DPI</span>
            </div>
            <div>
              <span className="text-slate-500">Output Size: </span>
              <span className="text-slate-200 font-mono">
                {job.outputSize ? (job.outputSize / (1024 * 1024)).toFixed(2) + ' MB' : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Processing Time: </span>
              <span className="text-emerald-400 font-mono">
                {job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(1) + 's' : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exact Pixel Resolution Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
