import fs from 'fs';
import path from 'path';
import sharp, { Sharp } from 'sharp';
import { DPIValue, OutputFormat, ProcessingQuality, UpscaleFactor, UpscaleSettings } from '../types';

export function calculateUpscaledDimensions(
  width: number,
  height: number,
  factor: UpscaleFactor
): { width: number; height: number } {
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error('Invalid input image dimensions');
  }
  return {
    width: Math.round(width * factor),
    height: Math.round(height * factor),
  };
}

export function generateOutputFilename(
  originalName: string,
  factor: UpscaleFactor,
  dpi: DPIValue,
  format: OutputFormat,
  pattern: string,
  index = 1,
  customPrefix = 'upscaled'
): string {
  const parsed = path.parse(originalName);
  const base = parsed.name;
  const ext = format === 'jpeg' ? '.jpg' : `.${format}`;

  switch (pattern) {
    case 'original_scale':
      return `${base}_${factor}X_upscaled${ext}`;
    case 'original_dpi':
      return `${base}_${factor}X_${dpi}dpi${ext}`;
    case 'prefix_index':
      return `${customPrefix || 'upscaled'}_${String(index).padStart(3, '0')}${ext}`;
    case 'custom':
      return `${customPrefix || 'upscaled'}_${base}_${factor}X${ext}`;
    default:
      return `${base}_${factor}X_upscaled${ext}`;
  }
}

export interface ProcessingResult {
  outputWidth: number;
  outputHeight: number;
  outputSize: number;
  processingTimeMs: number;
  engineUsed: string;
}

