import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';
import { openRouter } from '@/lib/openrouter/client';
import { OPENROUTER_MODELS } from '@famatic/shared';
import { parseAIResponse, validateAIResponse } from '@/lib/json-parser';

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface SmartTemplateRequest {
  voice_input?: string;
  user_prompt?: string;
  asset_context?: {
    total_assets: number;
    recent_emotions: string[];
    content_types: string[];
    avg_viral_score: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const requestBody: SmartTemplateRequest = await request.json();
    const { voice_input, user_prompt, asset_context } = requestBody;

    // 1. Get user context
    const userContext = await db.getUserContext(userId);
    
    // 2. Get user's recent assets for additional context
    const recentAssets = await db.getAnalyzedAssets(userId, 20);
    
    // 3. Analyze asset library if not provided
    let assetAnalysis = asset_context;
    if (!assetAnalysis && recentAssets.length > 0) {
      assetAnalysis = {
        total_assets: recentAssets.length,
        recent_emotions: [...new Set(recentAssets.flatMap(asset => asset.ai_analysis?.emotions || []))],
        content_types: [...new Set(recentAssets.map(asset => asset.ai_analysis?.content_type || 'unknown'))],
        avg_viral_score: recentAssets.reduce((sum, asset) => sum + (asset.viral_potential_score || 0), 0) / recentAssets.length
      };
    }

    // 4. Generate smart template recommendations
    const templateRecommendations = await generateSmartTemplateSelection({
      userContext,
      voiceInput: voice_input,
      userPrompt: user_prompt,
      assetAnalysis
    });

    return NextResponse.json({
      success: true,
      recommendations: templateRecommendations,
      user_context: userContext ? {
        creator_type: userContext.creator_type,
        tone_of_voice: userContext.tone_of_voice,
        content_goals: userContext.content_goals
      } : null,
      asset_analysis: assetAnalysis
    });

  } catch (error) {
    console.error('Smart template selection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate template recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateSmartTemplateSelection(options: {
  userContext: any;
  voiceInput?: string;
  userPrompt?: string;
  assetAnalysis?: any;
}) {
  const { userContext, voiceInput, userPrompt, assetAnalysis } = options;

  const templates = [
    {
      id: 'hidden_gems',
      name: 'Hidden Gems',
      description: 'Secret places that blow up',
      viral_rate: 89,
      optimal_for: ['discoveries', 'secrets', 'locations', 'tips'],
      emotions: ['curiosity', 'surprise', 'exclusive'],
      content_types: ['travel', 'food', 'lifestyle', 'location']
    },
    {
      id: 'before_after',
      name: 'Before/After',
      description: 'Transformation stories',
      viral_rate: 84,
      optimal_for: ['progress', 'transformation', 'comparison', 'results'],
      emotions: ['inspiring', 'motivating', 'shocking'],
      content_types: ['transformation', 'progress', 'comparison']
    },
    {
      id: 'day_in_life',
      name: 'Day in Life',
      description: 'Authentic daily routines',
      viral_rate: 75,
      optimal_for: ['routine', 'authentic', 'relatable', 'daily'],
      emotions: ['authentic', 'relatable', 'candid'],
      content_types: ['lifestyle', 'routine', 'personal']
    },
    {
      id: 'photo_dump',
      name: 'Photo Dump',
      description: 'Casual authentic moments',
      viral_rate: 75,
      optimal_for: ['memories', 'candid', 'collection', 'moments'],
      emotions: ['nostalgic', 'authentic', 'casual'],
      content_types: ['mixed', 'candid', 'lifestyle']
    },
    {
      id: 'things_that',
      name: 'Things That',
      description: 'Lists, facts, and countdowns',
      viral_rate: 82,
      optimal_for: ['lists', 'facts', 'tips', 'educational'],
      emotions: ['curious', 'educational', 'valuable'],
      content_types: ['educational', 'list', 'tips']
    },
    {
      id: 'controversial_take',
      name: 'Hot Take',
      description: 'Bold opinions and debates',
      viral_rate: 71,
      optimal_for: ['opinions', 'debates', 'controversial', 'discussion'],
      emotions: ['provocative', 'engaging', 'polarizing'],
      content_types: ['opinion', 'discussion', 'debate']
    }
  ];

  const contextPrompt = `
Analyze the user's input and context to recommend the 3 best viral templates, ranked by suitability:

User Context:
${userContext ? `
- Creator Type: ${userContext.creator_type}
- Tone: ${userContext.tone_of_voice}
- Business Category: ${userContext.business_category || 'N/A'}
- Content Goals: ${userContext.content_goals?.join(', ') || 'N/A'}
- Brand Keywords: ${userContext.brand_keywords?.join(', ') || 'N/A'}
- Target Audience: ${userContext.target_audience || 'General'}
` : 'No user context available (using defaults)'}

User Input:
- Voice Input: ${voiceInput || 'N/A'}
- Text Prompt: ${userPrompt || 'N/A'}

Asset Library Analysis:
${assetAnalysis ? `
- Total Assets: ${assetAnalysis.total_assets}
- Common Emotions: ${assetAnalysis.recent_emotions?.join(', ') || 'N/A'}
- Content Types: ${assetAnalysis.content_types?.join(', ') || 'N/A'}
- Avg Viral Score: ${assetAnalysis.avg_viral_score?.toFixed(1) || 'N/A'}
` : 'No asset analysis available'}

Available Templates:
${templates.map(t => `
${t.id}: ${t.name} (${t.viral_rate}% viral rate)
- Description: ${t.description}
- Optimal for: ${t.optimal_for.join(', ')}
- Emotions: ${t.emotions.join(', ')}
- Content types: ${t.content_types.join(', ')}
`).join('')}

Analyze the user's intent, context, and asset library to recommend the 3 most suitable templates.
Consider:
1. User's creator type and tone
2. Their stated content goals
3. The input prompt/voice content
4. Available asset types and emotions
5. Viral potential for their audience

Rank templates by suitability and provide reasoning.

Format as JSON:
{
  "recommendations": [
    {
      "template_id": "template_id",
      "template_name": "Template Name",
      "relevance_score": 0.95,
      "viral_potential": 8.9,
      "reasoning": "Why this template is perfect for this user and content",
      "hook_suggestion": "Specific hook example for this user",
      "success_probability": 0.85
    }
  ]
}
`;

  try {
    const response = await openRouter.generateText({
      model: OPENROUTER_MODELS.SLIDESHOW_GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at viral content strategy and template recommendation. Always respond with valid JSON containing exactly 3 template recommendations ranked by suitability.'
        },
        {
          role: 'user',
          content: contextPrompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const recommendations = parseAIResponse(response.content);
    
    if (response.usedFallback) {
      console.log('🔄 Used OpenAI fallback for smart template selection');
    }

    // Validate the response structure
    if (!validateAIResponse(recommendations, ['recommendations']) || !Array.isArray(recommendations.recommendations)) {
      console.warn('Invalid smart template response, using fallback');
      throw new Error('Invalid AI response format');
    }
    
    // Add template details to recommendations
    const enhancedRecommendations = recommendations.recommendations.map((rec: any) => {
      const template = templates.find(t => t.id === rec.template_id);
      return {
        ...rec,
        template_details: template || {},
        emoji: getTemplateEmoji(rec.template_id),
        gradient: getTemplateGradient(rec.template_id)
      };
    });

    return enhancedRecommendations;

  } catch (error) {
    console.error('Template recommendation error:', error);
    
    // Fallback to default recommendations
    const fallbackRecommendations = templates.slice(0, 3).map((template, index) => ({
      template_id: template.id,
      template_name: template.name,
      relevance_score: 0.7 - (index * 0.1),
      viral_potential: template.viral_rate / 10,
      reasoning: `Popular template suitable for ${userContext?.creator_type || 'general'} creators`,
      hook_suggestion: `Create engaging ${template.name.toLowerCase()} content`,
      success_probability: 0.7 - (index * 0.1),
      template_details: template,
      emoji: getTemplateEmoji(template.id),
      gradient: getTemplateGradient(template.id)
    }));

    return fallbackRecommendations;
  }
}

function getTemplateEmoji(templateId: string): string {
  const emojis = {
    'hidden_gems': '💎',
    'before_after': '✨',
    'day_in_life': '📅',
    'photo_dump': '📸',
    'things_that': '📝',
    'controversial_take': '🔥'
  };
  return emojis[templateId] || '✨';
}

function getTemplateGradient(templateId: string): string[] {
  const gradients = {
    'hidden_gems': ['#9333EA', '#C084FC'],
    'before_after': ['#EC4899', '#F472B6'],
    'day_in_life': ['#8B5CF6', '#A78BFA'],
    'photo_dump': ['#06B6D4', '#67E8F9'],
    'things_that': ['#EAB308', '#FDE047'],
    'controversial_take': ['#EF4444', '#F87171']
  };
  return gradients[templateId] || ['#9333EA', '#C084FC'];
}