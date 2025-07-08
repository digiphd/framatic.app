import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Test database connection by querying viral templates
    const { data, error } = await supabaseAdmin
      .from('viral_templates')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        url: process.env.SUPABASE_URL ? 'configured' : 'missing'
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}