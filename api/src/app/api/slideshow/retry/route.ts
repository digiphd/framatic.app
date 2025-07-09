import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const slideshowId = searchParams.get('slideshowId');

    if (!userId || !slideshowId) {
      return NextResponse.json(
        { success: false, error: 'User ID and slideshow ID are required' },
        { status: 400 }
      );
    }

    console.log('Retrying slideshow:', slideshowId, 'for user:', userId);

    // Get the failed slideshow to retry with same parameters
    const { data: slideshow, error: fetchError } = await supabaseAdmin
      .from('slideshows')
      .select('*')
      .eq('id', slideshowId)
      .eq('user_id', userId)
      .eq('creation_status', 'failed')
      .single();

    if (fetchError || !slideshow) {
      return NextResponse.json(
        { success: false, error: 'Slideshow not found or not in failed state' },
        { status: 404 }
      );
    }

    // Reset slideshow to pending state
    const { error: resetError } = await supabaseAdmin
      .from('slideshows')
      .update({
        creation_status: 'pending',
        creation_progress: 0,
        error_message: null,
        processing_started_at: null,
        processing_completed_at: null
      })
      .eq('id', slideshowId);

    if (resetError) {
      console.error('Failed to reset slideshow:', resetError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset slideshow' },
        { status: 500 }
      );
    }

    // TODO: Trigger background processing again
    // For now, we'll just reset the status and let the client handle it
    // In a full implementation, you would restart the background job

    return NextResponse.json({
      success: true,
      message: 'Slideshow retry initiated',
      slideshow_id: slideshowId
    });

  } catch (error) {
    console.error('Retry slideshow error:', error);
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