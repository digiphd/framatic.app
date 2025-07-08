import { NextRequest, NextResponse } from 'next/server';
import { openRouter } from '../../../lib/openrouter/client';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Famatic.app - AI Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .test-section { border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px; }
        button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #0051cc; }
        .result { margin-top: 15px; padding: 15px; border-radius: 5px; background: #f8f9fa; }
        .loading { color: #666; font-style: italic; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        textarea { width: 100%; height: 100px; margin: 10px 0; }
        input[type="url"] { width: 100%; margin: 10px 0; padding: 5px; }
    </style>
</head>
<body>
    <h1>🤖 Famatic.app AI Test Suite</h1>
    
    <div class="test-section">
        <h3>🔗 AI Connection Test</h3>
        <button onclick="testConnection()">Test OpenRouter Connection</button>
        <div id="connectionResult" class="result" style="display:none;"></div>
    </div>

    <div class="test-section">
        <h3>🖼️ Image Analysis Test</h3>
        <input type="url" id="imageUrl" placeholder="Enter image URL..." value="https://images.unsplash.com/photo-1494790108755-2616b612b47c">
        <br>
        <button onclick="testImageAnalysis()">Analyze Image</button>
        <div id="imageResult" class="result" style="display:none;"></div>
    </div>

    <div class="test-section">
        <h3>✏️ Caption Generation Test</h3>
        <textarea id="voiceInput" placeholder="Enter voice input/prompt...">Create a morning routine slideshow with motivational vibes</textarea>
        <br>
        <button onclick="testCaptionGeneration()">Generate Caption</button>
        <div id="captionResult" class="result" style="display:none;"></div>
    </div>

    <script>
        async function testConnection() {
            const result = document.getElementById('connectionResult');
            result.style.display = 'block';
            result.innerHTML = '<div class="loading">Testing OpenRouter connection...</div>';
            
            try {
                const response = await fetch('/api/health/ai');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    result.innerHTML = \`
                        <div class="success">
                            <h4>✅ OpenRouter Connected!</h4>
                            <p><strong>Status:</strong> \${data.ai.openrouter.connected ? 'Connected' : 'Failed'}</p>
                            <p><strong>API Key:</strong> \${data.ai.openrouter.api_key}</p>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ Connection failed: \${data.error || 'Unknown error'}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Test failed: \${error.message}</div>\`;
            }
        }

        async function testImageAnalysis() {
            const imageUrl = document.getElementById('imageUrl').value;
            const result = document.getElementById('imageResult');
            
            if (!imageUrl) {
                result.innerHTML = '<div class="error">Please enter an image URL</div>';
                result.style.display = 'block';
                return;
            }
            
            result.style.display = 'block';
            result.innerHTML = '<div class="loading">Analyzing image...</div>';
            
            try {
                const response = await fetch('/api/ai/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'analyzeImage', imageUrl })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success">
                            <h4>✅ Analysis Complete!</h4>
                            <pre>\${JSON.stringify(data.analysis, null, 2)}</pre>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Analysis failed: \${error.message}</div>\`;
            }
        }

        async function testCaptionGeneration() {
            const voiceInput = document.getElementById('voiceInput').value;
            const result = document.getElementById('captionResult');
            
            result.style.display = 'block';
            result.innerHTML = '<div class="loading">Generating caption...</div>';
            
            try {
                const response = await fetch('/api/ai/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'generateCaption', 
                        voiceInput,
                        template: 'day_in_life'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success">
                            <h4>✅ Caption Generated!</h4>
                            <p><strong>Hook:</strong> \${data.result.hook}</p>
                            <p><strong>Caption:</strong> \${data.result.caption}</p>
                            <p><strong>Hashtags:</strong> \${data.result.hashtags.join(' ')}</p>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Generation failed: \${error.message}</div>\`;
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

export async function POST(request: NextRequest) {
  try {
    const { action, imageUrl, voiceInput, template } = await request.json();

    switch (action) {
      case 'analyzeImage':
        if (!imageUrl) {
          return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
        }
        
        const analysis = await openRouter.analyzeImage(imageUrl);
        return NextResponse.json({ success: true, analysis });

      case 'generateCaption':
        const mockImageAnalysis = [
          {
            emotions: ['authentic', 'happy', 'lifestyle'],
            scene_description: 'Person enjoying morning routine',
            tags: ['morning', 'coffee', 'routine']
          }
        ];
        
        const result = await openRouter.generateCaption(
          template || 'day_in_life',
          mockImageAnalysis,
          voiceInput
        );
        
        return NextResponse.json({ success: true, result });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}