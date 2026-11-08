# Cloud-Based Image Upscaler Pro 🚀

A professional, completely free, cloud-based AI image upscaling web application. Engineered so that your local computer (laptop/desktop) acts strictly as a lightweight browser client—**100% of all image processing, AI super-resolution, EXIF/JFIF DPI writing, and ZIP compilation execute on cloud servers.**

---

## 🌟 Key Capabilities

1. **Zero Client CPU/GPU Consumption**: Your device never overheats or freezes; all heavy processing is offloaded to the cloud server.
2. **Bulk Processing (150–200 Images)**: Concurrent queue architecture with worker pools, pause/resume, and retry mechanisms.
3. **True Pixel Resolution Upscaling**:
   - **2X Upscaling**: e.g., $765 \times 1024$ px $\to 1530 \times 2048$ px
   - **4X Upscaling**: e.g., $765 \times 1024$ px $\to 3060 \times 4096$ px
   - **8X Upscaling**: e.g., $765 \times 1024$ px $\to 6120 \times 8192$ px
4. **Professional Global Settings**:
   - **Scale Factors**: 2X, 4X, 8X
   - **Processing Quality**: Low, Medium, High, Ultra, Maximum
   - **Output Formats**: JPG, PNG, WEBP with 70%–100% compression slider
   - **Target DPI Metadata**: Real EXIF/JFIF density tags (72, 150, 300, 600, 1200 DPI)
   - **Flexible Naming**: Preserve original, append scale, add DPI, or use sequential index
5. **Interactive Before/After Slider**: Real-time side-by-side inspection with up to 300% zoom.
6. **Streaming ZIP Download**: Server-side compressed ZIP download of all completed files without exhausting client memory.
7. **Free Cloud Quota Protection**: Daily usage counter (default 250 free cloud jobs/day) with automatic UTC midnight reset and concurrency throttling.

---

## 📁 Project Structure

```
├── backend/                  # Standalone Python FastAPI Real-ESRGAN backend
│   └── app.py               # FastAPI server with RRDBNet / Real-ESRGAN x4plus
├── models/                   # AI model configuration & weights instructions
│   └── README.md
├── storage/                  # Cloud storage directory (auto-managed & pruned)
│   ├── uploads/             # Incoming upload staging area
│   ├── processed/           # Processed high-resolution output files
│   └── quota.json           # Persistent daily quota state
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Live status, engine selector, quota tracker
│   │   ├── SettingsPanel.tsx# Global upscale, format, DPI, and naming controls
│   │   ├── UploadZone.tsx   # 150-200 image dropzone with sample test loader
│   │   ├── Dashboard.tsx    # Real-time metrics, throughput, speed, and ETA
│   │   ├── QueueList.tsx    # Queue cards with dimension badges and actions
│   │   ├── ComparisonModal.tsx # Interactive before/after split slider
│   │   ├── ZipDownloadBar.tsx  # Floating one-click batch ZIP download banner
│   │   └── DeploymentGuideModal.tsx # Interactive deployment guide
│   ├── server/
│   │   ├── storage.ts       # Cloud directory setup & 12h automatic cleanup
│   │   ├── quota.ts         # Persistent daily free quota tracker (00:00 UTC reset)
│   │   ├── upscaler.ts      # Multi-scale Lanczos3 + HF ZeroGPU connector
│   │   ├── upscaler.test.ts # Unit tests for math, resolution & filenames
│   │   └── queue.ts         # Concurrency-throttled background worker pool
│   ├── types/
│   │   └── index.ts         # Full TypeScript type definitions
│   ├── App.tsx              # Root React application
│   └── main.tsx             # Entry point
├── server.ts                # Express full-stack cloud server with Vite middleware
├── requirements.txt         # Python dependencies for Hugging Face Spaces
├── package.json
└── README.md
```

---

## 🆓 Free Hosting & Cloud Deployment Guide

### Option 1: One-Click Deploy Full-Stack Node.js (Render / Railway / Cloud Run)

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cloud-Based Image Upscaler Pro"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cloud-image-upscaler-pro.git
   git push -u origin main
   ```
2. Log into **Render.com** (Free Tier):
   - Click **New** → **Web Service** → Select your GitHub repo.
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Plan: **Free** (512MB RAM, shared CPU)
3. Your Cloud-Based Image Upscaler Pro will be live on `https://your-app.onrender.com`!

### Option 2: Free Hugging Face Spaces (ZeroGPU / Real-ESRGAN Python Backend)

1. Create a free account at [Hugging Face](https://huggingface.co).
2. Click **New Space** → SDK: **Docker** or **Gradio** → Hardware: **ZeroGPU (Free)** or **CPU Basic (Free)**.
3. Upload `backend/app.py` and `requirements.txt`.
4. Copy your Space URL (e.g., `https://your-space.hf.space/api/predict`).
5. In the web interface, select **Custom HF Space Endpoint** and paste your URL!

---

## 🧪 Testing & Verification Guide (Phases 1 to 10)

1. **Phase 1 (Small JPG Upload)**: Click "Load Realistic Test Samples" or drag any JPG image.
2. **Phase 2 (2X Upscaling)**: Select 2X in Settings → Click "Send to Cloud & Start Upscaling". Notice the dimensions double precisely (e.g. $765 \times 1024 \to 1530 \times 2048$).
3. **Phase 3 (4X Upscaling)**: Select 4X → Process. Dimensions scale to $3060 \times 4096$.
4. **Phase 4 (Resolution Verification)**: Inspect the badge in the queue or click "Compare" to check pixel-level sharpness.
5. **Phase 5 (Quality & Format)**: Test PNG vs WEBP vs JPG with quality slider.
6. **Phase 6 (DPI Metadata)**: Select 300 or 600 DPI; the server writes authentic JFIF / EXIF density headers.
7. **Phase 7 (Bulk Queue 5–10+ Images)**: Upload multiple images simultaneously. Notice workers throttle to prevent memory crashes.
8. **Phase 8 (ZIP Download)**: Click "Download All as ZIP" in the bottom floating banner to receive an archive containing all processed images.
9. **Phase 9 (Responsive UI)**: Works cleanly on Mobile (390px), Tablet (768px), and Desktop (1440px).
10. **Phase 10 (Unit Tests)**: Run `npx tsx --test src/server/upscaler.test.ts` to verify pure scaling algorithms and quota management.
