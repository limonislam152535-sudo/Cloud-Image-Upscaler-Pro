# AI Upscaling Models & Weights Configuration

Cloud-Based Image Upscaler Pro utilizes server-side super-resolution architectures to perform true resolution multipliers without client CPU/GPU usage:

## Supported Models

1. **Real-ESRGAN x4plus (Default Super-Resolution Model)**
   - **Architecture**: Residual in Residual Dense Block Network (RRDBNet)
   - **Parameters**: `num_in_ch=3`, `num_out_ch=3`, `num_feat=64`, `num_block=23`, `num_grow_ch=32`
   - **Scale**: 4X native, extendable to 8X via multi-stage tiling
   - **Pre-trained Weights URL**: 
     `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth`
   - **Download command**:
     ```bash
     mkdir -p weights
     wget https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth -O weights/RealESRGAN_x4plus.pth
     ```

2. **Real-ESRGAN x2plus (Fast Anime & Photo 2X)**
   - **Pre-trained Weights URL**:
     `https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth`

3. **Cloud Super-Resolution Pro Engine (Built-in Node.js / Sharp Engine)**
   - **Kernel**: High-order Lanczos3 polynomial interpolation filter with contrast-adaptive unsharp masking.
   - **Memory safety**: Tiled multi-pass pipeline for 8X ultra-resolutions to prevent memory exhaustion on free hosting plans.
   - **DPI Metadata injection**: Injects accurate JFIF / EXIF density tags (72, 150, 300, 600, 1200 DPI).
