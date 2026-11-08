"""
Cloud-Based Image Upscaler Pro - Standalone Python FastAPI Real-ESRGAN Backend
Suitable for: Hugging Face Spaces (ZeroGPU / Free CPU), Render, Railway, or Google Cloud Run.
"""

import io
import os
import torch
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet

app = FastAPI(
    title="Cloud-Based Image Upscaler Pro Engine",
    description="Server-Side AI Real-ESRGAN x4plus Super-Resolution API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Hardware & Model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[*] Initializing Real-ESRGAN Engine on: {device}")

# Real-ESRGAN x4plus RRDBNet Architecture
model = RRDBNet(
    num_in_ch=3,
    num_out_ch=3,
    num_feat=64,
    num_block=23,
    num_grow_ch=32,
    scale=4
)

weights_path = os.getenv("MODEL_PATH", "weights/RealESRGAN_x4plus.pth")

# Initialize RealESRGANer with tiling to preserve memory on free tiers
upscaler = None
if os.path.exists(weights_path):
    upscaler = RealESRGANer(
        scale=4,
        model_path=weights_path,
        model=model,
        tile=400,
        tile_pad=10,
        pre_pad=0,
        half=True if torch.cuda.is_available() else False,
        device=device
    )
    print("[+] Real-ESRGAN Model weights loaded successfully.")
else:
    print(f"[!] Model weights not found at {weights_path}. Running with dynamic upscale fallback.")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "device": str(device),
        "cuda_available": torch.cuda.is_available(),
        "engine": "Real-ESRGAN x4plus"
    }

@app.post("/upscale")
async def upscale_image(
    file: UploadFile = File(...),
    scale: int = Form(4),
    dpi: int = Form(300),
    output_format: str = Form("png")
):
    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
        orig_w, orig_h = pil_image.size
        
        target_w = orig_w * scale
        target_h = orig_h * scale

        if upscaler is not None:
            np_img = np.array(pil_image)
            enhanced, _ = upscaler.enhance(np_img, outscale=scale)
            result_img = Image.fromarray(enhanced)
        else:
            # High-order Lanczos fallback if weights are downloading
            result_img = pil_image.resize((target_w, target_h), Image.Resampling.LANCZOS)

        # Apply DPI metadata
        buf = io.BytesIO()
        out_fmt = output_format.upper()
        if out_fmt == "JPG":
            out_fmt = "JPEG"
            
        result_img.save(buf, format=out_fmt, dpi=(dpi, dpi), quality=95)
        buf.seek(0)

        media_type = f"image/{output_format.lower()}"
        return Response(content=buf.getvalue(), media_type=media_type)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
