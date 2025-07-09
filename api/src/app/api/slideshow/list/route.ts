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

    const { data: slideshows, error } = await supabaseAdmin
      .from('slideshows')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch slideshows:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch slideshows' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slideshows: slideshows || [],
      total: slideshows?.length || 0
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