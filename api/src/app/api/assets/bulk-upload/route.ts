import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, validateImageFile } from '@/lib/r2/client';
import { db } from '@/lib/supabase/client';
import { API_CONFIG } from '@/lib/config';
import { imageProcessor } from '@/lib/image-processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string || '00000000-0000-0000-0000-000000000001'; // MVP default user

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file count (max 20 files for bulk upload)
    const maxFiles = 20;
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${maxFiles} files allowed per batch` },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];
    const maxSizeBytes = API_CONFIG.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

    // Process files in parallel (but with reasonable concurrency)
    const processFile = async (file: File, index: number) => {
      try {
        // Validate file size
        if (file.size > maxSizeBytes) {
          throw new Error(`File ${file.name} too large. Max size: ${API_CONFIG.MAX_UPLOAD_SIZE_MB}MB`);
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // Validate image file
        const validation = validateImageFile(originalBuffer, file.name);
        if (!validation.isValid) {
          throw new Error(`Invalid file ${file.name}: ${validation.error}`);
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
          upload_method: 'bulk',
          analysis_status: 'pending'
        });

        return {
          index,
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
          }
        };

      } catch (error) {
        return {
          index,
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    };

    // Process files with concurrency limit of 5
    const concurrencyLimit = 5;
    const filePromises = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map((file, batchIndex) => 
        processFile(file, i + batchIndex)
      );
      
      const batchResults = await Promise.all(batchPromises);
      filePromises.push(...batchResults);
    }

    // Separate successful uploads from errors
    for (const result of filePromises) {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
      }
    }

    // Trigger async analysis for uploaded assets (fire and forget)
    if (results.length > 0) {
      fetch(`${request.nextUrl.origin}/api/assets/process-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      }).catch(error => {
        console.error('Failed to trigger analysis queue:', error);
      });
    }

    const response = {
      success: results.length > 0,
      uploaded: results.length,
      total: files.length,
      failed: errors.length,
      assets: results.map(r => r.asset),
      errors: errors,
      message: `Bulk upload completed. ${results.length}/${files.length} files uploaded successfully.`
    };

    // Return 207 Multi-Status if there are partial failures
    const statusCode = errors.length > 0 && results.length > 0 ? 207 : 
                       errors.length > 0 ? 400 : 200;

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { 
        error: 'Bulk upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get bulk upload form for testing
export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Famatic.app - Test Bulk Upload</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .upload-form { border: 2px dashed #ccc; padding: 30px; text-align: center; border-radius: 10px; }
        input[type="file"] { margin: 20px 0; }
        button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0051cc; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .partial { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .progress { margin-top: 10px; }
        .file-result { margin: 5px 0; padding: 5px; border-radius: 3px; }
        .file-success { background: #d4edda; }
        .file-error { background: #f8d7da; }
    </style>
</head>
<body>
    <h1>🎨 Famatic.app Bulk Upload Test</h1>
    <div class="upload-form">
        <h3>Upload Multiple Images</h3>
        <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" id="fileInput" accept="image/*" multiple required>
            <br>
            <div id="fileCount" style="margin: 10px 0; color: #666;"></div>
            <button type="submit" id="uploadBtn">Upload Images</button>
        </form>
        <div id="progress" class="progress" style="display: none;">
            <div>Uploading... Please wait</div>
        </div>
        <div id="result"></div>
    </div>

    <script>
        const fileInput = document.getElementById('fileInput');
        const fileCount = document.getElementById('fileCount');
        const uploadBtn = document.getElementById('uploadBtn');
        const progress = document.getElementById('progress');
        const result = document.getElementById('result');

        fileInput.addEventListener('change', () => {
            const files = fileInput.files;
            if (files.length > 0) {
                fileCount.textContent = \`Selected: \${files.length} file\${files.length > 1 ? 's' : ''}\`;
                if (files.length > 20) {
                    fileCount.textContent += ' (Max 20 files allowed)';
                    fileCount.style.color = '#dc3545';
                    uploadBtn.disabled = true;
                } else {
                    fileCount.style.color = '#666';
                    uploadBtn.disabled = false;
                }
            }
        });

        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const files = fileInput.files;
            if (!files || files.length === 0) {
                result.innerHTML = '<div class="error">Please select files</div>';
                return;
            }

            if (files.length > 20) {
                result.innerHTML = '<div class="error">Maximum 20 files allowed</div>';
                return;
            }
            
            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }
            
            progress.style.display = 'block';
            result.innerHTML = '';
            uploadBtn.disabled = true;
            
            try {
                const response = await fetch('/api/assets/bulk-upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                let resultClass = 'success';
                if (data.failed > 0 && data.uploaded > 0) {
                    resultClass = 'partial';
                } else if (data.failed > 0) {
                    resultClass = 'error';
                }
                
                let resultHtml = \`
                    <div class="\${resultClass}">
                        <h4>📊 Bulk Upload Results</h4>
                        <p><strong>Total Files:</strong> \${data.total}</p>
                        <p><strong>Uploaded:</strong> \${data.uploaded}</p>
                        <p><strong>Failed:</strong> \${data.failed}</p>
                        <p><strong>Message:</strong> \${data.message}</p>
                    </div>
                \`;
                
                if (data.assets && data.assets.length > 0) {
                    resultHtml += '<h4>✅ Successfully Uploaded:</h4>';
                    data.assets.forEach(asset => {
                        resultHtml += \`
                            <div class="file-result file-success">
                                <strong>\${asset.original_filename}</strong> 
                                (\${(asset.file_size / 1024).toFixed(1)} KB) - 
                                Status: \${asset.analysis_status}
                            </div>
                        \`;
                    });
                }
                
                if (data.errors && data.errors.length > 0) {
                    resultHtml += '<h4>❌ Failed Uploads:</h4>';
                    data.errors.forEach(error => {
                        resultHtml += \`
                            <div class="file-result file-error">
                                <strong>\${error.filename}</strong> - 
                                Error: \${error.error}
                            </div>
                        \`;
                    });
                }
                
                result.innerHTML = resultHtml;
                
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Upload failed: \${error.message}</div>\`;
            } finally {
                progress.style.display = 'none';
                uploadBtn.disabled = false;
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