export async function processImageOnCloud(
  inputPath: string,
  outputPath: string,
  settings: UpscaleSettings,
  onProgress?: (percent: number) => void
): Promise<ProcessingResult> {
  const startTime = Date.now();
  onProgress?.(10);

  // 1. Read input metadata
  const imageInstance = sharp(inputPath);
  const meta = await imageInstance.metadata();

  if (!meta.width || !meta.height) {
    throw new Error('Could not read image dimensions from uploaded file.');
  }

  const { width: targetWidth, height: targetHeight } = calculateUpscaledDimensions(
    meta.width,
    meta.height,
    settings.factor
  );

  onProgress?.(25);

  let engineUsed = 'Cloud Super-Resolution Pro (Lanczos3 Multi-Scale)';

  // 2. Check if Hugging Face Real-ESRGAN engine is requested
  if (settings.engine === 'huggingface-realesrgan' || settings.engine === 'custom-hf') {
    const hfEndpoint =
      settings.engine === 'custom-hf' && settings.engine && settings.customHfEndpoint
        ? settings.customHfEndpoint
        : 'https://akhaliq-real-esrgan.hf.space/api/predict';

    try {
      onProgress?.(40);
      const fileBuffer = fs.readFileSync(inputPath);
      const base64Data = `data:${meta.format ? 'image/' + meta.format : 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;

      // Call HuggingFace Space Gradio API with 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(hfEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            base64Data,
            settings.factor === 2 ? '2x' : '4x',
            0.5,
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.data && json.data[0]) {
          const resultBase64 = json.data[0];
          const base64Clean = resultBase64.replace(/^data:image\/\w+;base64,/, '');
          const resultBuffer = Buffer.from(base64Clean, 'base64');
          
          // Verify with sharp and apply requested DPI / format
          let hfSharp = sharp(resultBuffer);
          const hfMeta = await hfSharp.metadata();
          
          // If 8X requested but HF only did 4X, scale the rest
          if (settings.factor === 8 && hfMeta.width && hfMeta.width < targetWidth) {
            hfSharp = hfSharp.resize(targetWidth, targetHeight, {
              kernel: sharp.kernel.lanczos3,
            });
          }

          applyFormatAndDpi(hfSharp, settings);
          await hfSharp.toFile(outputPath);
          engineUsed = 'Hugging Face Real-ESRGAN (ZeroGPU Space)';
        } else {
          throw new Error('HF Space returned unexpected payload');
        }
      } else {
        throw new Error(`HF Space returned status ${response.status}`);
      }
    } catch (hfErr: any) {
      // Graceful fallback to server-side super-resolution with informative notice
      console.warn(`Hugging Face Space offline/sleeping (${hfErr.message}). Using Cloud High-Fidelity Super-Resolution.`);
      engineUsed = 'Cloud Super-Res Pro (HF Fallback)';
      await runCloudSuperResolution(imageInstance, targetWidth, targetHeight, settings, outputPath, onProgress);
    }
  } else {
    // Standard Cloud Super-Resolution Engine
    await runCloudSuperResolution(imageInstance, targetWidth, targetHeight, settings, outputPath, onProgress);
  }

  onProgress?.(90);

  // Verify real output dimensions from the generated file
  const outStats = fs.statSync(outputPath);
  const outMeta = await sharp(outputPath).metadata();

  const finalWidth = outMeta.width || targetWidth;
  const finalHeight = outMeta.height || targetHeight;

  onProgress?.(100);

  return {
    outputWidth: finalWidth,
    outputHeight: finalHeight,
    outputSize: outStats.size,
    processingTimeMs: Date.now() - startTime,
    engineUsed,
  };
}

async function runCloudSuperResolution(
  imageInstance: Sharp,
  targetWidth: number,
  targetHeight: number,
  settings: UpscaleSettings,
  outputPath: string,
  onProgress?: (percent: number) => void
) {
  onProgress?.(45);

  let pipeline = imageInstance;

  // Handle multi-stage scaling for 8X to avoid excessive memory spikes
  if (settings.factor === 8) {
    // Intermediate step: 4X
    const intermediateWidth = Math.round(targetWidth / 2);
    const intermediateHeight = Math.round(targetHeight / 2);
    
    pipeline = pipeline.resize(intermediateWidth, intermediateHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
    });

    // Moderate sharpen pass
    pipeline = pipeline.sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0 });

    onProgress?.(65);

    // Final 8X step
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
    });
  } else {
    // 2X or 4X direct high-order Lanczos3 reconstruction
    pipeline = pipeline.resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'fill',
      fastShrinkOnLoad: false,
    });
  }

  onProgress?.(75);

  // Apply quality-tuned contrast-adaptive unsharp masking
  applySharpenFilter(pipeline, settings.quality);

  // Apply output format, compression, and real DPI metadata
  applyFormatAndDpi(pipeline, settings);

  // Write directly to cloud storage
  await pipeline.toFile(outputPath);
}

function applySharpenFilter(pipeline: Sharp, quality: ProcessingQuality) {
  switch (quality) {
    case 'low':
      pipeline.sharpen({ sigma: 0.8, m1: 0.8, m2: 1.5, x1: 2, y2: 10, y3: 20 });
      break;
    case 'medium':
      pipeline.sharpen({ sigma: 1.2, m1: 1.0, m2: 2.0, x1: 2, y2: 12, y3: 24 });
      break;
    case 'high':
      pipeline.sharpen({ sigma: 1.5, m1: 1.2, m2: 2.5, x1: 1, y2: 15, y3: 30 });
      break;
    case 'ultra':
      pipeline.sharpen({ sigma: 1.8, m1: 1.4, m2: 3.0, x1: 1, y2: 20, y3: 35 });
      break;
    case 'maximum':
      pipeline.sharpen({ sigma: 2.2, m1: 1.8, m2: 3.5, x1: 1, y2: 25, y3: 40 });
      break;
  }
}

function applyFormatAndDpi(pipeline: Sharp, settings: UpscaleSettings) {
  // Real DPI metadata injection (density in pixels per inch)
  pipeline.withMetadata({ density: settings.dpi });

  if (settings.format === 'jpeg') {
    pipeline.jpeg({
      quality: Math.min(100, Math.max(50, settings.jpegQuality || 92)),
      chromaSubsampling: '4:4:4', // Highest color sharpness
      mozjpeg: true,
    });
  } else if (settings.format === 'png') {
    pipeline.png({
      compressionLevel: 8,
      adaptiveFiltering: true,
    });
  } else if (settings.format === 'webp') {
    pipeline.webp({
      quality: Math.min(100, Math.max(50, settings.jpegQuality || 92)),
      effort: 5,
      smartSubsample: true,
    });
  }
}
