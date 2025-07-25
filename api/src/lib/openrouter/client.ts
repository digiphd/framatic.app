import { OPENROUTER_MODELS } from '@famatic/shared';
import { config, API_CONFIG } from '../config';
import { openAIFallback, getFallbackModel } from '../openai-fallback';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://famatic.app',
        'X-Title': 'Famatic.app'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  // Voice to text using OpenAI Whisper directly (OpenRouter doesn't support audio endpoints)
  async voiceToText(audioFile: File | Buffer): Promise<string> {
    const formData = new FormData();
    
    if (audioFile instanceof Buffer) {
      const blob = new Blob([audioFile], { type: 'audio/wav' });
      formData.append('file', blob, 'recording.wav');
    } else {
      // Convert the file to a Buffer and then to a Blob with correct MIME type
      const arrayBuffer = await audioFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'recording.wav');
    }
    
    formData.append('model', 'whisper-1');

    // Debug: Check what we're sending
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (key === 'file') {
        console.log(`  ${key}: ${value instanceof Blob ? 'Blob' : 'File'} - size: ${value.size}, type: ${value.type}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    // Use OpenAI API directly for transcription
    const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    console.log('Using OpenAI API key:', openaiApiKey ? `sk-***${openaiApiKey.slice(-4)}` : 'undefined');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('OpenAI Whisper API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      });
      throw new Error(`OpenAI Whisper API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return result.text || '';
  }

  // Analyze image using Claude 3.5 Sonnet
  async analyzeImage(imageUrl: string, prompt?: string): Promise<any> {
    const defaultPrompt = `
Analyze this image for viral TikTok potential. Return a JSON object with:
{
  "emotions": ["array of emotions like happy, authentic, candid, etc"],
  "quality_score": 0-10,
  "viral_potential": 0-10,
  "content_type": "portrait/landscape/group/object/etc", 
  "lighting": "natural/artificial/golden_hour/etc",
  "composition": "rule_of_thirds/centered/candid/etc",
  "colors": ["dominant colors"],
  "tags": ["descriptive tags"],
  "best_for_templates": ["templates this image would work best for"],
  "face_count": number,
  "scene_description": "brief description"
}

Focus on authenticity and viral potential for TikTok slideshows.
    `;

    const response = await this.chat({
      model: OPENROUTER_MODELS.IMAGE_ANALYSIS,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt || defaultPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    try {
      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      if (API_CONFIG.ENABLE_AI_LOGGING) {
        console.error('Failed to parse image analysis JSON:', response.choices[0]?.message?.content);
      }
      throw new Error('Failed to parse AI image analysis response');
    }
  }

  // Generate viral caption using GPT-4o
  async generateCaption(
    template: string,
    imageAnalysis: any[],
    voiceInput?: string
  ): Promise<{ caption: string; hook: string; hashtags: string[] }> {
    const prompt = `
Create a viral TikTok caption based on:
- Template: ${template}
- Voice input: ${voiceInput || 'None'}
- Image analysis: ${JSON.stringify(imageAnalysis.slice(0, 3))}

Return JSON with:
{
  "hook": "viral hook (first line)",
  "caption": "full caption text",
  "hashtags": ["array", "of", "hashtags"]
}

Make it authentic, engaging, and optimized for TikTok's algorithm.
    `;

    const response = await this.chat({
      model: OPENROUTER_MODELS.CAPTION_GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are a viral TikTok content creator who understands what makes content go viral. Focus on authenticity, relatability, and engagement.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    try {
      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      if (API_CONFIG.ENABLE_AI_LOGGING) {
        console.error('Failed to parse caption generation JSON:', response.choices[0]?.message?.content);
      }
      throw new Error('Failed to parse AI caption generation response');
    }
  }

  // Generate hashtags using GPT-3.5 Turbo (cost-effective)
  async generateHashtags(analysis: any, template: string): Promise<string[]> {
    const prompt = `
Generate 10-15 viral TikTok hashtags for:
- Template: ${template}
- Content: ${analysis.scene_description}
- Emotions: ${analysis.emotions?.join(', ')}
- Tags: ${analysis.tags?.join(', ')}

Return as JSON array: ["hashtag1", "hashtag2", ...]
Include #fyp, #viral, and template-specific hashtags.
    `;

    const response = await this.chat({
      model: OPENROUTER_MODELS.HASHTAG_GENERATION,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150
    });

    try {
      const content = response.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      if (API_CONFIG.ENABLE_AI_LOGGING) {
        console.error('Failed to parse hashtag generation JSON:', response.choices[0]?.message?.content);
      }
      // Fallback hashtags
      return ['#fyp', '#viral', '#authentic', `#${template.replace(/_/g, '')}`];
    }
  }

  // Generic text generation method with OpenAI fallback
  async generateText(request: {
    model: string;
    messages: OpenRouterMessage[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<{ content: string; usage?: any; usedFallback?: boolean }> {
    try {
      // First try OpenRouter
      const response = await this.chat({
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens || 1000,
        temperature: request.temperature || 0.7
      });

      return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        usedFallback: false
      };
    } catch (error) {
      console.warn('OpenRouter failed, trying OpenAI fallback:', error);
      
      try {
        // Convert OpenRouter messages to OpenAI format
        const openAIMessages = request.messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : 
                   Array.isArray(msg.content) ? msg.content
                     .filter(item => item.type === 'text')
                     .map(item => item.text)
                     .join(' ') : ''
        }));

        const fallbackModel = getFallbackModel(request.model);
        const fallbackResponse = await openAIFallback.generateText({
          model: fallbackModel,
          messages: openAIMessages,
          max_tokens: request.max_tokens || 1000,
          temperature: request.temperature || 0.7
        });

        return {
          content: fallbackResponse.content,
          usage: fallbackResponse.usage,
          usedFallback: true
        };
      } catch (fallbackError) {
        console.error('Both OpenRouter and OpenAI failed:', fallbackError);
        throw new Error('AI service unavailable. Please try again later.');
      }
    }
  }

  // Health check
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await this.chat({
        model: OPENROUTER_MODELS.HASHTAG_GENERATION,
        messages: [{ role: 'user', content: 'Say "OK" if you can hear me.' }],
        max_tokens: 5
      });

      return { 
        connected: response.choices?.[0]?.message?.content?.includes('OK') || false 
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const openRouter = new OpenRouterClient(config.OPENROUTER_API_KEY);

// Export utility functions
export async function analyzeImageBatch(imageUrls: string[]): Promise<any[]> {
  const results = await Promise.allSettled(
    imageUrls.map(url => openRouter.analyzeImage(url))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      if (API_CONFIG.ENABLE_AI_LOGGING) {
        console.error(`Image analysis failed for ${imageUrls[index]}:`, result.reason);
      }
      return null;
    }
  }).filter(Boolean);
}