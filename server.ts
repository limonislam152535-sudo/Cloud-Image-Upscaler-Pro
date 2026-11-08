import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import sharp from 'sharp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { initStorage, cleanupOldFiles, UPLOAD_DIR, OUTPUT_DIR } from './src/server/storage';
import { queueManager } from './src/server/queue';
import { quotaManager } from './src/server/quota';
import { ImageJob, UpscaleSettings } from './src/types';

const app = express();
const PORT = 3000;

// Init directories & cleanup
initStorage();
setInterval(() => cleanupOldFiles(), 1000 * 60 * 60);

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    // Sanitize filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueId}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max per file
    files: 200, // Up to 200 files in one request
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype.toLowerCase()) || file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WEBP images are supported.'));
    }
  },
});

// Static files route for uploaded and processed images
app.use('/api/files/input', express.static(UPLOAD_DIR));
app.use('/api/files/output', express.static(OUTPUT_DIR));

// 1. Upload route - Cloud Server receives 1 to 200 images
app.post('/api/upload', upload.array('images', 200), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    let defaultSettings: UpscaleSettings = {
      factor: 4,
      quality: 'high',
      format: 'png',
      jpegQuality: 92,
      dpi: 300,
      maxUploadSizeMB: 50,
      namingPattern: 'original_scale',
      engine: 'cloud-superres',
    };

    if (req.body.settings) {
      try {
        defaultSettings = { ...defaultSettings, ...JSON.parse(req.body.settings) };
      } catch {
        // fallback to default
      }
    }

    const createdJobs: ImageJob[] = [];

    for (const file of files) {
      // Extract unique ID from filename prefix
      const match = file.filename.match(/^([a-z0-9]+)_(.*)$/);
      const jobId = match ? match[1] : Math.random().toString(36).substring(2, 9);
      const originalName = match ? match[2] : file.originalname;

      // Extract image dimensions on Cloud Server
      let originalWidth = 0;
      let originalHeight = 0;
      try {
        const meta = await sharp(file.path).metadata();
        originalWidth = meta.width || 0;
        originalHeight = meta.height || 0;
      } catch (err) {
        console.warn('Could not read image metadata for', file.filename);
      }

      const job: ImageJob = {
        id: jobId,
        originalName,
        originalSize: file.size,
        mimeType: file.mimetype,
        uploadTimestamp: Date.now(),
        originalWidth,
        originalHeight,
        status: 'queued',
        progress: 0,
        settings: { ...defaultSettings },
        originalUrl: `/api/files/input/${file.filename}`,
      };

      createdJobs.push(job);
    }

    queueManager.addJobs(createdJobs);

    res.json({
      success: true,
      count: createdJobs.length,
      jobs: createdJobs,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message || 'Server upload failed' });
  }
});

// 2. Get all jobs and queue status
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.json({
    jobs: queueManager.getAllJobs(),
  });
});

// 3. Retry a single failed or cancelled job
app.post('/api/jobs/retry/:id', (req: Request, res: Response) => {
  const success = queueManager.retryJob(req.params.id);
  res.json({ success });
});

// 4. Retry all failed jobs
app.post('/api/jobs/retry-all', (_req: Request, res: Response) => {
  const count = queueManager.retryAllFailed();
  res.json({ success: true, count });
});

// 5. Cancel a job
app.post('/api/jobs/cancel/:id', (req: Request, res: Response) => {
  const success = queueManager.cancelJob(req.params.id);
  res.json({ success });
});

// 6. Remove a job
app.delete('/api/jobs/:id', (req: Request, res: Response) => {
  const success = queueManager.removeJob(req.params.id);
  res.json({ success });
});

// 7. Clear all jobs
app.post('/api/jobs/clear', (_req: Request, res: Response) => {
  queueManager.clearAll();
  res.json({ success: true });
});

// 8. Pause / Resume queue
app.post('/api/queue/pause', (_req: Request, res: Response) => {
  queueManager.pauseQueue();
  res.json({ success: true, isPaused: true });
});

app.post('/api/queue/resume', (_req: Request, res: Response) => {
  queueManager.resumeQueue();
  res.json({ success: true, isPaused: false });
});

// 9. Update job settings before processing
app.put('/api/jobs/:id/settings', (req: Request, res: Response) => {
  const success = queueManager.updateJobSettings(req.params.id, req.body.settings);
  res.json({ success });
});

// 10. Server metrics
app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json(queueManager.getMetrics());
});

// 11. Daily Quota info
app.get('/api/quota', (_req: Request, res: Response) => {
  res.json(quotaManager.getQuota());
});

// 12. Single file download
app.get('/api/download/:id', (req: Request, res: Response) => {
  const job = queueManager.getJob(req.params.id);
  if (!job || !job.outputUrl || job.status !== 'completed') {
    return res.status(404).json({ error: 'Processed image not found or not completed.' });
  }

  const outFileName = path.basename(job.outputUrl);
  const outPath = path.join(OUTPUT_DIR, outFileName);

  if (!fs.existsSync(outPath)) {
    return res.status(404).json({ error: 'File was deleted or cleaned up from server.' });
  }

  // Generate clean download name without the random internal prefix
  const cleanName = outFileName.replace(/^[a-z0-9]+_/, '');
  res.download(outPath, cleanName);
});

// 13. Download all completed as streaming ZIP
app.get('/api/download-all-zip', (req: Request, res: Response) => {
  const completedJobs = queueManager
    .getAllJobs()
    .filter((j) => j.status === 'completed' && j.outputUrl);

  if (completedJobs.length === 0) {
    return res.status(400).json({ error: 'No completed images available for download.' });
  }

  const archive = archiver('zip', {
    zlib: { level: 6 }, // Balanced compression
  });

  const zipName = `upscaled_images_${new Date().toISOString().slice(0, 10)}.zip`;
  res.attachment(zipName);

  archive.on('error', (err: any) => {
    console.error('ZIP Archive error:', err);
    if (!res.headersSent) {
      res.status(500).send({ error: err.message });
    }
  });

  archive.pipe(res);

  for (const job of completedJobs) {
    if (!job.outputUrl) continue;
    const outFileName = path.basename(job.outputUrl);
    const outPath = path.join(OUTPUT_DIR, outFileName);

    if (fs.existsSync(outPath)) {
      const cleanName = outFileName.replace(/^[a-z0-9]+_/, '');
      archive.file(outPath, { name: cleanName });
    }
  }

  archive.finalize();
});

// Free Hugging Face health check / proxy test
app.post('/api/test-hf', async (req: Request, res: Response) => {
  const endpoint = req.body.endpoint || 'https://akhaliq-real-esrgan.hf.space';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const r = await fetch(endpoint, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    res.json({
      online: r.ok || r.status < 500,
      status: r.status,
      endpoint,
    });
  } catch (e: any) {
    res.json({
      online: false,
      error: e.message || 'Cannot reach endpoint',
      endpoint,
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Mount Vite middlewares in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud-Based Image Upscaler Pro running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
