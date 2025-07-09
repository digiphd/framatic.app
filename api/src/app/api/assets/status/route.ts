import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

    // Get analysis status counts
    const assets = await db.getAllAssets(userId, 100);
    
    const statusCounts = assets.reduce((acc, asset) => {
      acc[asset.analysis_status] = (acc[asset.analysis_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent processing times and success rates
    const recentAssets = assets.slice(0, 10);
    const averageViralScore = assets
      .filter(a => a.viral_potential_score !== null)
      .reduce((sum, a) => sum + (a.viral_potential_score || 0), 0) / 
      assets.filter(a => a.viral_potential_score !== null).length || 0;

    return NextResponse.json({
      success: true,
      userId,
      totalAssets: assets.length,
      statusCounts,
      averageViralScore: averageViralScore.toFixed(2),
      recentAssets: recentAssets.map(asset => ({
        id: asset.id,
        filename: asset.original_filename,
        status: asset.analysis_status,
        viral_score: asset.viral_potential_score,
        quality_score: asset.quality_score,
        created_at: asset.created_at,
        has_analysis: !!asset.ai_analysis
      }))
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get asset status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}