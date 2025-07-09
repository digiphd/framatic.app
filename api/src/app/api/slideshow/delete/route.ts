import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function DELETE(request: NextRequest) {
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

    console.log('Deleting slideshow:', slideshowId, 'for user:', userId);

    // Delete slideshow (with RLS ensuring user can only delete their own)
    const { error } = await supabaseAdmin
      .from('slideshows')
      .delete()
      .eq('id', slideshowId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete slideshow:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete slideshow' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Slideshow deleted successfully'
    });

  } catch (error) {
    console.error('Delete slideshow error:', error);
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