import * as ort from 'onnxruntime-web';

export interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  class: string;
}

class YOLOInference {
  private session: ort.InferenceSession | null = null;
  private modelLoaded = false;
  private readonly MODEL_PATH = '/models/best.onnx';
  private readonly INPUT_SIZE = 640;
  private readonly CONFIDENCE_THRESHOLD = 0.5;
  private readonly IOU_THRESHOLD = 0.4;
  
  // Class names from the trained model
  private readonly CLASS_NAMES = {
    0: 'L1',
    1: 'L2', 
    2: 'L3',
    3: 'L4',
    4: 'L5'
  };

  async loadModel(): Promise<void> {
    if (this.modelLoaded) return;

    try {
      console.log('Loading YOLO model...');
      
      // Configure ONNX Runtime for web
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
      
      this.session = await ort.InferenceSession.create(this.MODEL_PATH, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      
      this.modelLoaded = true;
      console.log('✓ YOLO model loaded successfully');
    } catch (error) {
      console.error('Failed to load YOLO model:', error);
      throw new Error('Failed to load YOLO model');
    }
  }

  async predict(imageUrl: string): Promise<Detection[]> {
    if (!this.session) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUrl);
      
      // Run inference
      const feeds = { images: inputTensor };
      const results = await this.session.run(feeds);
      
      // Get output tensor
      const output = results.output0;
      if (!output) {
        throw new Error('No output from model');
      }
      
      // Post-process results
      const detections = this.postprocess(output.data as Float32Array, output.dims as number[]);
      
      return detections;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  private async preprocessImage(imageUrl: string): Promise<ort.Tensor> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = this.INPUT_SIZE;
          canvas.height = this.INPUT_SIZE;
          
          // Draw image to canvas, resized and letterboxed
          ctx.fillStyle = '#808080'; // Gray background for letterboxing
          ctx.fillRect(0, 0, this.INPUT_SIZE, this.INPUT_SIZE);
          
          // Calculate scaling to maintain aspect ratio
          const scale = Math.min(
            this.INPUT_SIZE / img.naturalWidth,
            this.INPUT_SIZE / img.naturalHeight
          );
          
          const scaledWidth = img.naturalWidth * scale;
          const scaledHeight = img.naturalHeight * scale;
          const x = (this.INPUT_SIZE - scaledWidth) / 2;
          const y = (this.INPUT_SIZE - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Get image data and convert to tensor format
          const imageData = ctx.getImageData(0, 0, this.INPUT_SIZE, this.INPUT_SIZE);
          const pixels = imageData.data;
          
          // Convert from RGBA to RGB and normalize to [0, 1]
          const tensorData = new Float32Array(3 * this.INPUT_SIZE * this.INPUT_SIZE);
          
          for (let i = 0; i < this.INPUT_SIZE * this.INPUT_SIZE; i++) {
            const pixelIndex = i * 4;
            const tensorIndex = i;
            
            // Normalize to [0, 1] and convert to CHW format
            tensorData[tensorIndex] = pixels[pixelIndex] / 255.0; // R
            tensorData[tensorIndex + this.INPUT_SIZE * this.INPUT_SIZE] = pixels[pixelIndex + 1] / 255.0; // G
            tensorData[tensorIndex + 2 * this.INPUT_SIZE * this.INPUT_SIZE] = pixels[pixelIndex + 2] / 255.0; // B
          }
          
          const tensor = new ort.Tensor('float32', tensorData, [1, 3, this.INPUT_SIZE, this.INPUT_SIZE]);
          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private postprocess(output: Float32Array, outputShape: number[]): Detection[] {
    const detections: Detection[] = [];
    const [, totalOutputs, numDetections] = outputShape;
    
    // YOLOv11 output format: [x, y, w, h, conf_class1, conf_class2, ...]
    // where totalOutputs = 4 (bbox) + num_classes (5) = 9
    
    // Process each detection
    for (let i = 0; i < numDetections; i++) {
      const startIdx = i * totalOutputs;
      
      // Extract box coordinates (already in center format, normalized to input size)
      const centerX = output[startIdx] * this.INPUT_SIZE;
      const centerY = output[startIdx + 1] * this.INPUT_SIZE;
      const width = output[startIdx + 2] * this.INPUT_SIZE;
      const height = output[startIdx + 3] * this.INPUT_SIZE;
      
      // Find the class with highest confidence (starting from index 4)
      let maxConfidence = 0;
      let classIndex = 0;
      
      for (let j = 4; j < totalOutputs; j++) {
        const classConf = output[startIdx + j];
        if (classConf > maxConfidence) {
          maxConfidence = classConf;
          classIndex = j - 4;
        }
      }
      
      // Skip detections below confidence threshold
      if (maxConfidence < this.CONFIDENCE_THRESHOLD) continue;
      
      // Convert from center coordinates to top-left coordinates
      const x = centerX - width / 2;
      const y = centerY - height / 2;
      
      detections.push({
        bbox: [Math.max(0, x), Math.max(0, y), width, height],
        confidence: maxConfidence,
        class: this.CLASS_NAMES[classIndex as keyof typeof this.CLASS_NAMES] || `Class_${classIndex}`
      });
    }
    
    console.log(`Found ${detections.length} detections before NMS`);
    
    // Apply Non-Maximum Suppression (NMS)
    const finalDetections = this.applyNMS(detections);
    console.log(`Final detections after NMS: ${finalDetections.length}`);
    
    return finalDetections;
  }

  private applyNMS(detections: Detection[]): Detection[] {
    // Sort by confidence in descending order
    detections.sort((a, b) => b.confidence - a.confidence);
    
    const result: Detection[] = [];
    
    for (const detection of detections) {
      let shouldKeep = true;
      
      for (const kept of result) {
        const iou = this.calculateIOU(detection.bbox, kept.bbox);
        if (iou > this.IOU_THRESHOLD) {
          shouldKeep = false;
          break;
        }
      }
      
      if (shouldKeep) {
        result.push(detection);
      }
    }
    
    return result;
  }

  private calculateIOU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
    const [x1A, y1A, wA, hA] = boxA;
    const [x1B, y1B, wB, hB] = boxB;
    
    const x2A = x1A + wA;
    const y2A = y1A + hA;
    const x2B = x1B + wB;
    const y2B = y1B + hB;
    
    // Calculate intersection
    const xLeft = Math.max(x1A, x1B);
    const yTop = Math.max(y1A, y1B);
    const xRight = Math.min(x2A, x2B);
    const yBottom = Math.min(y2A, y2B);
    
    if (xRight < xLeft || yBottom < yTop) {
      return 0; // No intersection
    }
    
    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const boxAArea = wA * hA;
    const boxBArea = wB * hB;
    const unionArea = boxAArea + boxBArea - intersectionArea;
    
    return intersectionArea / unionArea;
  }
}

// Export singleton instance
export const yoloInference = new YOLOInference();