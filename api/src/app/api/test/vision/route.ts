import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Simple 1x1 pixel red image in base64
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

export async function GET(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Testing OpenRouter vision API...');
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'Framatic Vision Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'What do you see in this image? Respond with just one word.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${TEST_IMAGE_BASE64}`
                }
              }
            ]
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      })
    });

    console.log('Vision API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `Vision API error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Vision API response:', data);

    return NextResponse.json({
      success: true,
      message: 'Vision API is working correctly',
      response: data
    });

  } catch (error) {
    console.error('Vision test error:', error);
    return NextResponse.json(
      { 
        error: 'Vision test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}