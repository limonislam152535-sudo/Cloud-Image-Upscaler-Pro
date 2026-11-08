import React from 'react';
import { Archive, Download, CheckCircle2, Sparkles } from 'lucide-react';
import { ImageJob } from '../types';

interface ZipDownloadBarProps {
  completedJobs: ImageJob[];
  onDownloadAllZip: () => void;
}

export const ZipDownloadBar: React.FC<ZipDownloadBarProps> = ({
  completedJobs,
  onDownloadAllZip,
}) => {
  if (completedJobs.length === 0) return null;

  const totalOutputBytes = completedJobs.reduce(
    (acc, j) => acc + (j.outputSize || 0),
    0
  );
  const totalMB = (totalOutputBytes / (1024 * 1024)).toFixed(1);

  return (
    <aside
      aria-label="Batch Download Notification"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-950/80 backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-cyan-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{completedJobs.length} {completedJobs.length === 1 ? 'Image' : 'Images'} Ready for Download</span>
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Total enhanced batch size: <span className="font-mono font-bold text-white">{totalMB} MB</span> • Preserves original names & DPI
            </p>
          </div>
        </div>

        <button
          onClick={onDownloadAllZip}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download All as ZIP</span>
        </button>
      </div>
    </aside>
  );
};
