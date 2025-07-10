import { openRouter } from '../lib/openrouter/client';
import { UserContext } from '../types/user-context';
import { Database } from '../lib/supabase/client';
import { OPENROUTER_MODELS } from '@famatic/shared';
import { parseAIResponse, validateAIResponse } from '../lib/json-parser';

interface ContextAwareGenerationOptions {
  userContext: UserContext;
  assets: Array<{
    id: string;
    ai_analysis: any;
    viral_potential_score: number;
    quality_score: number;
    r2_url: string;
    original_filename: string;
  }>;
  userPrompt?: string;
  templatePreference?: string;
  maxSlides?: number;
}

interface GeneratedSlideshow {
  title: string;
  template_used: string;
  slides: Array<{
    asset_id: string;
    text: string;
    position: number;
    style: {
      fontSize: number;
      color: string;
      backgroundColor?: string;
      fontWeight: string;
    };
  }>;
  viral_hook: string;
  generated_caption: string;
  hashtags: string[];
  estimated_viral_score: number;
  context_relevance_score: number;
  reasoning: string;
}

export class ContextAwareAI {
  private static instance: ContextAwareAI;

  public static getInstance(): ContextAwareAI {
    if (!ContextAwareAI.instance) {
      ContextAwareAI.instance = new ContextAwareAI();
    }
    return ContextAwareAI.instance;
  }

  private constructor() {}

  async generateContextAwareSlideshow(options: ContextAwareGenerationOptions): Promise<GeneratedSlideshow> {
    const { userContext, assets, userPrompt, templatePreference, maxSlides = 8 } = options;

    // 1. Analyze user context and assets to select the best template
    const selectedTemplate = await this.selectOptimalTemplate(userContext, assets, templatePreference);

    // 2. Select and order the best assets based on context
    const selectedAssets = await this.selectOptimalAssets(userContext, assets, selectedTemplate, maxSlides, userPrompt);

    // 3. Generate context-aware content
    const slideshow = await this.generateContextualContent(
      userContext,
      selectedAssets,
      selectedTemplate,
      userPrompt
    );

    return slideshow;
  }

