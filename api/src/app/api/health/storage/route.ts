import { NextRequest, NextResponse } from 'next/server';
import { testR2Connection } from '../../../../lib/r2/client';

export async function GET(request: NextRequest) {
  try {
    const result = await testR2Connection();

    return NextResponse.json({
      status: result.connected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      storage: {
        r2: {
          connected: result.connected,
          error: result.error,
          bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'not configured',
          endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ? 'configured' : 'missing'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Storage health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}