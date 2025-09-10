# YOLO Spine Detection Platform

A lightweight web platform for L1-L5 vertebrae detection in X-ray images using YOLO (You Only Look Once) object detection. Built with Next.js and deployed on Vercel with client-side inference using ONNX.js.

## Features

- **Real-time Detection**: Client-side YOLO inference for L1-L5 vertebrae detection
- **Medical UI**: Clean, professional interface designed for medical imaging
- **Drag & Drop**: Easy image upload with preview
- **Interactive Results**: Bounding box visualization with confidence scores
- **Lightweight**: ONNX.js for browser-based inference (no server required)
- **Responsive**: Mobile and desktop optimized

## Architecture

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **ML Inference**: ONNX.js with converted YOLOv11 model
- **Deployment**: Vercel with static hosting
- **Model**: Custom trained YOLO model for L1-L5 detection

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for model conversion only)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd web-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Convert YOLO model** (if needed):
   ```bash
   python3 scripts/convert_model.py
   ```
   This converts the PyTorch `.pt` model to ONNX format for web deployment.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and visit [http://localhost:3000](http://localhost:3000)

### Usage

1. **Upload an X-ray image** using drag & drop or file browser
2. **Click "Run Detection"** to analyze the image
3. **View results** with bounding boxes and confidence scores
4. **Export** annotated images for further analysis

## Model Details

- **Architecture**: YOLOv11n (nano) - optimized for speed and efficiency
- **Classes**: 5 vertebrae types (L1, L2, L3, L4, L5)
- **Input Size**: 640x640 pixels
- **Model Size**: ~10.1 MB (ONNX format)
- **Training Data**: Combined dataset from multiple medical imaging sources

### Performance Metrics
- **Precision**: High accuracy for vertebrae detection
- **Speed**: Real-time inference in browser
- **Compatibility**: Runs on all modern browsers

## Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

3. **Custom Domain** (optional):
   - Add your domain in Vercel dashboard
   - Update DNS settings

### Local Build

```bash
npm run build
npm run start
```

## Project Structure

```
web-platform/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main detection interface
│   └── layout.tsx         # App layout
├── components/            # React components
│   ├── ImageUpload.tsx    # Drag & drop upload
│   └── DetectionCanvas.tsx # Results visualization
├── lib/                   # Utilities
│   └── yolo-inference.ts  # ONNX.js inference logic
├── public/
│   └── models/
│       └── best.onnx      # Converted YOLO model
├── scripts/               # Utility scripts
│   └── convert_model.py   # Model conversion
└── package.json
```

## Technical Stack

- **Next.js 14**: Full-stack React framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **ONNX.js**: Browser-based ML inference
- **Lucide React**: Modern icons
- **Vercel**: Hosting and deployment

## Development

### Adding New Features

1. **New Components**: Add to `/components` directory
2. **API Routes**: Use `/app/api` for server-side logic
3. **Styling**: Use Tailwind CSS classes
4. **Model Updates**: Re-run conversion script

### Testing

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Build test
npm run build
```

## Model Training

The YOLO model was trained on a combined dataset including:
- NTOU medical imaging dataset
- TTBBSS lumbar spine dataset  
- LA semantic segmentation dataset
- NHANES X-ray data
- Custom spine fracture datasets

Training details available in `/yolo_v1/combine/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Ultralytics YOLO for the base detection framework
- Roboflow for dataset management tools
- Medical imaging community for open datasets

## Support

For issues and questions:
1. Check the [Issues](./issues) page
2. Review documentation
3. Contact the development team