import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2/client';
import { db } from '@/lib/supabase/client';
import { imageProcessor } from '@/lib/image-processor';

export async function POST(request: NextRequest) {
  try {
    const userId = '00000000-0000-0000-0000-000000000001';
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // width=1, height=1
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // 8-bit RGBA
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // compressed data
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // checksum
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
      0x42, 0x60, 0x82
    ]);

    // Process the test image
    const processedImage = await imageProcessor.processForTikTok(testImageBuffer);
    
    // Upload to R2
    const uploadResult = await uploadToR2(
      processedImage.buffer,
      'test-image.jpeg',
      userId,
      'image/jpeg'
    );

    // Save to database
    const asset = await db.createAsset({
      user_id: userId,
      r2_url: uploadResult.url,
      file_type: 'image',
      original_filename: 'test-image.png',
      file_size: processedImage.size,
      upload_method: 'single',
      analysis_status: 'pending'
    });

    // Trigger analysis
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/assets/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    const analysisResult = await analysisResponse.json();

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        r2_url: uploadResult.url,
        original_filename: 'test-image.png',
        file_size: processedImage.size,
        analysis_status: 'pending'
      },
      analysis_triggered: analysisResult.success,
      message: 'Test image uploaded and analysis triggered'
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { 
        error: 'Test upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Sample Upload</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
        button:hover { background: #0051cc; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h1>🧪 Test Sample Upload</h1>
    <p>This will upload a test image and trigger AI analysis.</p>
    <button onclick="uploadSample()">Upload Test Image</button>
    <button onclick="checkLibrary()">Check Library</button>
    <button onclick="checkQueue()">Process Queue</button>
    <div id="result"></div>

    <script>
        async function uploadSample() {
            const result = document.getElementById('result');
            result.innerHTML = '<div>Uploading test image...</div>';
            
            try {
                const response = await fetch('/api/test/upload-sample', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success">
                            <h4>✅ Test Upload Successful!</h4>
                            <p><strong>Asset ID:</strong> \${data.asset.id}</p>
                            <p><strong>File Size:</strong> \${data.asset.file_size} bytes</p>
                            <p><strong>Status:</strong> \${data.asset.analysis_status}</p>
                            <p><strong>Analysis Triggered:</strong> \${data.analysis_triggered}</p>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Upload failed: \${error.message}</div>\`;
            }
        }

        async function checkLibrary() {
            const result = document.getElementById('result');
            result.innerHTML = '<div>Checking library...</div>';
            
            try {
                const response = await fetch('/api/assets/library');
                const data = await response.json();
                
                result.innerHTML = \`
                    <div class="success">
                        <h4>📚 Library Status</h4>
                        <p><strong>Total Assets:</strong> \${data.total}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Check failed: \${error.message}</div>\`;
            }
        }

        async function checkQueue() {
            const result = document.getElementById('result');
            result.innerHTML = '<div>Processing queue...</div>';
            
            try {
                const response = await fetch('/api/assets/process-queue', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000001' })
                });
                
                const data = await response.json();
                
                result.innerHTML = \`
                    <div class="success">
                        <h4>🔄 Queue Processing Result</h4>
                        <p><strong>Message:</strong> \${data.message}</p>
                        <p><strong>Processed:</strong> \${data.processed}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Queue processing failed: \${error.message}</div>\`;
            }
        }
    </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}