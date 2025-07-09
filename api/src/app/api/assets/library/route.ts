import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001'; // MVP default user
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'viral_potential_score';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get assets from database
    const assets = await db.getAnalyzedAssets(userId, limit, offset, sortBy, sortOrder);

    return NextResponse.json({
      success: true,
      assets,
      total: assets.length,
      message: 'Assets retrieved successfully'
    });

  } catch (error) {
    console.error('Get assets error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}