'use client';

import { useEffect, useRef, useState } from 'react';
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
}

const COLORS = {
  L1: '#ff6b6b',
  L2: '#4ecdc4',
  L3: '#45b7d1',
  L4: '#96ceb4',
  L5: '#feca57',
};

export default function DetectionCanvas({ imageUrl, detections, isLoading }: DetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const containerWidth = canvas.parentElement?.clientWidth || 500;
    const maxHeight = 400;
    
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

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Draw filled background for label
        ctx.fillStyle = color;
        const labelText = `${detection.class} (${(detection.confidence * 100).toFixed(1)}%)`;
        ctx.font = '12px Inter, system-ui, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 8;
        const labelHeight = 20;

        // Position label above the box, or inside if at top edge
        const labelY = scaledY > labelHeight ? scaledY - 2 : scaledY + labelHeight;
        
        ctx.fillRect(scaledX, labelY - labelHeight, labelWidth, labelHeight);

        // Draw label text
        ctx.fillStyle = 'white';
        ctx.fillText(labelText, scaledX + 4, labelY - 6);
      });
    };
    img.src = imageUrl;
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600 font-medium">Processing image...</p>
          </div>
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg border overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ maxHeight: '400px' }}
        />
      </div>

      {/* Legend */}
      {detections.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Detection Legend</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLORS).map(([vertebra, color]) => (
              <div key={vertebra} className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-sm border" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">{vertebra}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}