#!/usr/bin/env python3
"""
Convert YOLO PyTorch model to ONNX format for web deployment.
"""

import sys
import os
from pathlib import Path

# Add the yolo project path to sys.path to import ultralytics
sys.path.append(str(Path(__file__).parent.parent.parent.parent / "yolo_v1"))

try:
    from ultralytics import YOLO
    print("✓ Ultralytics imported successfully")
except ImportError as e:
    print(f"✗ Failed to import ultralytics: {e}")
    print("Please install ultralytics: pip install ultralytics")
    sys.exit(1)

def convert_model():
    # Path to the trained model
    model_path = Path(__file__).parent.parent.parent.parent / "yolo_v1/combine/out/runs/detect/l1_l5_combined/weights/best.pt"
    output_dir = Path(__file__).parent.parent / "public/models"
    
    print(f"Model path: {model_path}")
    print(f"Output directory: {output_dir}")
    
    # Check if model exists
    if not model_path.exists():
        print(f"✗ Model not found at {model_path}")
        sys.exit(1)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Load the YOLO model
        print("Loading YOLO model...")
        model = YOLO(str(model_path))
        
        # Export to ONNX with maximum compatibility
        print("Exporting model to ONNX format...")
        onnx_path = model.export(
            format="onnx",
            imgsz=640,  # Input image size
            optimize=False,  # Disable all optimizations
            half=False,  # Use FP32 for maximum compatibility
            dynamic=False,  # Fixed input size
            simplify=False,  # No graph simplification
            opset=11,  # Use older opset for better compatibility
            verbose=True,  # Verbose output
            batch=1  # Ensure batch size is 1
        )
        
        # Move the exported file to our public directory
        import shutil
        final_path = output_dir / "best.onnx"
        shutil.move(onnx_path, final_path)
        
        print(f"✓ Model successfully converted to: {final_path}")
        print(f"✓ Model size: {final_path.stat().st_size / (1024*1024):.2f} MB")
        
        # Get model info
        print("\nModel Information:")
        print(f"- Input size: 640x640")
        print(f"- Classes: {model.names}")
        print(f"- Number of classes: {len(model.names)}")
        
        return str(final_path)
        
    except Exception as e:
        print(f"✗ Error during conversion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    convert_model()