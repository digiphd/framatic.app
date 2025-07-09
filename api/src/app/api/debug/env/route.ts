import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { openAIFallback } from '@/lib/openai-fallback';
import { openRouter } from '@/lib/openrouter/client';

export async function GET() {
  try {
    // Check which API keys are configured
    const envCheck = {
      openrouter_key_configured: !!config.OPENROUTER_API_KEY,
      openrouter_key_length: config.OPENROUTER_API_KEY?.length || 0,
      openai_key_configured: !!config.OPENAI_API_KEY,
      openai_key_length: config.OPENAI_API_KEY?.length || 0,
      node_env: process.env.NODE_ENV,
    };

    // Test connections
    const connectionTests = {
      openrouter: await openRouter.testConnection().catch(e => ({ connected: false, error: e.message })),
      openai: await openAIFallback.testConnection().catch(e => ({ connected: false, error: e.message })),
    };

    return NextResponse.json({
      env_check: envCheck,
      connection_tests: connectionTests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check environment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}