import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // For now, return mock detection data
    // This can be replaced with actual ONNX inference later
    const mockDetections = [
      { bbox: [150, 120, 80, 60], confidence: 0.94, class: 'L1' },
      { bbox: [145, 200, 85, 65], confidence: 0.89, class: 'L2' },
      { bbox: [140, 280, 90, 70], confidence: 0.91, class: 'L3' },
      { bbox: [135, 360, 95, 75], confidence: 0.87, class: 'L4' },
      { bbox: [130, 440, 100, 80], confidence: 0.93, class: 'L5' }
    ];

    return NextResponse.json({ 
      success: true, 
      detections: mockDetections,
      note: 'Server-side API route - using mock data for now'
    });

  } catch (error) {
    console.error('API detection error:', error);
    return NextResponse.json(
      { error: 'Detection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'SK.AI Detection API',
    version: '1.0',
    endpoints: ['POST /api/detect - Upload image for vertebrae detection']
  });
}