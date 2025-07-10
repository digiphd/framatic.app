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
      id: 'question_hook',
      name: 'Question Hook',
      description: 'Provocative questions that demand answers',
      viral_rate: 92,
      optimal_for: ['questions', 'curiosity', 'engagement', 'discussions'],
      emotions: ['curious', 'engaging', 'provocative'],
      content_types: ['educational', 'discussion', 'advice'],
      content_progression: ['hook_question', 'build_intrigue', 'reveal_answer', 'call_to_action'],
      writing_style_prompts: {
        hook: 'Start with a provocative question that makes viewers stop scrolling',
        build: 'Build intrigue with follow-up questions or partial reveals',
        reveal: 'Provide the answer or insight that satisfies curiosity',
        conclusion: 'End with a question to encourage engagement'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'provocative_question', viral_pattern: 'curiosity_gap' },
        slide_2: { role: 'build', style: 'follow_up_question', viral_pattern: 'increased_intrigue' },
        slide_3: { role: 'reveal', style: 'answer_reveal', viral_pattern: 'satisfaction' },
        slide_4: { role: 'conclusion', style: 'engagement_question', viral_pattern: 'call_to_action' }
      },
      textStyle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backgroundMode: 'full',
        letterSpacing: 0.5,
      }
    },
    {
      id: 'controversial_take',
      name: 'Controversial',
      description: 'Bold statements that spark debate',
      viral_rate: 88,
      optimal_for: ['opinions', 'debates', 'controversial', 'discussion'],
      emotions: ['provocative', 'engaging', 'polarizing'],
      content_types: ['opinion', 'discussion', 'debate'],
      content_progression: ['bold_statement', 'support_argument', 'address_objections', 'defend_position'],
      writing_style_prompts: {
        hook: 'Make a bold, polarizing statement that challenges conventional wisdom',
        build: 'Provide evidence or reasoning that supports your controversial take',
        reveal: 'Address common objections and counter-arguments',
        conclusion: 'Reinforce your position and invite debate'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'controversial_statement', viral_pattern: 'shock_value' },
        slide_2: { role: 'build', style: 'supporting_evidence', viral_pattern: 'justification' },
        slide_3: { role: 'reveal', style: 'counter_objections', viral_pattern: 'debate_fuel' },
        slide_4: { role: 'conclusion', style: 'position_defense', viral_pattern: 'engagement_bait' }
      },
      textStyle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        backgroundMode: 'full',
        letterSpacing: 0.3,
      }
    },
    {
      id: 'reaction_hook',
      name: 'Reaction Hook',
      description: 'Shock value that stops the scroll',
      viral_rate: 85,
      optimal_for: ['reactions', 'surprise', 'shocking', 'wtf'],
      emotions: ['shocking', 'surprising', 'curious'],
      content_types: ['reaction', 'surprise', 'reveal'],
      content_progression: ['shock_statement', 'build_suspense', 'reveal_truth', 'reaction_prompt'],
      writing_style_prompts: {
        hook: 'Start with something shocking or unexpected that stops the scroll',
        build: 'Build suspense with hints about what really happened',
        reveal: 'Reveal the shocking truth or surprising outcome',
        conclusion: 'Prompt viewers to share their reaction'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'shock_statement', viral_pattern: 'pattern_interrupt' },
        slide_2: { role: 'build', style: 'suspense_building', viral_pattern: 'anticipation' },
        slide_3: { role: 'reveal', style: 'truth_reveal', viral_pattern: 'payoff' },
        slide_4: { role: 'conclusion', style: 'reaction_prompt', viral_pattern: 'engagement' }
      },
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(124, 58, 237, 0.85)',
        backgroundMode: 'full',
        letterSpacing: 0.2,
      }
    },
    {
      id: 'story_reveal',
      name: 'Story Reveal',
      description: 'Behind-the-scenes secrets exposed',
      viral_rate: 82,
      optimal_for: ['secrets', 'reveals', 'behind-scenes', 'insider'],
      emotions: ['exclusive', 'curious', 'insider'],
      content_types: ['secrets', 'reveal', 'insider', 'story'],
      content_progression: ['tease_secret', 'build_context', 'reveal_secret', 'share_impact'],
      writing_style_prompts: {
        hook: 'Tease an exclusive secret or behind-the-scenes reveal',
        build: 'Provide context about why this secret matters',
        reveal: 'Expose the secret with compelling details',
        conclusion: 'Share the impact or consequences of this revelation'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'secret_tease', viral_pattern: 'exclusivity' },
        slide_2: { role: 'build', style: 'context_setting', viral_pattern: 'importance' },
        slide_3: { role: 'reveal', style: 'secret_reveal', viral_pattern: 'insider_knowledge' },
        slide_4: { role: 'conclusion', style: 'impact_sharing', viral_pattern: 'value_delivery' }
      },
      textStyle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(5, 150, 105, 0.9)',
        backgroundMode: 'full',
        letterSpacing: 0.4,
      }
    },
    {
      id: 'money_success',
      name: 'Money/Success',
      description: 'Financial wisdom and success stories',
      viral_rate: 79,
      optimal_for: ['money', 'success', 'financial', 'wealth', 'business'],
      emotions: ['motivating', 'inspiring', 'valuable'],
      content_types: ['financial', 'business', 'success', 'motivation'],
      content_progression: ['success_hook', 'struggle_story', 'solution_reveal', 'action_call'],
      writing_style_prompts: {
        hook: 'Start with a compelling success outcome or financial win',
        build: 'Share the struggle or challenge that preceded success',
        reveal: 'Reveal the key insight, strategy, or solution that worked',
        conclusion: 'Call viewers to take action on this knowledge'
      },
      narrative_structure: {
        slide_1: { role: 'hook', style: 'success_outcome', viral_pattern: 'aspiration' },
        slide_2: { role: 'build', style: 'struggle_context', viral_pattern: 'relatability' },
        slide_3: { role: 'reveal', style: 'solution_reveal', viral_pattern: 'value_bomb' },
        slide_4: { role: 'conclusion', style: 'action_prompt', viral_pattern: 'motivation' }
      },
      textStyle: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(217, 119, 6, 0.85)',
        backgroundMode: 'full',
        letterSpacing: 0.1,
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