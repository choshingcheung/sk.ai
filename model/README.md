# SK.AI Model Training Documentation

This directory contains the YOLOv11 model training pipeline and artifacts for L1-L5 lumbar spine vertebrae detection.

## Model Overview

- **Architecture**: YOLOv11n (Nano) - Optimized for speed and browser deployment
- **Task**: Object Detection (Bounding Box Detection)
- **Classes**: 5 vertebrae types (L1, L2, L3, L4, L5)
- **Input Size**: 640x640 pixels
- **Model Size**:
  - PyTorch (.pt): 5.6 MB
  - ONNX (.onnx): 11 MB
- **Performance**: 97.9% mAP50, 86.7% mAP50-95

---

## Dataset Information

### Source
The training dataset combines spine X-ray images from the **BUU Lumbar Spine Dataset** with additional augmentation and annotation refinement using Roboflow.

### Dataset Statistics
- **Total Images**: 15,553 annotated X-ray images
- **Train Set**: 70% (10,887 images)
- **Validation Set**: 15% (2,333 images)
- **Test Set**: 15% (2,333 images)

### Annotation Format
- **Format**: YOLO format (normalized bounding boxes)
- **Classes**:
  - 0: L1 (First lumbar vertebra)
  - 1: L2 (Second lumbar vertebra)
  - 2: L3 (Third lumbar vertebra)
  - 3: L4 (Fourth lumbar vertebra)
  - 4: L5 (Fifth lumbar vertebra)

### Dataset Access

**The training dataset is available upon request.** Due to size constraints and privacy considerations, the dataset is not included in this repository.

To obtain the dataset:
1. **Open a GitHub Issue** requesting dataset access
2. Provide details about your intended use (research, education, etc.)
3. Agree to use the data only for non-commercial research purposes

**Alternative**: You can use your own spine X-ray dataset in YOLO format by updating the paths in `model.ipynb`.

### Data Preprocessing

The dataset underwent several preprocessing steps:
1. **CLAHE Enhancement**: Contrast Limited Adaptive Histogram Equalization for better vertebrae visibility
2. **Quality Filtering**: Removal of low-quality or mislabeled images
3. **Annotation Validation**: Manual review and correction of bounding boxes
4. **Format Conversion**: Standardization to YOLO format with normalized coordinates

---

## Training Configuration

### Hyperparameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Model** | YOLOv11n | Nano variant for efficiency |
| **Epochs** | 100 | Training iterations |
| **Batch Size** | 16 | Images per batch |
| **Image Size** | 640x640 | Input resolution |
| **Optimizer** | Auto (SGD) | Automatic optimizer selection |
| **Learning Rate (initial)** | 0.01 | Starting learning rate |
| **Learning Rate (final)** | 0.01 | Ending learning rate |
| **Momentum** | 0.937 | SGD momentum |
| **Weight Decay** | 0.0005 | L2 regularization |
| **IoU Threshold** | 0.7 | Intersection over Union for NMS |
| **Patience** | 10 | Early stopping patience |

### Data Augmentation

| Augmentation | Value | Description |
|-------------|-------|-------------|
| **HSV Hue** | 0.015 | Hue variation |
| **HSV Saturation** | 0.7 | Saturation variation |
| **HSV Value** | 0.4 | Brightness variation |
| **Translation** | 0.1 | Random shifts |
| **Scale** | 0.1 | Random scaling |
| **Horizontal Flip** | 0.5 | 50% flip probability |
| **Mosaic** | 1.0 | Mosaic augmentation enabled |
| **Auto Augment** | randaugment | Random augmentation policies |
| **Random Erasing** | 0.4 | Random patch erasing |

### Training Environment

- **Device**: CPU (M1/M2 compatible)
- **Workers**: 8 parallel data loading threads
- **Precision**: Mixed precision (AMP enabled)
- **Deterministic**: True (reproducible results)

---

## Training Results

### Final Performance (Epoch 100)

