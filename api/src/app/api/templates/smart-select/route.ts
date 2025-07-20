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
      id: 'minimalist_viral',
      name: 'Minimalist Viral',
      description: 'Clean white text with shadow - perfect for authentic moments',
      viral_rate: 92,
      optimal_for: ['authentic', 'lifestyle', 'photo_dumps', 'candid'],
      emotions: ['authentic', 'relatable', 'curiosity'],
      content_types: ['lifestyle', 'authentic', 'casual'],
      content_progression: ['hook_statement', 'build_context', 'reveal_moment', 'call_to_action'],
      writing_style_prompts: {
        hook: 'Start with a relatable POV or authentic moment',
        build: 'Build context about the situation or feeling',
        reveal: 'Share the genuine insight or realization',
        conclusion: 'Connect with audience through shared experience'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'authentic_moment', viral_pattern: 'relatability' },
        slide_2: { role: 'build', style: 'context_building', viral_pattern: 'connection' },
        slide_3: { role: 'reveal', style: 'insight_sharing', viral_pattern: 'value_delivery' },
        slide_4: { role: 'conclusion', style: 'community_building', viral_pattern: 'engagement' }
      },
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        backgroundMode: 'none',
        letterSpacing: 0.5,
        textAlign: 'center',
      },
      positioning: {
        x: 0.5,
        y: 0.3,
        scale: 1.0,
        rotation: 0
      }
    },
    {
      id: 'story_mode',
      name: 'Story Mode',
      description: 'Semi-transparent background for perfect readability',
      viral_rate: 88,
      optimal_for: ['storytelling', 'testimonials', 'advice', 'inspiration'],
      emotions: ['inspiring', 'community', 'relatability'],
      content_types: ['story', 'testimonial', 'advice'],
      content_progression: ['story_hook', 'build_tension', 'reveal_lesson', 'inspire_action'],
      writing_style_prompts: {
        hook: 'Start with a compelling story setup or life moment',
        build: 'Build the narrative tension or emotional stakes',
        reveal: 'Share the key lesson or transformation',
        conclusion: 'Inspire others to take similar action'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'story_opening', viral_pattern: 'narrative_hook' },
        slide_2: { role: 'build', style: 'tension_building', viral_pattern: 'emotional_investment' },
        slide_3: { role: 'reveal', style: 'lesson_reveal', viral_pattern: 'wisdom_sharing' },
        slide_4: { role: 'conclusion', style: 'inspiration_call', viral_pattern: 'motivation' }
      },
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold', 
        color: '#000000',
        backgroundColor: 'rgba(255, 255, 255, 1.0)',
        backgroundMode: 'per_line',
        letterSpacing: 0.3,
        textTransform: 'none',
      },
      positioning: {
        x: 0.5,
        y: 0.3,
        scale: 1.0,
        rotation: 0
      }
    },
    {
      id: 'pop_off',
      name: 'Pop Off',
      description: 'Bold white background for maximum impact statements',
      viral_rate: 85,
      optimal_for: ['opinions', 'bold_statements', 'controversial', 'attention_grabbing'],
      emotions: ['bold', 'controversial', 'engaging'],
      content_types: ['opinion', 'debate', 'bold_statement'],
      content_progression: ['bold_statement', 'support_argument', 'challenge_norms', 'defend_position'],
      writing_style_prompts: {
        hook: 'Make a bold, attention-grabbing statement',
        build: 'Provide your reasoning or evidence',
        reveal: 'Challenge conventional thinking',
        conclusion: 'Stand firm in your position and invite response'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'bold_statement', viral_pattern: 'attention_grab' },
        slide_2: { role: 'build', style: 'reasoning_share', viral_pattern: 'justification' },
        slide_3: { role: 'reveal', style: 'norm_challenging', viral_pattern: 'controversy' },
        slide_4: { role: 'conclusion', style: 'position_defense', viral_pattern: 'engagement_bait' }
      },
      textStyle: {
        fontSize: 30,
        fontWeight: '900',
        color: '#000000', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backgroundMode: 'white',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
      },
      positioning: {
        x: 0.5,
        y: 0.4,
        scale: 1.0,
        rotation: 0
      }
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
    'minimalist_viral': '🔥',
    'story_mode': '📱',
    'pop_off': '⚡'
  };
  return emojis[templateId] || '✨';
}

function getTemplateGradient(templateId: string): string[] {
  const gradients = {
    'minimalist_viral': ['#9333EA', '#C084FC'],
    'story_mode': ['#06B6D4', '#67E8F9'],
    'pop_off': ['#EF4444', '#F87171']
  };
  return gradients[templateId] || ['#9333EA', '#C084FC'];
}