  private async selectOptimalTemplate(
    userContext: UserContext,
    assets: any[],
    templatePreference?: string
  ): Promise<any> {
    // Analyze asset types and user context to recommend the best template
    const assetAnalysis = assets.map(asset => ({
      emotions: asset.ai_analysis?.emotions || [],
      content_type: asset.ai_analysis?.content_type || 'unknown',
      viral_potential: asset.viral_potential_score || 0,
      tags: asset.ai_analysis?.tags || []
    }));

    const contextPrompt = `
Based on the user's context and their asset library, recommend the best viral template:

User Context:
- Creator Type: ${userContext.creator_type}
- Tone: ${userContext.tone_of_voice}
- Business Category: ${userContext.business_category || 'N/A'}
- Target Audience: ${userContext.target_audience || 'General'}
- Content Goals: ${userContext.content_goals.join(', ')}
- Posting Frequency: ${userContext.posting_frequency}
- Brand Keywords: ${userContext.brand_keywords.join(', ')}

Asset Analysis:
${assetAnalysis.map((asset, i) => `
Asset ${i + 1}: ${asset.content_type} - emotions: ${asset.emotions.join(', ')} - viral score: ${asset.viral_potential} - tags: ${asset.tags.join(', ')}
`).join('')}

Template Preference: ${templatePreference || 'None specified'}

Available Templates:
1. hidden_gems - For secret places, discoveries, hidden tips (89% viral rate)
2. before_after - For transformations, progress, comparisons (84% viral rate)
3. day_in_life - For routine content, authentic moments (75% viral rate)
4. photo_dump - For casual authentic moments, lifestyle (75% viral rate)
5. controversial_take - For opinion content, debates (71% viral rate)
6. things_that - For lists, countdowns, facts (82% viral rate)

Select the most suitable template and provide a brief reasoning. Format your response as JSON:
{
  "template_id": "selected_template_id",
  "template_name": "Template Name",
  "relevance_score": 0.95,
  "reasoning": "Why this template works best for this user and content"
}
`;

    try {
      const response = await openRouter.generateText({
        model: OPENROUTER_MODELS.SLIDESHOW_GENERATION,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at viral content strategy and template selection. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const templateSelection = parseAIResponse(response.content);
      console.log('Selected template:', templateSelection);
      
      if (response.usedFallback) {
        console.log('🔄 Used OpenAI fallback for template selection');
      }

      // Validate the response structure
      if (!validateAIResponse(templateSelection, ['template_id', 'template_name', 'relevance_score'])) {
        console.warn('Invalid template selection response, using fallback');
        return this.getFallbackTemplate(userContext.creator_type);
      }
      
      return templateSelection;
    } catch (error) {
      console.error('Template selection error:', error);
      // Fallback to a default template based on creator type
      return this.getFallbackTemplate(userContext.creator_type);
    }
  }

  private async selectOptimalAssets(
    userContext: UserContext,
    assets: any[],
    selectedTemplate: any,
    maxSlides: number,
    userPrompt?: string
  ): Promise<any[]> {
    // Score and rank assets based on context relevance AND user prompt relevance
    const scoredAssets = assets.map(asset => {
      let contextScore = 0;
      
      // Score based on relevance to user prompt (NEW - highest priority)
      if (userPrompt && userPrompt.trim() !== 'Create an engaging slideshow about my content') {
        contextScore += this.calculatePromptRelevance(asset, userPrompt) * 0.4;
      }
      
      // Score based on viral potential (reduced weight)
      contextScore += (asset.viral_potential_score || 0) * 0.2;
      
      // Score based on quality (reduced weight)
      contextScore += (asset.quality_score || 0) * 0.15;
      
      // Score based on emotional alignment
      const assetEmotions = asset.ai_analysis?.emotions || [];
      const contextEmotions = this.getContextEmotions(userContext, selectedTemplate);
      const emotionMatch = assetEmotions.filter(e => contextEmotions.includes(e)).length;
      contextScore += (emotionMatch / Math.max(contextEmotions.length, 1)) * 0.15;
      
      // Score based on content type alignment
      const contentType = asset.ai_analysis?.content_type || 'unknown';
      const templateOptimalTypes = this.getTemplateOptimalTypes(selectedTemplate.template_id);
      if (templateOptimalTypes.includes(contentType)) {
        contextScore += 0.1;
      }
      
      return {
        ...asset,
        context_score: contextScore
      };
    });

    // Sort by context score and select top assets
    const selectedAssets = scoredAssets
      .sort((a, b) => b.context_score - a.context_score)
      .slice(0, maxSlides);

    console.log('Selected assets with context scores:', selectedAssets.map(a => ({
      filename: a.original_filename,
      score: a.context_score,
      viral_potential: a.viral_potential_score,
      prompt_relevance: userPrompt ? this.calculatePromptRelevance(a, userPrompt) : 0
    })));

    return selectedAssets;
  }

  private async generateContextualContent(
    userContext: UserContext,
    selectedAssets: any[],
    selectedTemplate: any,
    userPrompt?: string
  ): Promise<GeneratedSlideshow> {
    const contextPrompt = `
Create a viral TikTok slideshow using the ${selectedTemplate.template_name} format for this user:

User Context:
- Creator Type: ${userContext.creator_type}
- Tone: ${userContext.tone_of_voice}
- Business Category: ${userContext.business_category || 'N/A'}
- Target Audience: ${userContext.target_audience || 'General'}
- Content Goals: ${userContext.content_goals.join(', ')}
- Brand Keywords: ${userContext.brand_keywords.join(', ')}
- Preferred Hashtags: ${userContext.preferred_hashtags.join(', ')}

User Prompt: ${userPrompt || 'Create engaging content that matches my style'}

Selected Assets:
${selectedAssets.map((asset, i) => `
Slide ${i + 1}: 
- Filename: ${asset.original_filename}
- Content Type: ${asset.ai_analysis?.content_type || 'image'}
- Emotions: ${asset.ai_analysis?.emotions?.join(', ') || 'N/A'}
- Scene: ${asset.ai_analysis?.scene_description || 'N/A'}
- Viral Score: ${asset.viral_potential_score || 0}
- Quality Score: ${asset.quality_score || 0}
- Tags: ${asset.ai_analysis?.tags?.join(', ') || 'N/A'}
`).join('')}

Template Guidelines:
- ${selectedTemplate.template_name}: ${selectedTemplate.reasoning}
- Match the user's ${userContext.tone_of_voice} tone
- Target ${userContext.target_audience || 'general audience'}
- Focus on ${userContext.content_goals.join(' and ')}

Create engaging slide text for each image that:
1. Hooks viewers in the first slide
2. Builds narrative tension
3. Delivers value/payoff
4. Matches user's tone and brand
5. Incorporates brand keywords naturally
6. Optimizes for TikTok algorithm

Also create:
- A compelling title
- A viral hook (first 3 seconds)
- An engaging caption
- Relevant hashtags (including user's preferred ones)
- Estimated viral score (1-10)

Format as JSON:
{
  "title": "Slideshow Title",
  "template_used": "${selectedTemplate.template_id}",
  "slides": [
    {
      "asset_id": "asset_id_here",
      "text": "Slide text here",
      "position": 1,
      "style": {
        "fontSize": 24,
        "color": "#FFFFFF",
        "backgroundColor": "rgba(0,0,0,0.5)",
        "fontWeight": "bold"
      }
    }
  ],
  "viral_hook": "First 3 seconds hook",
  "generated_caption": "Full caption for TikTok",
  "hashtags": ["hashtag1", "hashtag2"],
  "estimated_viral_score": 8.5,
  "context_relevance_score": 0.92,
  "reasoning": "Why this approach works for this user"
}
`;

    try {
      const response = await openRouter.generateText({
        model: OPENROUTER_MODELS.SLIDESHOW_GENERATION,
        messages: [
          {
            role: 'system',
            content: 'You are an expert viral content creator who understands TikTok algorithms and user psychology. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const slideshow = parseAIResponse(response.content);
      console.log('Generated slideshow:', slideshow);
      
      if (response.usedFallback) {
        console.log('🔄 Used OpenAI fallback for slideshow generation');
      }

      // Validate the response structure
      const requiredFields = ['title', 'template_used', 'slides', 'viral_hook', 'generated_caption'];
      if (!validateAIResponse(slideshow, requiredFields)) {
        console.error('Invalid slideshow generation response:', slideshow);
        throw new Error('AI generated invalid slideshow format');
      }
      
      return slideshow;
    } catch (error) {
      console.error('Content generation error:', error);
      
      // If AI fails completely, generate a basic slideshow using templates
      console.log('🎭 Generating static fallback slideshow');
      return this.generateStaticFallback(userContext, selectedAssets, selectedTemplate);
    }
  }

  private getContextEmotions(userContext: UserContext, selectedTemplate: any): string[] {
    const baseEmotions = [];
    
    // Add emotions based on tone
    switch (userContext.tone_of_voice) {
      case 'casual':
        baseEmotions.push('authentic', 'relatable', 'candid');
        break;
      case 'professional':
        baseEmotions.push('inspiring', 'credible', 'educational');
        break;
      case 'funny':
        baseEmotions.push('humorous', 'entertaining', 'playful');
        break;
      case 'inspirational':
        baseEmotions.push('motivating', 'uplifting', 'empowering');
        break;
      case 'educational':
        baseEmotions.push('informative', 'helpful', 'insightful');
        break;
      case 'trendy':
        baseEmotions.push('exciting', 'current', 'dynamic');
        break;
    }

    // Add emotions based on content goals
    if (userContext.content_goals.includes('Go viral')) {
      baseEmotions.push('shock', 'curiosity', 'surprising');
    }
    if (userContext.content_goals.includes('Entertain')) {
      baseEmotions.push('fun', 'engaging', 'entertaining');
    }
    if (userContext.content_goals.includes('Educate followers')) {
      baseEmotions.push('educational', 'informative', 'valuable');
    }

    return baseEmotions;
  }

  private getTemplateOptimalTypes(templateId: string): string[] {
    const templateTypes = {
      'hidden_gems': ['landscape', 'travel', 'food', 'location'],
      'before_after': ['portrait', 'transformation', 'comparison'],
      'day_in_life': ['lifestyle', 'routine', 'personal'],
      'photo_dump': ['candid', 'lifestyle', 'mixed'],
      'controversial_take': ['portrait', 'text', 'opinion'],
      'things_that': ['product', 'list', 'educational']
    };

    return templateTypes[templateId] || ['portrait', 'lifestyle'];
  }

  private getFallbackTemplate(creatorType: string): any {
    const fallbackTemplates = {
      'personal': {
        template_id: 'day_in_life',
        template_name: 'Day in Life',
        relevance_score: 0.7,
        reasoning: 'Default template for personal creators'
      },
      'lifestyle': {
        template_id: 'photo_dump',
        template_name: 'Photo Dump',
        relevance_score: 0.7,
        reasoning: 'Default template for lifestyle creators'
      },
      'business': {
        template_id: 'things_that',
        template_name: 'Things That',
        relevance_score: 0.7,
        reasoning: 'Default template for business creators'
      },
      'influencer': {
        template_id: 'hidden_gems',
        template_name: 'Hidden Gems',
        relevance_score: 0.7,
        reasoning: 'Default template for influencers'
      },
      'brand': {
        template_id: 'before_after',
        template_name: 'Before/After',
        relevance_score: 0.7,
        reasoning: 'Default template for brands'
      }
    };

    return fallbackTemplates[creatorType] || fallbackTemplates['personal'];
  }

  // Static fallback when AI services are unavailable
  private generateStaticFallback(
    userContext: UserContext,
    selectedAssets: any[],
    selectedTemplate: any
  ): GeneratedSlideshow {
    const slides = selectedAssets.map((asset, index) => ({
      asset_id: asset.id,
      text: this.getStaticSlideText(index, selectedTemplate.template_id, userContext.tone_of_voice),
      position: index + 1,
      style: {
        fontSize: 24,
        color: "#FFFFFF",
        backgroundColor: "rgba(0,0,0,0.5)",
        fontWeight: "bold"
      }
    }));

    const baseHashtags = userContext.preferred_hashtags || [];
    const templateHashtags = this.getTemplateHashtags(selectedTemplate.template_id);
    const hashtags = [...baseHashtags, ...templateHashtags, '#fyp', '#viral']
      .filter((tag, index, arr) => arr.indexOf(tag) === index)
      .slice(0, 15);

    return {
      title: `${selectedTemplate.template_name} Slideshow`,
      template_used: selectedTemplate.template_id,
      slides,
      viral_hook: this.getStaticViralHook(selectedTemplate.template_id, userContext.tone_of_voice),
      generated_caption: this.getStaticCaption(selectedTemplate.template_id, userContext),
      hashtags,
      estimated_viral_score: 7.0, // Conservative estimate
      context_relevance_score: 0.8,
      reasoning: "Generated using static fallback when AI services were unavailable"
    };
  }

  private getStaticSlideText(index: number, templateId: string, tone: string): string {
    const templates = {
      'hidden_gems': [
        'This hidden spot will amaze you...',
        'Nobody knows about this place',
        'The secret is finally revealed',
        'This changed everything for me'
      ],
      'before_after': [
        'Before: I had no idea',
        'Then this happened...',
        'The transformation begins',
        'After: Mind blown 🤯'
      ],
      'day_in_life': [
        'Starting my day like this...',
        'Then I do this routine',
        'The secret to my success',
        'This is how I end my day'
      ],
      'photo_dump': [
        'Recent moments that matter',
        'Capturing the real me',
        'These memories hit different',
        'Life in snapshots'
      ]
    };

    const templateTexts = templates[templateId] || templates['photo_dump'];
    return templateTexts[index % templateTexts.length];
  }

  private getStaticViralHook(templateId: string, tone: string): string {
    const hooks = {
      'hidden_gems': 'This secret spot will blow your mind...',
      'before_after': 'You won\'t believe this transformation...',
      'day_in_life': 'My daily routine that changed everything...',
      'photo_dump': 'These candid moments hit different...'
    };

    return hooks[templateId] || 'This will change how you see things...';
  }

  private getStaticCaption(templateId: string, userContext: UserContext): string {
    const baseCaption = `Check out this amazing ${templateId.replace('_', ' ')} content! `;
    const goals = userContext.content_goals.join(' and ').toLowerCase();
    const audience = userContext.target_audience ? `Perfect for ${userContext.target_audience}. ` : '';
    
    return `${baseCaption}${audience}Created to ${goals}. What do you think? 💭`;
  }

  private getTemplateHashtags(templateId: string): string[] {
    const hashtags = {
      'hidden_gems': ['hiddengems', 'secret', 'discover'],
      'before_after': ['transformation', 'beforeafter', 'change'],
      'day_in_life': ['dayinmylife', 'routine', 'lifestyle'],
      'photo_dump': ['photodump', 'authentic', 'real']
    };

    return hashtags[templateId] || ['content', 'viral', 'authentic'];
  }

  private calculatePromptRelevance(asset: any, userPrompt: string): number {
    if (!userPrompt || !asset.ai_analysis) return 0;

    const prompt = userPrompt.toLowerCase();
    const assetTags = asset.ai_analysis.tags || [];
    const assetEmotions = asset.ai_analysis.emotions || [];
    const assetDescription = asset.ai_analysis.scene_description || '';
    const assetContentType = asset.ai_analysis.content_type || '';
    
    let relevanceScore = 0;
    
    // Check for keyword matches in prompt
    const promptKeywords = prompt.split(' ').filter(word => word.length > 2);
    
    // Match against asset tags (high weight)
    const tagMatches = assetTags.filter(tag => 
      promptKeywords.some(keyword => tag.toLowerCase().includes(keyword) || keyword.includes(tag.toLowerCase()))
    ).length;
    relevanceScore += tagMatches * 2;
    
    // Match against emotions (medium weight)
    const emotionMatches = assetEmotions.filter(emotion => 
      promptKeywords.some(keyword => emotion.toLowerCase().includes(keyword) || keyword.includes(emotion.toLowerCase()))
    ).length;
    relevanceScore += emotionMatches * 1.5;
    
    // Match against scene description (medium weight)
    const descriptionMatches = promptKeywords.filter(keyword => 
      assetDescription.toLowerCase().includes(keyword)
    ).length;
    relevanceScore += descriptionMatches * 1.5;
    
    // Match against content type (low weight)
    const contentMatches = promptKeywords.filter(keyword => 
      assetContentType.toLowerCase().includes(keyword)
    ).length;
    relevanceScore += contentMatches * 1;
    
    // Special handling for common themes
    if (prompt.includes('childhood') || prompt.includes('memories') || prompt.includes('nostalgic')) {
      if (assetTags.some(tag => ['childhood', 'memories', 'nostalgic', 'family', 'young', 'past'].includes(tag.toLowerCase()))) {
        relevanceScore += 5;
      }
      if (assetEmotions.some(emotion => ['nostalgic', 'sentimental', 'emotional', 'happy'].includes(emotion.toLowerCase()))) {
        relevanceScore += 3;
      }
    }
    
    if (prompt.includes('travel') || prompt.includes('adventure') || prompt.includes('journey')) {
      if (assetTags.some(tag => ['travel', 'adventure', 'journey', 'destination', 'explore'].includes(tag.toLowerCase()))) {
        relevanceScore += 5;
      }
      if (assetContentType.includes('landscape') || assetContentType.includes('location')) {
        relevanceScore += 3;
      }
    }
    
    if (prompt.includes('food') || prompt.includes('cooking') || prompt.includes('meal')) {
      if (assetTags.some(tag => ['food', 'cooking', 'meal', 'recipe', 'dish'].includes(tag.toLowerCase()))) {
        relevanceScore += 5;
      }
    }
    
    if (prompt.includes('workout') || prompt.includes('fitness') || prompt.includes('exercise')) {
      if (assetTags.some(tag => ['fitness', 'workout', 'exercise', 'gym', 'sport'].includes(tag.toLowerCase()))) {
        relevanceScore += 5;
      }
    }
    
    // Normalize score to 0-10 range
    return Math.min(relevanceScore, 10);
  }
}

export const contextAwareAI = ContextAwareAI.getInstance();