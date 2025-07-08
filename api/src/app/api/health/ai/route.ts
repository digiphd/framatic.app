import { NextRequest, NextResponse } from 'next/server';
import { openRouter } from '../../../../lib/openrouter/client';

export async function GET(request: NextRequest) {
  try {
    const result = await openRouter.testConnection();

    return NextResponse.json({
      status: result.connected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      ai: {
        openrouter: {
          connected: result.connected,
          error: result.error,
          api_key: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing'
        },
        models: {
          voice_to_text: 'openai/whisper-1',
          image_analysis: 'anthropic/claude-3.5-sonnet',
          caption_generation: 'openai/gpt-4o',
          hashtag_generation: 'openai/gpt-3.5-turbo'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'AI health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}