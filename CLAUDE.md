# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (uses Turbopack for fast rebuilds)
- **Build for production**: `npm run build` (also uses Turbopack)
- **Run production server**: `npm run start`
- **Lint code**: `npm run lint`
- **Type check**: `npx tsc --noEmit`
- **Convert YOLO model**: `python3 scripts/convert_model.py` (converts PyTorch .pt to ONNX format)

## Architecture Overview

**SK.AI** is a client-side AI spine detection platform built with Next.js 14 that performs YOLO-based vertebrae detection entirely in the browser using ONNX.js.

### Key Components

**Core Inference Pipeline** (`lib/yolo-inference.ts`):
- Singleton `YOLOInference` class handling ONNX model loading and prediction
- Model expects 640x640 input, outputs transposed format: `[all_x, all_y, all_w, all_h, all_class_confidences...]`
- Post-processing handles YOLOv11's transposed tensor format with proper coordinate scaling
- Implements Non-Maximum Suppression (NMS) for duplicate detection removal

**Main Application Flow** (`app/page.tsx`):
- Manages global state: image upload, model loading, detection results
- Implements fallback system: real ONNX inference → demo mode if model fails
- Coordinates between ImageUpload and DetectionCanvas components

**Visualization System** (`components/DetectionCanvas.tsx`):
- Handles multi-stage coordinate scaling: YOLO (640x640) → Original Image → Canvas Display
- Canvas-based bounding box rendering with confidence labels
- Color-coded vertebrae classes (L1-L5)

### Critical Technical Details

**ONNX.js Configuration** (in `yolo-inference.ts`):
- Uses onnxruntime-web v1.19.2 for compatibility
- Requires specific WASM configuration: single-threaded, SIMD disabled
- Model loading uses multiple fallback strategies for browser compatibility

**Webpack Configuration** (`next.config.ts`):
- Handles ONNX/WASM files with custom loaders
- Disables Node.js modules for client-side compatibility
- Enables WebAssembly support with `asyncWebAssembly: true`

**Model Requirements**:
- YOLO model must be exported with: `optimize=False`, `simplify=False`, `opset=11`
- Expected at `/public/models/best.onnx` (~10MB)
- Classes: {0: 'L1', 1: 'L2', 2: 'L3', 3: 'L4', 4: 'L5'}

### Known Issues & Solutions

**Coordinate Scaling**: YOLOv11 outputs coordinates relative to 640x640 input - do NOT multiply by INPUT_SIZE again during post-processing.

**ONNX Loading**: Model loading can fail due to browser/WASM compatibility. The fallback demo system ensures UI remains functional.

**Memory Usage**: 10MB model + inference requires ~4GB RAM. Large images may cause OOM in memory-constrained environments.

### Deployment

Platform is designed for Vercel static deployment. All inference happens client-side - no server-side AI processing required. The `/api/detect` route exists as a backup but currently returns mock data.

The application is privacy-first: no image data ever leaves the user's browser.