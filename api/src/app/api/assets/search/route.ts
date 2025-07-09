import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001'; // MVP default user
    const query = searchParams.get('q') || '';
    
    // Parse filters
    const filters: any = {};
    
    const emotions = searchParams.get('emotions');
    if (emotions) {
      filters.emotions = emotions.split(',').map(e => e.trim());
    }
    
    const contentType = searchParams.get('contentType');
    if (contentType) {
      filters.contentType = contentType;
    }
    
    const minViralScore = searchParams.get('minViralScore');
    if (minViralScore) {
      filters.minViralScore = parseFloat(minViralScore);
    }
    
    const maxViralScore = searchParams.get('maxViralScore');
    if (maxViralScore) {
      filters.maxViralScore = parseFloat(maxViralScore);
    }
    
    const analysisStatus = searchParams.get('analysisStatus');
    if (analysisStatus) {
      filters.analysisStatus = analysisStatus;
    }

    // Search assets
    const assets = await db.searchAssets(userId, query, filters);

    return NextResponse.json({
      success: true,
      assets,
      total: assets.length,
      query,
      filters,
      message: 'Search completed successfully'
    });

  } catch (error) {
    console.error('Search assets error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}