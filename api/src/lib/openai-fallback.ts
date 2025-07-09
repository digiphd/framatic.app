import { config } from './config';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export interface OpenAIResponse {
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

class OpenAIFallbackClient {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      return response.json();
    } catch (error) {
      console.error('OpenAI fallback error:', error);
      throw error;
    }
  }

  async generateText(request: {
    model: string;
    messages: OpenAIMessage[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<{ content: string; usage?: any }> {
    const response = await this.chat({
      model: request.model,
      messages: request.messages,
      max_tokens: request.max_tokens || 1000,
      temperature: request.temperature || 0.7
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
    };
  }

  // Test connection to OpenAI
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await this.generateText({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OK" if you can hear me.' }],
        max_tokens: 5
      });

      return { 
        connected: response.content.toLowerCase().includes('ok') || response.content.toLowerCase().includes('yes')
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
export const openAIFallback = new OpenAIFallbackClient(process.env.OPENAI_API_KEY || '');

// Model mapping for fallback
export const OPENAI_FALLBACK_MODELS = {
  'openai/gpt-4o': 'gpt-4o',
  'openai/gpt-4o-mini': 'gpt-4o-mini', 
  'openai/gpt-3.5-turbo': 'gpt-3.5-turbo',
  'anthropic/claude-3.5-sonnet': 'gpt-4o', // Fallback Claude to GPT-4o
  'openai/whisper-1': 'whisper-1'
} as const;

// Get fallback model name
export function getFallbackModel(originalModel: string): string {
  return OPENAI_FALLBACK_MODELS[originalModel as keyof typeof OPENAI_FALLBACK_MODELS] || 'gpt-3.5-turbo';
}