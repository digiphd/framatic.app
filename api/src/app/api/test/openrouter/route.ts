import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function GET(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Testing OpenRouter API connectivity...');
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Framatic Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: 'Please respond with a simple JSON object: {"test": "success", "timestamp": "current_time"}'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `OpenRouter API error: ${response.status}`,
          details: errorText,
          headers: Object.fromEntries(response.headers.entries())
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenRouter response data:', data);

    return NextResponse.json({
      success: true,
      message: 'OpenRouter API is working correctly',
      response: data,
      apiKeyPrefix: OPENROUTER_API_KEY.substring(0, 10) + '...'
    });

  } catch (error) {
    console.error('OpenRouter test error:', error);
    return NextResponse.json(
      { 
        error: 'OpenRouter test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}