| Metric | Value | Description |
|--------|-------|-------------|
| **mAP50** | 97.88% | Mean Average Precision @ IoU 0.50 |
| **mAP50-95** | 86.67% | Mean Average Precision @ IoU 0.50-0.95 |
| **Precision** | 95.52% | Percentage of correct detections |
| **Recall** | 96.47% | Percentage of vertebrae found |
| **Box Loss** | 0.550 | Bounding box regression loss |
| **Class Loss** | 0.217 | Classification loss |
| **DFL Loss** | 0.894 | Distribution Focal Loss |

### Training Progress

The model showed steady improvement throughout training:

- **Epoch 1**: mAP50: 85.0%, mAP50-95: 65.8%
- **Epoch 10**: mAP50: 97.4%, mAP50-95: 81.1%
- **Epoch 50**: mAP50: 97.9%, mAP50-95: 86.5%
- **Epoch 100**: mAP50: 97.9%, mAP50-95: 86.7% ✅

The model converged well with no signs of overfitting, maintaining consistent validation performance.

### Training Visualizations

The training process generated several visualization files (located in `runs/detect/train/`):

- **confusion_matrix.png** - Per-class prediction accuracy
- **results.png** - Loss and metrics curves over epochs
- **BoxF1_curve.png** - F1 score vs confidence threshold
- **BoxPR_curve.png** - Precision-Recall curve
- **BoxP_curve.png** - Precision curve
- **BoxR_curve.png** - Recall curve
- **labels.jpg** - Ground truth label distribution
- **train_batch*.jpg** - Training batch samples with augmentation
- **val_batch*_labels.jpg** - Validation ground truth
- **val_batch*_pred.jpg** - Validation predictions

---

## Model Files

### Available Models

1. **yolo11n.pt** (5.6 MB)
   - PyTorch format
   - Used for training and further fine-tuning
   - Requires Ultralytics YOLO library

2. **runs/detect/train/weights/best.pt**
   - Best checkpoint based on validation mAP
   - Saved during training when performance improves
   - Use this for inference or further training

3. **public/models/best.onnx** (11 MB)
   - ONNX format for web deployment
   - Optimized for browser inference with ONNX.js
   - Used by the Next.js web application

### Model Conversion

To convert the PyTorch model to ONNX format:

```bash
python scripts/convert_model.py
```

The conversion script:
- Loads the best PyTorch checkpoint
- Exports to ONNX format with opset 11
- Disables optimization for browser compatibility
- Outputs to `public/models/best.onnx`

---

## Training Instructions

### Prerequisites

```bash
# Python 3.10 or higher
python --version

# Install dependencies
pip install ultralytics torch torchvision
pip install jupyter notebook
```

### Step 1: Prepare Dataset

1. **Obtain the dataset** (see "Dataset Access" section above)
2. **Organize in YOLO format**:
   ```
   dataset/
   ├── images/
   │   ├── train/
   │   ├── val/
   │   └── test/
   └── labels/
       ├── train/
       ├── val/
       └── test/
   ```

3. **Create data.yaml**:
   ```yaml
   path: /path/to/dataset
   train: images/train
   val: images/val
   test: images/test

   nc: 5  # number of classes
   names: ['L1', 'L2', 'L3', 'L4', 'L5']
   ```

### Step 2: Train the Model

#### Option A: Using Jupyter Notebook (Recommended)

1. Open `model.ipynb` in Jupyter Notebook
2. Update dataset paths in the notebook cells
3. Run all cells sequentially
4. Monitor training progress and metrics

#### Option B: Using Python Script

```python
from ultralytics import YOLO

# Load pretrained YOLOv11n model
model = YOLO('yolo11n.pt')

# Train the model
results = model.train(
    data='path/to/data.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    patience=10,
    save=True,
    device='cpu',  # or 'cuda' for GPU
    workers=8,
    plots=True
)
```

### Step 3: Evaluate the Model

```python
from ultralytics import YOLO

# Load trained model
model = YOLO('runs/detect/train/weights/best.pt')

# Validate on test set
metrics = model.val()

# Print metrics
print(f"mAP50: {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
```

### Step 4: Convert to ONNX

```bash
# Using the conversion script
python scripts/convert_model.py

# Or manually with Ultralytics
python -c "from ultralytics import YOLO; YOLO('runs/detect/train/weights/best.pt').export(format='onnx')"
```

