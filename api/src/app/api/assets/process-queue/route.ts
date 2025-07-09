import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const targetUserId = userId || '00000000-0000-0000-0000-000000000001';

    // Get pending assets for analysis (limit to 5 at a time)
    const { data: pendingAssets, error } = await supabaseAdmin
      .from('asset_library')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('analysis_status', 'pending')
      .limit(5);

    if (error) {
      throw new Error(`Failed to fetch pending assets: ${error.message}`);
    }

    if (!pendingAssets || pendingAssets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending assets to process',
        processed: 0
      });
    }

    // Call the batch analysis endpoint
    const assetIds = pendingAssets.map(asset => asset.id);
    
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/assets/analyze-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assetIds,
        userId: targetUserId
      })
    });

    const analysisResult = await analysisResponse.json();

    return NextResponse.json({
      success: true,
      message: `Queue processing completed. ${analysisResult.processed || 0} assets analyzed.`,
      processed: analysisResult.processed || 0,
      total: pendingAssets.length,
      failed: analysisResult.failed || 0,
      details: analysisResult
    });

  } catch (error) {
    console.error('Queue processing error:', error);
    return NextResponse.json(
      { 
        error: 'Queue processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Trigger queue processing for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

  try {
    // Call the POST endpoint to process the queue
    const response = await fetch(`${request.nextUrl.origin}/api/assets/process-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Famatic.app - Queue Processing</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .result { padding: 20px; border-radius: 10px; margin: 20px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        button { background: #0070f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 0; }
        button:hover { background: #0051cc; }
    </style>
</head>
<body>
    <h1>🔄 Famatic.app Queue Processing</h1>
    
    <div class="result ${result.success ? 'success' : 'error'}">
        <h3>${result.success ? '✅ Queue Processing Complete' : '❌ Queue Processing Failed'}</h3>
        <p><strong>Message:</strong> ${result.message}</p>
        ${result.processed ? `<p><strong>Processed:</strong> ${result.processed}</p>` : ''}
        ${result.total ? `<p><strong>Total:</strong> ${result.total}</p>` : ''}
        ${result.failed ? `<p><strong>Failed:</strong> ${result.failed}</p>` : ''}
        <p><strong>User ID:</strong> ${userId}</p>
    </div>

    <button onclick="location.reload()">Process Queue Again</button>
    <button onclick="window.location.href='/api/assets/status?userId=${userId}'">Check Status</button>
    <button onclick="window.location.href='/api/assets/library?userId=${userId}'">View Library</button>
</body>
</html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    return new Response(`
      <html>
        <body>
          <h1>Error</h1>
          <p>Failed to process queue: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}