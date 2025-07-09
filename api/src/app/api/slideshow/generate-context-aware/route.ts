import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';
import { contextAwareAI } from '@/services/context-aware-ai';
import { ContextAwareSlideshowRequest } from '@/types/user-context';

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const requestBody: ContextAwareSlideshowRequest = await request.json();
    const { selected_asset_ids, user_prompt, template_preference, style_override } = requestBody;

    // Validate required fields
    if (!selected_asset_ids || selected_asset_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No assets selected for slideshow generation'
        },
        { status: 400 }
      );
    }

    if (selected_asset_ids.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 10 assets allowed for slideshow generation'
        },
        { status: 400 }
      );
    }

    // 1. Get user context
    let userContext = await db.getUserContext(userId);
    
    if (!userContext) {
      // Create default context if none exists
      const defaultContext = {
        user_id: userId,
        creator_type: 'personal' as const,
        tone_of_voice: 'casual' as const,
        content_goals: ['Share experiences'],
        posting_frequency: 'weekly' as const,
        preferred_hashtags: ['fyp', 'viral'],
        brand_keywords: [],
        business_category: null,
        target_audience: null,
        content_style_preferences: null,
        viral_content_examples: null,
        context_learning_data: null
      };
      
      userContext = await db.createUserContext(defaultContext);
      console.log('Created default user context for user:', userId);
    }

    // Apply style overrides if provided
    if (style_override) {
      userContext = {
        ...userContext,
        ...style_override
      };
    }

    // 2. Get selected assets with their AI analysis
    const assets = await Promise.all(
      selected_asset_ids.map(async (assetId) => {
        const asset = await db.getAsset(assetId);
        if (!asset) {
          throw new Error(`Asset not found: ${assetId}`);
        }
        if (asset.analysis_status !== 'completed') {
          throw new Error(`Asset ${assetId} analysis not completed`);
        }
        return asset;
      })
    );

    console.log(`Generating slideshow for ${assets.length} assets with context:`, {
      creator_type: userContext.creator_type,
      tone: userContext.tone_of_voice,
      goals: userContext.content_goals
    });

    // 3. Generate context-aware slideshow
    const generatedSlideshow = await contextAwareAI.generateContextAwareSlideshow({
      userContext,
      assets,
      userPrompt: user_prompt,
      templatePreference: template_preference,
      maxSlides: Math.min(assets.length, 8)
    });

    // 4. Save slideshow to database
    const slideshowData = {
      user_id: userId,
      title: generatedSlideshow.title,
      template_used: generatedSlideshow.template_used,
      generation_prompt: user_prompt || 'Context-aware generation',
      slides: generatedSlideshow.slides,
      viral_hook: generatedSlideshow.viral_hook,
      generated_caption: generatedSlideshow.generated_caption,
      hashtags: generatedSlideshow.hashtags,
      estimated_viral_score: generatedSlideshow.estimated_viral_score,
      creation_time_seconds: (Date.now() - startTime) / 1000,
      is_bulk_generated: false,
      actual_performance: {
        context_relevance_score: generatedSlideshow.context_relevance_score,
        reasoning: generatedSlideshow.reasoning,
        selected_assets: selected_asset_ids
      }
    };

    const savedSlideshow = await db.createSlideshow(slideshowData);

    // 5. Update asset usage statistics
    await Promise.all(
      selected_asset_ids.map(async (assetId) => {
        const asset = await db.getAsset(assetId);
        if (asset) {
          await db.updateAssetAnalysis(
            assetId,
            asset.ai_analysis,
            asset.viral_potential_score || 0,
            asset.quality_score || 0
          );
        }
      })
    );

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`Context-aware slideshow generated in ${processingTime}s`);

    return NextResponse.json({
      success: true,
      slideshow: {
        id: savedSlideshow.id,
        title: savedSlideshow.title,
        template_used: savedSlideshow.template_used,
        slides: savedSlideshow.slides,
        viral_hook: savedSlideshow.viral_hook,
        generated_caption: savedSlideshow.generated_caption,
        hashtags: savedSlideshow.hashtags,
        estimated_viral_score: savedSlideshow.estimated_viral_score,
        context_relevance_score: generatedSlideshow.context_relevance_score,
        reasoning: generatedSlideshow.reasoning,
        creation_time_seconds: processingTime,
        created_at: savedSlideshow.created_at
      },
      context_used: {
        creator_type: userContext.creator_type,
        tone_of_voice: userContext.tone_of_voice,
        content_goals: userContext.content_goals,
        brand_keywords: userContext.brand_keywords
      },
      assets_used: assets.length,
      processing_time: processingTime
    });

  } catch (error) {
    console.error('Context-aware slideshow generation error:', error);
    
    let errorMessage = 'Failed to generate slideshow';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Asset not found')) {
        errorMessage = 'One or more selected assets not found';
        statusCode = 404;
      } else if (error.message.includes('analysis not completed')) {
        errorMessage = 'Selected assets are still being analyzed. Please wait and try again.';
        statusCode = 400;
      } else if (error.message.includes('Failed to generate')) {
        errorMessage = 'AI generation failed. Please try again.';
        statusCode = 503;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        processing_time: (Date.now() - startTime) / 1000
      },
      { status: statusCode }
    );
  }
}