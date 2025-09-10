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
      
      // Only configure ONNX Runtime in browser environment
      if (typeof window !== 'undefined') {
        // Try different WASM path configurations
        try {
          // First try: Use matching version WASM files
          ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
        } catch (e) {
          // Fallback: Use relative paths
          ort.env.wasm.wasmPaths = '/';
        }
        
        // Conservative configuration for compatibility
        ort.env.wasm.numThreads = 1;
        ort.env.wasm.simd = false; // Disable SIMD for compatibility
        ort.env.wasm.proxy = false;
        ort.env.logLevel = 'verbose'; // More verbose logging for debugging
      }
      
      // Try multiple loading approaches
      let modelData: ArrayBuffer | string;
      
      try {
        console.log('Fetching model file...');
        const response = await fetch(this.MODEL_PATH);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        modelData = await response.arrayBuffer();
        console.log(`Model fetched: ${modelData.byteLength} bytes`);
      } catch (fetchError) {
        console.error('Failed to fetch model:', fetchError);
        throw new Error(`Cannot fetch model file: ${fetchError}`);
      }
      
      // Try creating session with minimal configuration
      console.log('Creating ONNX inference session...');
      
      try {
        // Approach 1: Minimal configuration
        this.session = await ort.InferenceSession.create(modelData, {
          executionProviders: ['wasm']
        });
      } catch (minimalError) {
        console.log('Minimal config failed, trying with more options...');
        
        try {
          // Approach 2: More explicit configuration
          this.session = await ort.InferenceSession.create(modelData, {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'disabled',
            executionMode: 'sequential'
          });
        } catch (explicitError) {
          console.log('Explicit config failed, trying URL approach...');
          
          // Approach 3: Try loading from URL instead of buffer
          this.session = await ort.InferenceSession.create(this.MODEL_PATH, {
            executionProviders: ['wasm']
          });
        }
      }
      
      if (!this.session) {
        throw new Error('Failed to create inference session with any method');
      }
      
      this.modelLoaded = true;
      console.log('✓ YOLO model loaded successfully!');
      console.log('Session info:', {
        inputNames: this.session.inputNames,
        outputNames: this.session.outputNames
      });
      
    } catch (error) {
      console.error('ONNX Model loading failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Detailed error info:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack',
        type: error instanceof Error ? error.constructor.name : typeof error,
        modelPath: this.MODEL_PATH,
        onnxVersion: '1.19.2',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server'
      });
      
      // Don't throw - let the fallback system handle it
      this.modelLoaded = false;
      console.log('Model loading failed - fallback demo mode will be used');
    }
  }

  async predict(imageUrl: string): Promise<Detection[]> {
    if (!this.session) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    try {
      // Preprocess image
      const inputTensor = await this.preprocessImage(imageUrl);
      
      // Run inference with proper input name
      const inputName = this.session.inputNames[0] || 'images';
      const feeds = { [inputName]: inputTensor };
      const results = await this.session.run(feeds);
      
      // Get output tensor - try different common output names
      const outputName = this.session.outputNames[0];
      const output = results[outputName] || results.output0 || results.output;
      
      if (!output) {
        console.error('Available outputs:', Object.keys(results));
        throw new Error(`No output found. Available outputs: ${Object.keys(results).join(', ')}`);
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
    
    console.log('Output shape:', outputShape);
    console.log('Output sample (first 20 values):', Array.from(output.slice(0, 20)));
    
    // YOLOv11 output format: [batch, 4+classes, detections] = [1, 9, 8400]
    // Transposed format: [x_center, y_center, width, height, class0_conf, class1_conf, ...]
    const [batch, channels, numDetections] = outputShape;
    const numClasses = channels - 4; // 9 - 4 = 5 classes
    
    console.log(`Processing ${numDetections} detections with ${numClasses} classes`);
    
    // Process each detection
    for (let i = 0; i < numDetections; i++) {
      // YOLOv11 uses transposed output: data is organized as [all_x, all_y, all_w, all_h, all_class0, all_class1, ...]
      const x_center = output[i]; // First numDetections values are x coordinates
      const y_center = output[numDetections + i]; // Next numDetections values are y coordinates  
      const width = output[2 * numDetections + i]; // Width values
      const height = output[3 * numDetections + i]; // Height values
      
      // Find the class with highest confidence
      let maxConfidence = 0;
      let classIndex = 0;
      
      for (let c = 0; c < numClasses; c++) {
        const classConf = output[(4 + c) * numDetections + i];
        if (classConf > maxConfidence) {
          maxConfidence = classConf;
          classIndex = c;
        }
      }
      
      // Skip detections below confidence threshold
      if (maxConfidence < this.CONFIDENCE_THRESHOLD) continue;
      
      // YOLO coordinates are already in pixel coordinates relative to 640x640 input
      // No need to multiply by INPUT_SIZE again
      const centerX = x_center;
      const centerY = y_center;  
      const w = width;
      const h = height;
      
      // Convert from center coordinates to top-left coordinates
      const x = centerX - w / 2;
      const y = centerY - h / 2;
      
      const detection = {
        bbox: [Math.max(0, x), Math.max(0, y), w, h] as [number, number, number, number],
        confidence: maxConfidence,
        class: this.CLASS_NAMES[classIndex as keyof typeof this.CLASS_NAMES] || `Class_${classIndex}`
      };
      
      console.log(`Detection ${detections.length}: raw=[${x_center.toFixed(3)}, ${y_center.toFixed(3)}, ${width.toFixed(3)}, ${height.toFixed(3)}] pixel=[${centerX.toFixed(1)}, ${centerY.toFixed(1)}, ${w.toFixed(1)}, ${h.toFixed(1)}] bbox=[${detection.bbox[0].toFixed(1)}, ${detection.bbox[1].toFixed(1)}, ${detection.bbox[2].toFixed(1)}, ${detection.bbox[3].toFixed(1)}] conf=${(maxConfidence*100).toFixed(1)}% class=${detection.class}`);
      
      detections.push(detection);
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