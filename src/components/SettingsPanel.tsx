import React, { useState } from 'react';
import {
  Sliders,
  Maximize2,
  Image as ImageIcon,
  Printer,
  Sparkles,
  Server,
  FileText,
  CheckCircle2,
  Info,
  Activity,
} from 'lucide-react';
import {
  DPIValue,
  EngineType,
  OutputFormat,
  ProcessingQuality,
  UpscaleFactor,
  UpscaleSettings,
} from '../types';

interface SettingsPanelProps {
  settings: UpscaleSettings;
  onChange: (settings: UpscaleSettings) => void;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const updateSetting = <K extends keyof UpscaleSettings>(
    key: K,
    value: UpscaleSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleTestHf = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const endpoint =
        settings.engine === 'custom-hf' && settings.customHfEndpoint
          ? settings.customHfEndpoint
          : 'https://akhaliq-real-esrgan.hf.space';
      const res = await fetch('/api/test-hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      const data = await res.json();
      if (data.online) {
        setTestResult('Hugging Face ZeroGPU Space is online & ready!');
      } else {
        setTestResult(`Space is sleeping or unreachable (${data.error || 'fallback active'}). Cloud engine will auto-process!`);
      }
    } catch {
      setTestResult('Cannot connect. Cloud Super-Resolution engine will handle seamlessly.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl transition-all">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
              Global Upscaling Settings
            </h2>
            <p className="text-xs text-slate-400">
              Configure AI scale factor, quality parameters, DPI metadata, and export format
            </p>
          </div>
        </div>
        <span className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
          Cloud Executed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Upscaling Factor */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              Upscaling Factor
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {settings.factor === 2 && '2X (200% Resolution)'}
              {settings.factor === 4 && '4X (400% Super-Res)'}
              {settings.factor === 8 && '8X (800% Ultra-Scale)'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([2, 4, 8] as UpscaleFactor[]).map((f) => (
              <button
                key={f}
                type="button"
                disabled={disabled}
                onClick={() => updateSetting('factor', f)}
                className={`py-2 px-3 rounded-xl font-bold text-sm transition flex flex-col items-center justify-center border cursor-pointer ${
                  settings.factor === f
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <span>{f}X</span>
                <span className="text-[10px] font-normal opacity-80">
                  {f === 2 ? 'Double' : f === 4 ? 'Quad' : 'Max 8X'}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Example: 765×1024 px →{' '}
            <strong className="text-slate-200">
              {settings.factor === 2 && '1530 × 2048 px'}
              {settings.factor === 4 && '3060 × 4096 px'}
              {settings.factor === 8 && '6120 × 8192 px'}
            </strong>
          </p>
        </div>

        {/* 2. Processing Quality */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Processing Quality
            </span>
            <span className="text-[11px] text-amber-400 capitalize">
              {settings.quality}
            </span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {(['low', 'medium', 'high', 'ultra', 'maximum'] as ProcessingQuality[]).map((q) => (
              <button
                key={q}
                type="button"
                disabled={disabled}
                onClick={() => updateSetting('quality', q)}
                className={`py-2 px-1 text-center rounded-lg text-xs capitalize font-medium transition border cursor-pointer ${
                  settings.quality === q
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {q === 'maximum' ? 'Max' : q}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Adjusts contrast-adaptive unsharp mask & high-frequency edge detail reconstruction.
          </p>
        </div>

        {/* 3. Output Format & JPEG Quality */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              Output Format & Quality
            </span>
            <span className="text-[11px] text-emerald-400 uppercase font-mono">
              {settings.format} • {settings.jpegQuality}%
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpeg', 'webp'] as OutputFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                disabled={disabled}
                onClick={() => updateSetting('format', fmt)}
                className={`py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition border cursor-pointer ${
                  settings.format === fmt
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {fmt === 'jpeg' ? 'JPG' : fmt}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Compression Quality:</span>
              <span className="font-mono text-slate-200 font-semibold">{settings.jpegQuality}%</span>
            </div>
            <input
              type="range"
              min={70}
              max={100}
              value={settings.jpegQuality}
              onChange={(e) => updateSetting('jpegQuality', Number(e.target.value))}
              disabled={disabled || settings.format === 'png'}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* 4. Real DPI Metadata Injection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-purple-400" />
              Target DPI (Metadata)
            </span>
            <span className="text-[11px] text-purple-400 font-mono">
              {settings.dpi} DPI
            </span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {([72, 150, 300, 600, 1200] as DPIValue[]).map((dpi) => (
              <button
                key={dpi}
                type="button"
                disabled={disabled}
                onClick={() => updateSetting('dpi', dpi)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-medium transition border cursor-pointer ${
                  settings.dpi === dpi
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {dpi}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {settings.dpi === 72 && 'Web / Screen standard.'}
            {settings.dpi === 150 && 'Medium resolution print.'}
            {settings.dpi === 300 && 'Commercial standard 300 DPI print.'}
            {settings.dpi === 600 && 'Ultra-high definition fine art print.'}
            {settings.dpi === 1200 && 'Archival museum grade density.'}
          </p>
        </div>

        {/* 5. Output File Naming */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            File Naming Format
          </label>
          <select
            value={settings.namingPattern}
            onChange={(e) => updateSetting('namingPattern', e.target.value as any)}
            disabled={disabled}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="original_scale">[OriginalName]_4X_upscaled.ext</option>
            <option value="original_dpi">[OriginalName]_4X_300dpi.ext</option>
            <option value="prefix_index">[CustomPrefix]_001.ext</option>
            <option value="custom">[CustomPrefix]_[OriginalName]_4X.ext</option>
          </select>
          {(settings.namingPattern === 'prefix_index' || settings.namingPattern === 'custom') && (
            <input
              type="text"
              placeholder="Prefix (e.g. enhanced_pro)"
              value={settings.customPrefix || ''}
              onChange={(e) => updateSetting('customPrefix', e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>

        {/* 6. AI Engine & Endpoint Configuration */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Cloud AI Backend
            </span>
            <button
              type="button"
              onClick={handleTestHf}
              disabled={isTesting}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer"
            >
              <Activity className="w-3 h-3" />
              {isTesting ? 'Testing...' : 'Test HF Space'}
            </button>
          </label>

          {settings.engine === 'custom-hf' ? (
            <input
              type="text"
              placeholder="https://your-space.hf.space/api/predict"
              value={settings.customHfEndpoint || ''}
              onChange={(e) => updateSetting('customHfEndpoint', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          ) : (
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-semibold text-white">
                  {settings.engine === 'cloud-superres'
                    ? 'Cloud Super-Resolution Pro'
                    : 'Hugging Face Real-ESRGAN Space'}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {settings.engine === 'cloud-superres'
                    ? 'Zero-delay cloud processing with multi-stage Lanczos3 & contrast unsharp sharpening.'
                    : 'Connects to Free Real-ESRGAN ZeroGPU Space with automatic cloud fallback.'}
                </p>
              </div>
            </div>
          )}

          {testResult && (
            <div className="text-[11px] p-2 rounded bg-slate-950 border border-slate-800 text-cyan-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
