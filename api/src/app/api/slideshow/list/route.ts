import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching slideshows for user:', userId);

    // First get slideshows
    const { data: slideshows, error } = await supabaseAdmin
      .from('slideshows')
      .select(`
        id,
        title,
        template_used,
        generation_prompt,
        slides,
        viral_hook,
        generated_caption,
        hashtags,
        estimated_viral_score,
        actual_performance,
        creation_time_seconds,
        is_bulk_generated,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch slideshows:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch slideshows' },
        { status: 500 }
      );
    }

    // Get all unique asset IDs from all slideshows to resolve URLs
    const allAssetIds = new Set<string>();
    slideshows?.forEach(slideshow => {
      if (Array.isArray(slideshow.slides)) {
        slideshow.slides.forEach((slide: any) => {
          if (slide.asset_id) {
            allAssetIds.add(slide.asset_id);
          }
        });
      }
    });

    // Fetch all assets to resolve both ID and filename references
    let assetUrlMap = new Map<string, string>();
    
    // Get all assets for this user to handle both ID and filename lookups
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('asset_library')
      .select('id, r2_url, original_filename')
      .eq('user_id', userId);

    if (!assetsError && assets) {
      assets.forEach(asset => {
        // Map both asset ID and filename to R2 URL (normalize UUIDs to lowercase)
        assetUrlMap.set(asset.id.toLowerCase(), asset.r2_url);
        assetUrlMap.set(asset.id.toUpperCase(), asset.r2_url); // Handle both cases
        if (asset.original_filename) {
          assetUrlMap.set(asset.original_filename, asset.r2_url);
        }
      });
    } else {
      console.warn('Failed to fetch asset URLs:', assetsError);
    }

    // Transform the data to match the expected mobile format with resolved asset URLs
    const transformedSlideshows = slideshows?.map(slideshow => ({
      id: slideshow.id,
      title: slideshow.title,
      template: slideshow.template_used,
      viralHook: slideshow.viral_hook,
      caption: slideshow.generated_caption,
      created_at: slideshow.created_at,
      slides: Array.isArray(slideshow.slides) ? slideshow.slides.map((slide: any, index: number) => ({
        id: slide.id || `slide-${index}`,
        imageUrl: assetUrlMap.get(slide.asset_id) || '', // Resolve asset_id to R2 URL
        text: slide.text || '',
        textStyle: slide.style || slide.textStyle || {},
        textPosition: slide.textPosition || { x: 0.5, y: 0.3 },
        textScale: slide.textScale || 1,
        textRotation: slide.textRotation || 0,
        metadata: slide.metadata || {}
      })) : []
    })) || [];

    return NextResponse.json({
      success: true,
      slideshows: transformedSlideshows,
      total: transformedSlideshows.length
    });

  } catch (error) {
    console.error('List slideshows error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}