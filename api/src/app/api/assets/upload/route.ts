import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, validateImageFile } from '@/lib/r2/client';
import { db } from '@/lib/supabase/client';
import { API_CONFIG } from '@/lib/config';
import { imageProcessor } from '@/lib/image-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || '00000000-0000-0000-0000-000000000001'; // MVP default user

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSizeBytes = API_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max size: ${API_CONFIG.MAX_UPLOAD_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Validate image file
    const validation = validateImageFile(originalBuffer, file.name);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Process image for TikTok optimization
    const processedImage = await imageProcessor.processForTikTok(originalBuffer);
    
    // Generate processed filename
    const fileExtension = processedImage.format;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const processedFileName = `${baseName}_processed.${fileExtension}`;

    // Upload processed image to R2
    const uploadResult = await uploadToR2(
      processedImage.buffer,
      processedFileName,
      userId,
      `image/${processedImage.format}`
    );

    // Save to database with processing info
    const asset = await db.createAsset({
      user_id: userId,
      r2_url: uploadResult.url,
      file_type: 'image',
      original_filename: file.name,
      file_size: processedImage.size,
      upload_method: 'single',
      analysis_status: 'pending'
    });

    // Trigger async analysis (fire and forget)
    fetch(`${request.nextUrl.origin}/api/assets/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    }).catch(error => {
      console.error('Failed to trigger analysis queue:', error);
    });

    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        r2_url: uploadResult.url,
        original_filename: file.name,
        file_size: processedImage.size,
        analysis_status: 'pending'
      },
      processing: {
        original_size: file.size,
        processed_size: processedImage.size,
        compression_ratio: processedImage.compressionRatio,
        dimensions: processedImage.dimensions
      },
      message: 'File uploaded and processed successfully. Analysis queued.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get upload form for testing
export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Famatic.app - Test Upload</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .upload-form { border: 2px dashed #ccc; padding: 30px; text-align: center; border-radius: 10px; }
        input[type="file"] { margin: 20px 0; }
        button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0051cc; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h1>🎨 Famatic.app Test Upload</h1>
    <div class="upload-form">
        <h3>Upload Test Image</h3>
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" id="fileInput" accept="image/*" required>
            <br>
            <button type="submit">Upload Image</button>
        </form>
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('fileInput');
            const result = document.getElementById('result');
            
            if (!fileInput.files[0]) {
                result.innerHTML = '<div class="error">Please select a file</div>';
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            result.innerHTML = '<div>Uploading...</div>';
            
            try {
                const response = await fetch('/api/assets/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success">
                            <h4>✅ Upload Successful!</h4>
                            <p><strong>Asset ID:</strong> \${data.asset.id}</p>
                            <p><strong>File:</strong> \${data.asset.original_filename}</p>
                            <p><strong>Size:</strong> \${(data.asset.file_size / 1024).toFixed(1)} KB</p>
                            <p><strong>Status:</strong> \${data.asset.analysis_status}</p>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Upload failed: \${error.message}</div>\`;
            }
        });
    </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}