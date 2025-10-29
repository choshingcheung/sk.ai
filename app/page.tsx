'use client';

import { useState, useEffect, useRef } from 'react';
import ImageUpload from '@/components/ImageUpload';
import DetectionCanvas from '@/components/DetectionCanvas';
import { yoloInference, type Detection } from '@/lib/yolo-inference';
import { Activity, ChevronLeft, ChevronRight, Grid, Maximize2, Download, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentImage = images[currentImageIndex] || null;

  // Load YOLO model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        const success = await yoloInference.loadModel();
        setModelLoaded(success);

        if (!success) {
          console.log('Model failed to load - demo mode will be used');
        }
      } catch (err) {
        setError('Failed to load YOLO model. Please refresh the page and try again.');
        console.error('Model loading error:', err);
        setModelLoaded(false);
      }
    };

    loadModel();
  }, []);

  const handleImagesUpload = (imageUrls: string[]) => {
    setImages(imageUrls);
    setCurrentImageIndex(0);
    setDetections([]);
    setError(null);
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setDetections([]);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setDetections([]);
    }
  };

  const handleDetect = async () => {
    if (!currentImage) return;

    setIsLoading(true);
    setError(null);

    try {
      if (modelLoaded) {
        const results = await yoloInference.predict(currentImage);
        setDetections(results);
      } else {
        console.log('Model not loaded, using mock detection for testing');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockDetections = [
          { bbox: [150, 120, 80, 60] as [number, number, number, number], confidence: 0.94, class: 'L1' },
          { bbox: [145, 200, 85, 65] as [number, number, number, number], confidence: 0.89, class: 'L2' },
          { bbox: [140, 280, 90, 70] as [number, number, number, number], confidence: 0.91, class: 'L3' },
          { bbox: [135, 360, 95, 75] as [number, number, number, number], confidence: 0.87, class: 'L4' },
          { bbox: [130, 440, 100, 80] as [number, number, number, number], confidence: 0.93, class: 'L5' }
        ];

        setDetections(mockDetections);
      }
    } catch (err) {
      console.error('Detection error:', err);
      setError(`Failed to run detection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Convert canvas to blob and download
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sk-ai-detection-${currentImageIndex + 1}.png`;
      link.click();

      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Modern Header with Glassmorphism */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl p-3 shadow-lg shadow-blue-500/50">
                <Activity className="h-7 w-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  SK.AI
                </h1>
                <p className="text-sm text-blue-200/80">AI-Powered Spine Detection Platform</p>
              </div>
            </div>

            {modelLoaded && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-lg backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">AI Model Active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        <div className={`grid ${currentImage ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'} gap-6`}>

          {/* Left Sidebar - Upload & Controls */}
          <div className={`${currentImage ? 'lg:col-span-3' : 'max-w-2xl mx-auto w-full'} space-y-6`}>
            {/* Upload Section */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5" />
                  <span>Upload Images</span>
                </h2>
                {images.length > 0 && (
                  <button
                    onClick={() => setShowGallery(!showGallery)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Toggle gallery view"
                  >
                    <Grid className="h-5 w-5 text-blue-300" />
                  </button>
                )}
              </div>
              <ImageUpload onImageUpload={handleImagesUpload} />

              {images.length > 0 && (
                <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                  <p className="text-sm text-blue-200">
                    {images.length} image{images.length > 1 ? 's' : ''} loaded
                  </p>
                </div>
              )}
            </div>

            {/* Image Navigation */}
            {images.length > 1 && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Navigate Images</h3>
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentImageIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-all border border-white/20 disabled:border-white/10"
                  >
                    <ChevronLeft className="h-5 w-5 text-white" />
                    <span className="text-white text-sm">Previous</span>
                  </button>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{currentImageIndex + 1}</p>
                    <p className="text-xs text-blue-200">of {images.length}</p>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentImageIndex === images.length - 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed rounded-lg transition-all border border-white/20 disabled:border-white/10"
                  >
                    <span className="text-white text-sm">Next</span>
                    <ChevronRight className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Thumbnail strip */}
                {showGallery && (
                  <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-black/20 rounded-lg max-h-64 overflow-y-auto">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentImageIndex(idx);
                          setDetections([]);
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex
                            ? 'border-blue-400 ring-2 ring-blue-400/50'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === currentImageIndex && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Detection Controls */}
            {currentImage && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Detection Controls</h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleDetect}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5" />
                      <span>{modelLoaded ? 'Run AI Detection' : 'Run Demo Detection'}</span>
                    </>
                  )}
                </button>

                {detections.length > 0 && (
                  <button
                    onClick={handleDownload}
                    className="w-full mt-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Result</span>
                  </button>
                )}
              </div>
            )}

            {/* Detection Summary */}
            {detections.length > 0 && (
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Detection Summary</h3>
                <div className="space-y-2">
                  {detections.map((detection, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                      <span className="font-semibold text-white text-lg">{detection.class}</span>
                      <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Detection Canvas - Larger */}
          {currentImage ? (
            <div className="lg:col-span-9">
              <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white">Detection Results</h2>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 className="h-5 w-5 text-blue-300" />
                  </button>
                </div>
                <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black/95 p-8' : ''}`}>
                  {isFullscreen && (
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-50"
                    >
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                  )}
                  <DetectionCanvas
                    imageUrl={currentImage}
                    detections={detections}
                    isLoading={isLoading}
                    canvasRef={canvasRef}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-12 shadow-2xl">
              <div className="text-center py-20">
                <div className="mb-6 flex justify-center">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-8 rounded-full">
                    <Activity className="h-20 w-20 text-blue-300" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">No Image Selected</h3>
                <p className="text-blue-200/70 text-lg max-w-md mx-auto">
                  Upload X-ray images or a folder of images to begin AI-powered spine detection
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
