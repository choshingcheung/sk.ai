'use client';

import { useState, useEffect } from 'react';
import ImageUpload from '@/components/ImageUpload';
import DetectionCanvas from '@/components/DetectionCanvas';
import { yoloInference, type Detection } from '@/lib/yolo-inference';
import { Activity } from 'lucide-react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load YOLO model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await yoloInference.loadModel();
        setModelLoaded(true);
      } catch (err) {
        setError('Failed to load YOLO model. Please refresh the page and try again.');
        console.error('Model loading error:', err);
      }
    };
    
    loadModel();
  }, []);

  const handleImageUpload = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setDetections([]);
    setError(null);
  };

  const handleDetect = async () => {
    if (!selectedImage || !modelLoaded) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await yoloInference.predict(selectedImage);
      setDetections(results);
    } catch (err) {
      setError('Failed to run detection. Please try again with a different image.');
      console.error('Detection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YOLO Spine Detection</h1>
              <p className="text-sm text-gray-500">L1-L5 Vertebrae Detection Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload X-ray Image</h2>
              <ImageUpload onImageUpload={handleImageUpload} />
            </div>

            {/* Controls */}
            {selectedImage && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Controls</h3>
                
                {!modelLoaded && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">Loading YOLO model... Please wait.</p>
                  </div>
                )}
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <button
                  onClick={handleDetect}
                  disabled={isLoading || !modelLoaded}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Detecting Vertebrae...' : modelLoaded ? 'Run Detection' : 'Loading Model...'}
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {selectedImage ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Results</h2>
                <DetectionCanvas 
                  imageUrl={selectedImage} 
                  detections={detections}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Image Selected</h3>
                  <p className="text-gray-500">Upload an X-ray image to begin spine detection</p>
                </div>
              </div>
            )}

            {/* Detection Summary */}
            {detections.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Summary</h3>
                <div className="space-y-2">
                  {detections.map((detection, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{detection.class}</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
