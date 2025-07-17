import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

interface SlideUpdateData {
  asset_id: string;
  text?: string;
  position?: number;
  style?: any;
  textPosition?: { x: number; y: number };
  textScale?: number;
  textRotation?: number;
}

interface SlideshowUpdateRequest {
  slideshowId: string;
  slides?: SlideUpdateData[];
  title?: string;
  caption?: string;
  hashtags?: string[];
  viralHook?: string;
  viralScore?: number;
}

export async function PUT(request: NextRequest) {
  try {
    const body: SlideshowUpdateRequest = await request.json();
    const { slideshowId, slides, title, caption, hashtags, viralHook, viralScore } = body;

    console.log(`🔄 Updating slideshow ${slideshowId}`, {
      slidesCount: slides?.length,
      hasTitle: !!title,
      hasCaption: !!caption,
      hasHashtags: !!hashtags,
      hasViralHook: !!viralHook,
      hasViralScore: !!viralScore
    });
    
    if (slides && slides.length > 0) {
      console.log('📝 First slide data:', JSON.stringify(slides[0], null, 2));
    }

    if (!slideshowId) {
      return NextResponse.json(
        { error: 'Slideshow ID is required' },
        { status: 400 }
      );
    }

    // Build update object dynamically
    const updateData: any = {};
    
    if (slides) {
      updateData.slides = slides;
    }
    if (title !== undefined) {
      updateData.title = title;
    }
    if (caption !== undefined) {
      updateData.generated_caption = caption;
    }
    if (hashtags !== undefined) {
      updateData.hashtags = hashtags;
    }
    if (viralHook !== undefined) {
      updateData.viral_hook = viralHook;
    }
    if (viralScore !== undefined) {
      updateData.estimated_viral_score = viralScore;
    }

    // Note: slideshows table doesn't have updated_at column, so we skip this
    // updateData.updated_at = new Date().toISOString();

    console.log('Slideshow update data:', updateData);

    // Update the slideshow in database
    const { data, error } = await supabaseAdmin
      .from('slideshows')
      .update(updateData)
      .eq('id', slideshowId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update slideshow:', error);
      return NextResponse.json(
        { error: 'Failed to update slideshow', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Slideshow not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Successfully updated slideshow ${slideshowId}`);
    console.log('📊 Updated slideshow data:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      slideshow: data,
      message: 'Slideshow updated successfully'
    });

  } catch (error) {
    console.error('Slideshow update error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update slideshow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}