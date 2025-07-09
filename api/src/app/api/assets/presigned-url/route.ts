import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUrl, extractKeyFromUrl } from '@/lib/r2/client';

export async function POST(request: NextRequest) {
  try {
    const { r2Url } = await request.json();
    
    if (!r2Url) {
      return NextResponse.json(
        { error: 'R2 URL is required' },
        { status: 400 }
      );
    }

    // Extract the key from the R2 URL
    const key = extractKeyFromUrl(r2Url);
    console.log('Original R2 URL:', r2Url);
    console.log('Extracted key:', key);
    console.log('Bucket name:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    
    // Generate presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUrl(key, 3600);
    
    return NextResponse.json({
      success: true,
      presignedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const r2Url = searchParams.get('url');
  
  if (!r2Url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    const key = extractKeyFromUrl(r2Url);
    const presignedUrl = await getPresignedUrl(key, 3600);
    
    return NextResponse.json({
      success: true,
      presignedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}