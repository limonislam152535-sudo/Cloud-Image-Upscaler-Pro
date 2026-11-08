import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Server,
  Cloud,
  Code,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'hf_space' | 'github' | 'quota'>('architecture');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const pythonFastApiCode = `# Hugging Face Spaces (Gradio / FastAPI / ZeroGPU)
# app.py
from fastapi import FastAPI, UploadFile, File
import torch
from PIL import Image
import io
import numpy as np
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

app = FastAPI(title="Free Real-ESRGAN Cloud Backend")

# Setup RRDBNet model
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
upscaler = RealESRGANer(scale=4, model_path='weights/RealESRGAN_x4plus.pth', model=model, tile=400, device=device)

@app.post("/predict")
async def upscale(file: UploadFile = File(...), scale: int = 4):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    np_img = np.array(img)
    output, _ = upscaler.enhance(np_img, outscale=scale)
    out_img = Image.fromarray(output)
    buf = io.BytesIO()
    out_img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png")
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cloud-Based Image Upscaler Pro — Deployment & Free Services Guide
              </h3>
              <p className="text-xs text-slate-400">
                100% Free Cloud Architecture, Hugging Face ZeroGPU Setup & GitHub Deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'architecture', label: '1. Architecture & Free Hosting', icon: Cloud },
            { id: 'hf_space', label: '2. Hugging Face ZeroGPU Setup', icon: Server },
            { id: 'github', label: '3. GitHub & Deployment Steps', icon: Terminal },
            { id: 'quota', label: '4. Daily Quota & Limits', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  Zero Client-Side Processing Architecture
                </h4>
                <p>
                  This system is engineered so that your desktop or laptop operates purely as a lightweight browser terminal. All heavy compute (multi-stage Lanczos3 interpolation, edge sharpening, Real-ESRGAN super-resolution, EXIF/JFIF DPI writing, and ZIP compression) executes on the cloud backend container.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white flex items-center gap-1.5 text-indigo-400">
                    <Server className="w-4 h-4" />
                    Option A: All-in-One Cloud Node.js (Current)
                  </h5>
                  <p className="text-slate-400">
                    Runs the Express server with multi-worker concurrency queue and Sharp Super-Resolution pipeline.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">Free Hosting:</strong> Render.com, Railway Free, or Hugging Face Docker Space.</li>
                    <li><strong className="text-slate-200">Speed:</strong> 1-3 seconds per 4X image.</li>
                    <li><strong className="text-slate-200">Zero Cost:</strong> Completely free, no credit card or paid GPU required.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white flex items-center gap-1.5 text-purple-400">
                    <Cpu className="w-4 h-4" />
                    Option B: Hugging Face ZeroGPU Space
                  </h5>
                  <p className="text-slate-400">
                    Connects to Hugging Face Spaces running Real-ESRGAN x4plus on Nvidia A100/T4 ZeroGPU for free.
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">Free Tier:</strong> Free ZeroGPU allocations renewed dynamically.</li>
                    <li><strong className="text-slate-200">Sleeping Policy:</strong> Free spaces sleep after 48h idle; our backend includes automatic instant fallback to Cloud Super-Res so jobs never get stuck.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hf_space' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  Python FastAPI Real-ESRGAN Backend (Ready to copy to Hugging Face Space)
                </h4>
                <button
                  onClick={() => copyToClipboard(pythonFastApiCode, 'pycode')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSection === 'pycode' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'pycode' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto text-cyan-300">
                {pythonFastApiCode}
              </pre>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-400">
                <span className="font-bold text-slate-200">requirements.txt:</span>
                <p className="font-mono text-[11px] text-indigo-300">
                  fastapi uvicorn pillow numpy torch torchvision realesrgan basicsr
                </p>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">
                How to Upload to GitHub and Deploy Free in 3 Minutes
              </h4>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-1"># 1. Initialize git and commit</div>
                  <div className="text-cyan-300">git init</div>
                  <div className="text-cyan-300">git add .</div>
                  <div className="text-cyan-300">git commit -m &quot;Initial commit: Cloud Image Upscaler Pro&quot;</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-1"># 2. Link your GitHub repository</div>
                  <div className="text-cyan-300">git remote add origin https://github.com/your-username/cloud-image-upscaler-pro.git</div>
                  <div className="text-cyan-300">git branch -M main</div>
                  <div className="text-cyan-300">git push -u origin main</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 mb-1"># 3. Deploy Free on Render / Railway / Hugging Face</div>
                  <div className="text-slate-300 font-sans">
                    1. Go to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Render.com</a> or <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Railway.app</a>.<br />
                    2. Click &quot;New Web Service&quot; → Select your GitHub repo.<br />
                    3. Build Command: <code className="text-indigo-300 font-mono">npm run build</code><br />
                    4. Start Command: <code className="text-indigo-300 font-mono">npm start</code><br />
                    5. Everything is configured and ready to run automatically!
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quota' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">
                Free Tier Quota Management & Resource Optimization
              </h4>

              <div className="space-y-2 text-slate-300">
                <p>
                  To ensure 100% free availability without unexpected crashes or server overloads:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">Daily Quota</span>
                    <span className="text-lg font-bold font-mono text-white">250 Images / day</span>
                    <p className="text-[11px] text-slate-400 mt-1">Resets automatically at 00:00 UTC every midnight.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-cyan-400 block mb-1">Concurrency Limit</span>
                    <span className="text-lg font-bold font-mono text-white">2 Workers Pool</span>
                    <p className="text-[11px] text-slate-400 mt-1">Safeguards cloud RAM from out-of-memory crashes during 200-image bulk uploads.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-purple-400 block mb-1">Auto-Cleanup</span>
                    <span className="text-lg font-bold font-mono text-white">12-Hour Lifespan</span>
                    <p className="text-[11px] text-slate-400 mt-1">Temporary uploaded and processed files are pruned every 12 hours.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Complete documentation included in project README.md</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
