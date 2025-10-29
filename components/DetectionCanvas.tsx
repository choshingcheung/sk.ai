'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  class: string;
}

interface DetectionCanvasProps {
  imageUrl: string;
  detections: Detection[];
  isLoading: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const COLORS = {
  L1: '#ef4444', // red-500
  L2: '#3b82f6', // blue-500
  L3: '#10b981', // green-500
  L4: '#f59e0b', // amber-500
  L5: '#8b5cf6', // violet-500
};

export default function DetectionCanvas({ imageUrl, detections, isLoading, canvasRef }: DetectionCanvasProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      drawImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (detections.length > 0 && imageDimensions.width > 0) {
      redrawWithDetections();
    }
  }, [detections, imageDimensions]);

  const drawImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size to fit the container while maintaining aspect ratio
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const maxHeight = 800; // Much larger for better visibility
    
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / aspectRatio;
    
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = maxHeight * aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  };

  const redrawWithDetections = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Redraw the base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // YOLO model processes images at 640x640, so we need to scale from that
      // First scale from YOLO's 640x640 coordinate system to original image dimensions
      const yoloToImageScaleX = imageDimensions.width / 640;
      const yoloToImageScaleY = imageDimensions.height / 640;
      
      // Then scale from original image to canvas display size
      const imageToCanvasScaleX = canvas.width / imageDimensions.width;
      const imageToCanvasScaleY = canvas.height / imageDimensions.height;

      console.log('Scaling debug:', {
        canvasSize: [canvas.width, canvas.height],
        imageSize: [imageDimensions.width, imageDimensions.height],
        yoloToImageScale: [yoloToImageScaleX, yoloToImageScaleY],
        imageToCanvasScale: [imageToCanvasScaleX, imageToCanvasScaleY],
        detectionsCount: detections.length
      });

      // Draw detections
      detections.forEach((detection, idx) => {
        const [x, y, width, height] = detection.bbox;
        const color = COLORS[detection.class as keyof typeof COLORS] || '#ff6b6b';

        // Scale coordinates: YOLO (640x640) -> Original Image -> Canvas
        const imageX = x * yoloToImageScaleX;
        const imageY = y * yoloToImageScaleY;
        const imageWidth = width * yoloToImageScaleX;
        const imageHeight = height * yoloToImageScaleY;
        
        const scaledX = imageX * imageToCanvasScaleX;
        const scaledY = imageY * imageToCanvasScaleY;
        const scaledWidth = imageWidth * imageToCanvasScaleX;
        const scaledHeight = imageHeight * imageToCanvasScaleY;

        console.log(`Canvas Detection ${idx}: bbox=[${x.toFixed(1)}, ${y.toFixed(1)}, ${width.toFixed(1)}, ${height.toFixed(1)}] scaled=[${scaledX.toFixed(1)}, ${scaledY.toFixed(1)}, ${scaledWidth.toFixed(1)}, ${scaledHeight.toFixed(1)}] class=${detection.class} conf=${(detection.confidence*100).toFixed(1)}%`);

        // Draw bounding box with thicker, more visible lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 4; // Thicker for better visibility
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Add a semi-transparent fill to highlight the detection area
        ctx.fillStyle = color + '15'; // 15 is hex for ~10% opacity
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw label background with shadow
        ctx.fillStyle = color;
        const labelText = `${detection.class} ${(detection.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 16px Inter, system-ui, sans-serif'; // Larger, bold font
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 16;
        const labelHeight = 28;

        // Position label above the box, or inside if at top edge
        const labelY = scaledY > labelHeight ? scaledY - 4 : scaledY + labelHeight + 4;

        // Draw label with rounded corners effect
        ctx.fillRect(scaledX - 2, labelY - labelHeight, labelWidth, labelHeight);

        // Draw label text with shadow for better readability
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(labelText, scaledX + 6, labelY - 8);
        ctx.shadowBlur = 0; // Reset shadow
      });
    };
    img.src = imageUrl;
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex flex-col items-center space-y-3 bg-white/10 p-8 rounded-xl border border-white/20">
            <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />
            <p className="text-lg text-white font-semibold">Analyzing spine structure...</p>
            <p className="text-sm text-blue-200">AI detection in progress</p>
          </div>
        </div>
      )}

      <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ maxHeight: '800px' }}
        />
      </div>

      {/* Modern Legend */}
      {detections.length > 0 && (
        <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <span>Detection Color Legend</span>
          </h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(COLORS).map(([vertebra, color]) => (
              <div key={vertebra} className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{ backgroundColor: color, borderColor: color }}
                />
                <span className="text-sm font-medium text-white">{vertebra}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}