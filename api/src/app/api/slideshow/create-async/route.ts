import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { contextAwareAI } from '@/services/context-aware-ai';
import { ErrorHandlers } from '@/lib/error-handlers';

interface CreateAsyncSlideshowRequest {
  selected_asset_ids: string[];
  user_prompt?: string;
  template_preference?: string;
  max_slides?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body: CreateAsyncSlideshowRequest = await request.json();
    const { selected_asset_ids, user_prompt, template_preference, max_slides = 8 } = body;

    if (!selected_asset_ids || selected_asset_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No assets selected' },
        { status: 400 }
      );
    }

    console.log('Creating async slideshow for user:', userId);
    console.log('Selected assets:', selected_asset_ids);

    // Create slideshow record immediately with pending status
    const slideshowId = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin
      .from('slideshows')
      .insert({
        id: slideshowId,
        user_id: userId,
        title: 'Creating your slideshow...',
        template_used: 'pending',
        generation_prompt: user_prompt || 'Create an engaging slideshow',
        slides: [], // Will be populated when processing completes
        viral_hook: '',
        generated_caption: '',
        hashtags: [],
        estimated_viral_score: 0,
        creation_status: 'pending',
        creation_progress: 0,
        is_bulk_generated: selected_asset_ids.length > 5,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to create slideshow record:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create slideshow' },
        { status: 500 }
      );
    }

    // Start background processing (fire and forget)
    processSlideshow(slideshowId, userId, {
      selected_asset_ids,
      user_prompt,
      template_preference,
      max_slides
    }).catch(error => {
      console.error('Background processing failed:', error);
      // Update slideshow status to failed
      updateSlideshowStatus(slideshowId, 'failed', 0, error.message);
    });

    return NextResponse.json({
      success: true,
      slideshow_id: slideshowId,
      message: 'Slideshow creation started',
      estimated_completion_time: selected_asset_ids.length > 5 ? 30 : 15 // seconds
    });

  } catch (error) {
    console.error('Create async slideshow error:', error);
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

// Background processing function
async function processSlideshow(
  slideshowId: string,
  userId: string,
  options: {
    selected_asset_ids: string[];
    user_prompt?: string;
    template_preference?: string;
    max_slides?: number;
  }
) {
  const { selected_asset_ids, user_prompt, template_preference, max_slides = 8 } = options;

  try {
    // Update status to processing
    await updateSlideshowStatus(slideshowId, 'processing', 10);

    // Get user context
    const userContext = await supabaseAdmin
      .from('user_context')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userContext.data) {
      throw new Error('User context not found');
    }

    await updateSlideshowStatus(slideshowId, 'processing', 20);

    // Get selected assets with analysis
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('asset_library')
      .select('*')
      .in('id', selected_asset_ids)
      .eq('user_id', userId);

    if (assetsError) {
      throw new Error(`Failed to fetch assets: ${assetsError.message}`);
    }

    if (!assets || assets.length === 0) {
      throw new Error('No valid assets found');
    }

    // Check if all assets have completed analysis
    const pendingAssets = assets.filter(asset => 
      asset.analysis_status !== 'completed' || !asset.ai_analysis
    );

    if (pendingAssets.length > 0) {
      throw new Error(`${pendingAssets.length} assets are still being analyzed. Please wait.`);
    }

    await updateSlideshowStatus(slideshowId, 'processing', 40);

    // Generate slideshow using context-aware AI
    const slideshow = await contextAwareAI.generateContextAwareSlideshow({
      userContext: userContext.data,
      assets,
      userPrompt: options.user_prompt,
      templatePreference: options.template_preference,
      maxSlides: options.max_slides
    });

    await updateSlideshowStatus(slideshowId, 'processing', 80);

    // Update slideshow with generated content
    const { error: updateError } = await supabaseAdmin
      .from('slideshows')
      .update({
        title: slideshow.title,
        template_used: slideshow.template_used,
        slides: slideshow.slides,
        viral_hook: slideshow.viral_hook,
        generated_caption: slideshow.generated_caption,
        hashtags: slideshow.hashtags,
        estimated_viral_score: slideshow.estimated_viral_score,
        creation_status: 'completed',
        creation_progress: 100,
        processing_completed_at: new Date().toISOString()
      })
      .eq('id', slideshowId);

    if (updateError) {
      throw new Error(`Failed to update slideshow: ${updateError.message}`);
    }

    console.log(`✅ Slideshow ${slideshowId} completed successfully`);

  } catch (error) {
    console.error(`❌ Slideshow ${slideshowId} failed:`, error);
    await updateSlideshowStatus(
      slideshowId, 
      'failed', 
      0, 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Helper function to update slideshow status
async function updateSlideshowStatus(
  slideshowId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  errorMessage?: string
) {
  const { error } = await supabaseAdmin
    .from('slideshows')
    .update({
      creation_status: status,
      creation_progress: progress,
      error_message: errorMessage,
      ...(status === 'processing' && { processing_started_at: new Date().toISOString() }),
      ...(status === 'completed' && { processing_completed_at: new Date().toISOString() })
    })
    .eq('id', slideshowId);

  if (error) {
    console.error('Failed to update slideshow status:', error);
  }
}