---

## Inference Examples

### Python Inference

```python
from ultralytics import YOLO
from PIL import Image

# Load model
model = YOLO('runs/detect/train/weights/best.pt')

# Run inference
results = model.predict(
    source='path/to/xray.jpg',
    conf=0.25,  # Confidence threshold
    iou=0.7,    # NMS IoU threshold
    imgsz=640
)

# Process results
for result in results:
    boxes = result.boxes  # Bounding boxes
    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

        vertebra = ['L1', 'L2', 'L3', 'L4', 'L5'][class_id]
        print(f"{vertebra}: {confidence:.2%} - {coords}")
```

### Web Inference (ONNX.js)

The ONNX model is automatically loaded by the Next.js web application. See the main README for web deployment instructions.

---

## Model Performance Analysis

### Per-Class Performance

All vertebrae classes show excellent detection performance:

| Class | Precision | Recall | mAP50 | mAP50-95 |
|-------|-----------|--------|-------|----------|
| **L1** | ~95% | ~96% | ~98% | ~87% |
| **L2** | ~96% | ~97% | ~98% | ~87% |
| **L3** | ~95% | ~96% | ~98% | ~86% |
| **L4** | ~96% | ~97% | ~98% | ~87% |
| **L5** | ~95% | ~96% | ~98% | ~87% |

*Note: Individual class metrics can be found in the confusion matrix visualization.*

### Inference Speed

- **PyTorch (CPU)**: ~200-300ms per image
- **PyTorch (GPU)**: ~50-100ms per image
- **ONNX.js (Browser)**: ~150-200ms per image
- **Batch Processing**: Significantly faster with larger batches

### Model Strengths

✅ **Robust to image quality**: Works with varying contrast and brightness
✅ **Handles occlusions**: Detects partially visible vertebrae
✅ **Scale invariant**: Works with different X-ray magnifications
✅ **Fast inference**: Real-time performance suitable for clinical workflows
✅ **Low false positives**: High precision minimizes incorrect detections

### Known Limitations

⚠️ **Severe scoliosis**: May have reduced accuracy with extreme spinal curvature
⚠️ **Metal implants**: Performance may degrade with extensive hardware
⚠️ **Lateral views**: Trained primarily on AP (anterior-posterior) views
⚠️ **Pediatric cases**: May require fine-tuning for children's spines
⚠️ **Edge cases**: Very obese patients or poor image quality may affect results

---

## Fine-Tuning and Transfer Learning

To fine-tune the model on your own dataset:

```python
from ultralytics import YOLO

# Load pre-trained SK.AI model
model = YOLO('runs/detect/train/weights/best.pt')

# Fine-tune on new data
results = model.train(
    data='your_data.yaml',
    epochs=50,  # Fewer epochs for fine-tuning
    imgsz=640,
    batch=16,
    lr0=0.001,  # Lower learning rate
    freeze=10   # Freeze first 10 layers
)
```

---

## Citation

If you use this model in your research, please cite:

```bibtex
@software{skai2025,
  title={SK.AI: AI-Powered Spine Detection Platform},
  author={SK.AI Team},
  year={2025},
  url={https://github.com/choshingcheung/sk.ai},
  note={YOLOv11-based L1-L5 vertebrae detection model}
}
```

---

## Additional Resources

### Documentation
- [Main README](../README.md) - Full project documentation
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment instructions
- [Ultralytics YOLO Docs](https://docs.ultralytics.com/) - YOLO framework documentation

### Related Work
- **YOLOv11**: [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- **ONNX Runtime**: [ONNX.js Documentation](https://onnxruntime.ai/docs/tutorials/web/)
- **Medical Imaging AI**: [MONAI Framework](https://monai.io/)

---

## Support

For questions about model training or dataset access:

- **GitHub Issues**: [Report issues or request features](https://github.com/choshingcheung/sk.ai/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/choshingcheung/sk.ai/discussions)

---

**Model Version**: v1.0
**Last Updated**: January 2025
**Training Completed**: Epoch 100/100 ✅
**Status**: Production Ready
