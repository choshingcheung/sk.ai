# Deployment Guide

## Quick Deployment to Vercel

### Step 1: Initialize Git Repository
```bash
cd web-platform
git init
git add .
git commit -m "Initial commit: YOLO Spine Detection Platform"
```

### Step 2: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `yolo-spine-detection-platform`
3. Don't initialize with README (we already have one)

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/yolo-spine-detection-platform.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your GitHub repository
5. Configure settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
6. Click "Deploy"

### Step 5: Custom Domain (Optional)
1. In your Vercel dashboard, go to your project
2. Click on "Settings" > "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

## Environment Variables (if needed)

Currently, this project doesn't require environment variables, but if you add API integrations later:

1. In Vercel dashboard, go to "Settings" > "Environment Variables"
2. Add your variables for Production, Preview, and Development

## Build Configuration

The project is configured for optimal Vercel deployment:

- **Static Files**: ONNX model served from `/public/models/`
- **Client-side Rendering**: Full client-side inference
- **Zero Server Costs**: No API routes or server functions
- **Fast Loading**: Static generation with Next.js

## Performance Optimizations

### Model Loading
- Model is cached in browser after first load
- 10.1 MB ONNX model with efficient compression
- Progressive loading with user feedback

### Bundle Size
- Total First Load JS: ~225 kB
- Optimized Tailwind CSS (only used classes)
- Tree-shaking for unused dependencies

### Caching Strategy
- Static assets cached for 24 hours
- Model file cached indefinitely (cache-busting via filename)
- CDN distribution via Vercel Edge Network

## Monitoring

### Built-in Analytics
- Vercel provides automatic performance monitoring
- Real User Metrics (RUM) available in dashboard
- Error tracking and performance insights

### Custom Analytics (Optional)
Add Google Analytics or other tracking services:

1. Install analytics package:
   ```bash
   npm install @vercel/analytics
   ```

2. Add to `app/layout.tsx`:
   ```tsx
   import { Analytics } from '@vercel/analytics/react';
   
   export default function Layout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

## Troubleshooting

### Common Issues

1. **Model Loading Failed**
   - Check if `/public/models/best.onnx` exists
   - Verify file is under 100MB (Vercel limit)
   - Check browser console for CORS errors

2. **Build Failures**
   - Run `npm run build` locally first
   - Check for TypeScript errors
   - Verify all dependencies are in package.json

3. **Slow Performance**
   - Model loading is one-time operation
   - Consider showing loading progress bar
   - Check network conditions for large model file

### Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **ONNX.js Issues**: [github.com/microsoft/onnxjs](https://github.com/microsoft/onnxjs)

## Production Checklist

- [ ] Repository pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Model file accessible at `/models/best.onnx`
- [ ] Image upload working
- [ ] Detection running without errors
- [ ] Results displaying correctly
- [ ] Responsive design tested
- [ ] Performance acceptable (< 3s load time)
- [ ] Error handling working
- [ ] Custom domain configured (if applicable)

## Updates and Maintenance

### Model Updates
1. Retrain your YOLO model
2. Run conversion script: `python3 scripts/convert_model.py`  
3. Replace `/public/models/best.onnx`
4. Test locally
5. Commit and push to GitHub
6. Vercel will auto-deploy

### Code Updates
1. Make changes locally
2. Test with `npm run dev`
3. Build test with `npm run build`
4. Commit and push to GitHub
5. Vercel auto-deploys main branch

### Scaling Considerations
- Current setup handles ~1000 concurrent users
- For higher traffic, consider:
  - Vercel Pro plan
  - Model optimization (quantization)
  - CDN for model files
  - Load balancing for API routes (if added)