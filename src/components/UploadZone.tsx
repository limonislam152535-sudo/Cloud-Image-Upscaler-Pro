import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileImage,
  Trash2,
  Play,
  AlertCircle,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { UpscaleSettings } from '../types';

interface UploadZoneProps {
  settings: UpscaleSettings;
  onUploadStart: (files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  settings,
  onUploadStart,
  isUploading,
  uploadProgress,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setValidationError(null);
    const filesArray = Array.from(incomingFiles);
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const maxSizeBytes = (settings.maxUploadSizeMB || 50) * 1024 * 1024;

    const accepted: File[] = [];
    let oversizedCount = 0;
    let invalidTypeCount = 0;

    for (const file of filesArray) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !validExtensions.includes(ext)) {
        invalidTypeCount++;
        continue;
      }
      if (file.size > maxSizeBytes) {
        oversizedCount++;
        continue;
      }
      accepted.push(file);
    }

    if (invalidTypeCount > 0) {
      setValidationError(`${invalidTypeCount} file(s) ignored: only JPG, PNG, WEBP supported.`);
    }
    if (oversizedCount > 0) {
      setValidationError(
        `${oversizedCount} file(s) exceeded the ${settings.maxUploadSizeMB || 50}MB limit.`
      );
    }

    // Combine with existing up to 200 files
    setSelectedFiles((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > 200) {
        setValidationError('Maximum 200 images can be uploaded in a single batch.');
        return combined.slice(0, 200);
      }
      return combined;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStart = async () => {
    if (selectedFiles.length === 0) return;
    await onUploadStart(selectedFiles);
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to load sample test images instantly for testing
  const handleLoadSamples = () => {
    try {
      const samples: File[] = [];

      // Create Sample 1: Low-res portrait test (765x1024 like user specified)
      const c1 = document.createElement('canvas');
      c1.width = 765;
      c1.height = 1024;
      const ctx1 = c1.getContext('2d');
      if (ctx1) {
        const grad = ctx1.createLinearGradient(0, 0, 765, 1024);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#4338ca');
        grad.addColorStop(1, '#06b6d4');
        ctx1.fillStyle = grad;
        ctx1.fillRect(0, 0, 765, 1024);

        ctx1.fillStyle = '#ffffff';
        ctx1.font = 'bold 36px sans-serif';
        ctx1.fillText('AI Upscaler Test Photo', 180, 250);
        ctx1.font = '24px monospace';
        ctx1.fillText('Original Size: 765 × 1024 Pixels', 160, 320);

        ctx1.strokeStyle = '#38bdf8';
        ctx1.lineWidth = 3;
        for (let i = 0; i < 20; i++) {
          ctx1.beginPath();
          ctx1.arc(382, 580, 40 + i * 16, 0, Math.PI * 2);
          ctx1.stroke();
        }

        ctx1.fillStyle = '#fef08a';
        ctx1.font = '20px sans-serif';
        ctx1.fillText('High-Fidelity Edge Test - 300 DPI Target', 190, 880);
      }
      const sample1Data = c1.toDataURL('image/jpeg', 0.9);
      samples.push(dataURLtoFile(sample1Data, 'portrait_sample_765x1024.jpg'));

      // Create Sample 2: Micro-detail icon (320x320)
      const c2 = document.createElement('canvas');
      c2.width = 320;
      c2.height = 320;
      const ctx2 = c2.getContext('2d');
      if (ctx2) {
        ctx2.fillStyle = '#0f172a';
        ctx2.fillRect(0, 0, 320, 320);
        ctx2.fillStyle = '#f43f5e';
        ctx2.beginPath();
        ctx2.arc(160, 160, 100, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.fillStyle = '#ffffff';
        ctx2.font = 'bold 28px sans-serif';
        ctx2.fillText('ICON 2X/4X', 80, 170);
      }
      const sample2Data = c2.toDataURL('image/png');
      samples.push(dataURLtoFile(sample2Data, 'avatar_icon_320x320.png'));

      // Create Sample 3: Landscape test (640x360)
      const c3 = document.createElement('canvas');
      c3.width = 640;
      c3.height = 360;
      const ctx3 = c3.getContext('2d');
      if (ctx3) {
        const grad3 = ctx3.createLinearGradient(0, 0, 640, 360);
        grad3.addColorStop(0, '#064e3b');
        grad3.addColorStop(1, '#10b981');
        ctx3.fillStyle = grad3;
        ctx3.fillRect(0, 0, 640, 360);
        ctx3.fillStyle = '#ffffff';
        ctx3.font = 'bold 30px sans-serif';
        ctx3.fillText('Landscape 16:9 Test', 170, 180);
      }
      const sample3Data = c3.toDataURL('image/webp', 0.9);
      samples.push(dataURLtoFile(sample3Data, 'scenic_landscape_640x360.webp'));

      handleFiles(samples);
    } catch (err) {
      console.error('Error generating samples:', err);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      {/* Upload Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20 scale-[0.99]'
            : 'border-slate-700/80 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />

        <div className="max-w-md mx-auto space-y-3 pointer-events-none">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-transform">
            <UploadCloud className="w-7 h-7 text-indigo-400" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              Drag & Drop up to 150-200 images here
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse from your computer (JPG, PNG, WEBP)
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
            <span>Max {settings.maxUploadSizeMB || 50}MB per file</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-medium">Batch Cloud Processing</span>
          </div>
        </div>

        {/* Quick Sample Button inside dropzone */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSamples();
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Realistic Test Samples (765×1024 & More)</span>
          </button>
        </div>
      </div>

      {/* Validation Warning */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Uploading Progress Bar */}
      {isUploading && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-indigo-300 font-medium flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Transferring images to Cloud Server...
            </span>
            <span className="font-mono text-white font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 h-2 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Selected Files Staging List & Actions */}
      {selectedFiles.length > 0 && !isUploading && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white">
                Selected for Upload:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({totalMB} MB total)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Selection
              </button>
            </div>
          </div>

          {/* Files Preview Grid */}
          <div className="max-h-56 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="group relative bg-slate-950/70 border border-slate-800 rounded-xl p-2 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <FileImage className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-medium text-slate-200 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-800/80 hover:bg-rose-500 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Start Processing Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">
              Target Resolution:{' '}
              <span className="font-bold text-cyan-400">
                {settings.factor}X Upscale
              </span>{' '}
              • Format: <span className="uppercase text-white">{settings.format}</span> •{' '}
              <span className="text-purple-400">{settings.dpi} DPI</span>
            </div>

            <button
              type="button"
              onClick={handleStart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Send to Cloud & Start Upscaling ({selectedFiles.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
