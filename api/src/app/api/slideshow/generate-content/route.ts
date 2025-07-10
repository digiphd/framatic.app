import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';
import { openRouter } from '@/lib/openrouter/client';
import { OPENROUTER_MODELS } from '@famatic/shared';
import { parseAIResponse, validateAIResponse } from '@/lib/json-parser';

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface ContentGenerationRequest {
  voice_input: string;
  selected_theme: {
    id: string;
    name: string;
    content_progression: string[];
    writing_style_prompts: {
      hook: string;
      build: string;
      reveal: string;
      conclusion: string;
    };
    narrative_structure: {
      [key: string]: {
        role: string;
        style: string;
        viral_pattern: string;
      };
    };
    emotions: string[];
    optimal_for: string[];
    textStyle: any;
  };
  user_photos?: string[]; // R2 URLs of user's photos
  slide_count?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const requestBody: ContentGenerationRequest = await request.json();
    const { voice_input, selected_theme, user_photos = [], slide_count = 4 } = requestBody;

    console.log('Generating content for theme:', selected_theme.id);
    console.log('Voice input:', voice_input);

    // 1. Get user context for personalization
    const userContext = await db.getUserContext(userId);
    
    // 2. Get user's analyzed assets for context (increased limit to get ALL photos)
    const userAssets = await db.getAnalyzedAssets(userId, 50);

    // 3. Select appropriate photos FIRST (relevance-driven)
    const selectedPhotos = await selectPhotosForSlideshow({
      userAssets,
      theme: selected_theme,
      slideCount: slide_count,
      voiceInput: voice_input
    });

    // 4. Generate photo-specific narrative content based on ACTUAL selected photos
    // IMPORTANT: Maintain the ORDER from selectedPhotos for proper slide-to-photo mapping
    const selectedAssets = selectedPhotos.map(photoUrl => 
      userAssets.find(asset => asset.r2_url === photoUrl)
    ).filter(Boolean); // Remove any undefined entries
    
    console.log('Selected photos order:', selectedPhotos);
    console.log('Selected assets order:', selectedAssets.map(a => a.r2_url));
    
    const slideshowContent = await generatePhotoSpecificContent({
      voiceInput: voice_input,
      theme: selected_theme,
      selectedAssets,
      userContext,
      slideCount: slide_count
    });

    // 5. Generate viral hook and caption
    const viralElements = await generateViralElements({
      voiceInput: voice_input,
      theme: selected_theme,
      slideshowContent,
      userContext
    });

    // 6. Construct final slideshow
    const slideshow = constructSlideshow({
      theme: selected_theme,
      slideshowContent,
      selectedPhotos,
      viralElements,
      slideCount: slide_count
    });

    return NextResponse.json({
      success: true,
      slideshow,
      theme_used: selected_theme.id,
      generation_metadata: {
        content_method: 'ai_theme_driven',
        slide_count,
        photos_selected: selectedPhotos.length
      }
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate slideshow content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateThemeDrivenContent(options: {
  voiceInput: string;
  theme: any;
  userContext: any;
  userAssets: any[];
  slideCount: number;
}) {
  const { voiceInput, theme, userContext, userAssets, slideCount } = options;

  // Create content progression prompt based on theme
  const contentPrompt = `
Generate viral slideshow content using the "${theme.name}" theme strategy.

User Input: "${voiceInput}"

Theme Characteristics:
- Content Progression: ${theme.content_progression.join(' → ')}
- Emotions to evoke: ${theme.emotions.join(', ')}
- Optimal for: ${theme.optimal_for.join(', ')}

Writing Style Guidelines:
- Slide 1 (Hook): ${theme.writing_style_prompts.hook}
- Slide 2 (Build): ${theme.writing_style_prompts.build}
- Slide 3 (Reveal): ${theme.writing_style_prompts.reveal}
- Slide 4 (Conclusion): ${theme.writing_style_prompts.conclusion}

Narrative Structure:
${Object.entries(theme.narrative_structure).map(([slide, structure]: [string, any]) => 
  `${slide}: ${structure.role} (${structure.style}) - Viral Pattern: ${structure.viral_pattern}`
).join('\n')}

User Context:
${userContext ? `
- Creator Type: ${userContext.creator_type || 'General'}
- Tone: ${userContext.tone_of_voice || 'Authentic'}
- Goals: ${userContext.content_goals?.join(', ') || 'Engagement'}
` : 'No specific user context'}

Asset Library Context:
${userAssets.length > 0 ? `
- Available emotions: ${Array.from(new Set(userAssets.flatMap(a => a.ai_analysis?.emotions || []))).join(', ')}
- Content types: ${Array.from(new Set(userAssets.map(a => a.ai_analysis?.content_type || 'unknown'))).join(', ')}
` : 'No assets analyzed yet'}

Generate exactly ${slideCount} slides that follow the theme's narrative structure and viral patterns.
Each slide should be 5-15 words maximum for mobile viewing.
Make the content authentic, engaging, and true to the theme's psychological triggers.

Format as JSON:
{
  "slides": [
    {
      "slide_number": 1,
      "role": "hook",
      "text": "slide text here",
      "viral_strategy": "what makes this slide viral",
      "emotion_target": "primary emotion this slide evokes"
    }
  ],
  "narrative_flow": "brief description of how the slides work together"
}
`;

  try {
    const response = await openRouter.generateText({
      model: OPENROUTER_MODELS.SLIDESHOW_GENERATION,
      messages: [
        {
          role: 'system',
          content: `You are an expert viral content creator who understands TikTok psychology and storytelling. You specialize in creating content that follows proven viral patterns while staying authentic to the user's voice and theme. Always respond with valid JSON.`
        },
        {
          role: 'user',
          content: contentPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7 // Higher creativity for content generation
    });

    const content = parseAIResponse(response.content);
    
    if (response.usedFallback) {
      console.log('🔄 Used OpenAI fallback for content generation');
    }

    if (!validateAIResponse(content, ['slides']) || !Array.isArray(content.slides)) {
      throw new Error('Invalid content generation response');
    }

    return content;

  } catch (error) {
    console.error('Theme-driven content generation error:', error);
    
    // Fallback to template-based content
    return generateFallbackContent(theme, voiceInput, slideCount);
  }
}

function generateFallbackContent(theme: any, voiceInput: string, slideCount: number) {
  // Generate fallback content based on theme patterns
  const fallbackSlides = [];
  
  for (let i = 0; i < slideCount; i++) {
    const slideKey = `slide_${i + 1}`;
    const structure = theme.narrative_structure[slideKey] || theme.narrative_structure.slide_1;
    
    let fallbackText = '';
    switch (structure.role) {
      case 'hook':
        fallbackText = `${theme.writing_style_prompts.hook.split(' ').slice(0, 8).join(' ')}...`;
        break;
      case 'build':
        fallbackText = `Building on that idea...`;
        break;
      case 'reveal':
        fallbackText = `Here's what really happened...`;
        break;
      case 'conclusion':
        fallbackText = `What do you think?`;
        break;
      default:
        fallbackText = `Slide ${i + 1} content`;
    }
    
    fallbackSlides.push({
      slide_number: i + 1,
      role: structure.role,
      text: fallbackText,
      viral_strategy: structure.viral_pattern,
      emotion_target: theme.emotions[0] || 'engaging'
    });
  }
  
  return {
    slides: fallbackSlides,
    narrative_flow: `Fallback ${theme.name} content structure`
  };
}

async function generatePhotoSpecificContent(options: {
  voiceInput: string;
  theme: any;
  selectedAssets: any[];
  userContext: any;
  slideCount: number;
}) {
  const { voiceInput, theme, selectedAssets, userContext, slideCount } = options;

  try {
    // Analyze the selected photos as a set to create a cohesive narrative
    const photoAnalysisPrompt = `
You are creating a viral TikTok slideshow about "${voiceInput}" using the "${theme.name}" theme.

Here are the SPECIFIC photos that were selected (in order):
${selectedAssets.map((asset, i) => `
Slide ${i + 1}: ${asset.ai_analysis?.scene_description || 'Photo description not available'}
- Emotions: ${asset.ai_analysis?.emotions?.join(', ') || 'unknown'}
- Tags: ${asset.ai_analysis?.tags?.join(', ') || 'unknown'}
- Content type: ${asset.ai_analysis?.content_type || 'unknown'}
`).join('')}

Theme Strategy:
- Content Progression: ${theme.content_progression.join(' → ')}
- Narrative Structure: ${Object.entries(theme.narrative_structure).map(([slide, details]: [string, any]) => 
  `${slide}: ${details.role} (${details.style})`
).join(', ')}

Create a cohesive story that flows like a storybook across these SPECIFIC photos.
Each slide's text should be tailored to what's actually in that photo.

Generate ${slideCount} slides that tell a connected story about "${voiceInput}".

Return JSON:
{
  "slides": [
    {
      "slide_number": 1,
      "role": "hook",
      "text": "Text specific to the first photo's content",
      "viral_strategy": "curiosity_gap",
      "emotion_target": "curious"
    }
  ],
  "narrative_flow": "Brief description of how the story flows across photos"
}
    `;

    const response = await openRouter.generateText({
      model: OPENROUTER_MODELS.SLIDESHOW_GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are a viral TikTok content creator who creates compelling narratives that match specific photos. Focus on making each slide text relevant to what viewers actually see in that photo.'
        },
        { role: 'user', content: photoAnalysisPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const parsed = parseAIResponse(response.content);
    if (validateAIResponse(parsed, ['slides', 'narrative_flow'])) {
      console.log('Generated photo-specific content successfully');
      return parsed;
    }

    throw new Error('Invalid AI response format');

  } catch (error) {
    console.error('Photo-specific content generation error:', error);
    
    // Fallback to template-based content that at least references the photos
    return generatePhotoAwareFallback(theme, selectedAssets, voiceInput, slideCount);
  }
}

function generatePhotoAwareFallback(theme: any, selectedAssets: any[], voiceInput: string, slideCount: number) {
  const fallbackSlides = [];
  
  for (let i = 0; i < slideCount; i++) {
    const slideKey = `slide_${i + 1}`;
    const structure = theme.narrative_structure[slideKey] || theme.narrative_structure.slide_1;
    const asset = selectedAssets[i];
    
    // Try to make text somewhat relevant to the photo
    let fallbackText = '';
    const photoDescription = asset?.ai_analysis?.scene_description || '';
    const photoEmotions = asset?.ai_analysis?.emotions || [];
    
    switch (structure.role) {
      case 'hook':
        fallbackText = photoDescription 
          ? `Ever wonder about moments like this? ${photoDescription.slice(0, 50)}...`
          : `${theme.writing_style_prompts.hook.split(' ').slice(0, 8).join(' ')}...`;
        break;
      case 'build':
        fallbackText = photoEmotions.includes('nostalgic') || photoEmotions.includes('emotional')
          ? `This brings back so many feelings...`
          : `Building on that idea...`;
        break;
      case 'reveal':
        fallbackText = `Here's what this moment really means...`;
        break;
      case 'conclusion':
        fallbackText = `What do you think about this?`;
        break;
      default:
        fallbackText = `Slide ${i + 1} content`;
    }
    
    fallbackSlides.push({
      slide_number: i + 1,
      role: structure.role,
      text: fallbackText,
      viral_strategy: structure.viral_pattern,
      emotion_target: theme.emotions[0] || 'engaging'
    });
  }
  
  return {
    slides: fallbackSlides,
    narrative_flow: `Photo-aware ${theme.name} content for "${voiceInput}"`
  };
}

async function selectPhotosForSlideshow(options: {
  userAssets: any[];
  theme: any;
  slideCount: number;
  voiceInput?: string;
}) {
  const { userAssets, theme, slideCount, voiceInput } = options;
  
  if (userAssets.length === 0) {
    // Return placeholder photos if no user assets
    return Array.from({ length: slideCount }, (_, i) => 
      `https://picsum.photos/400/600?random=${20 + i}`
    );
  }
  
  console.log('Selecting photos for theme:', theme.id);
  console.log('Available assets:', userAssets.length);
  console.log('Theme emotions:', theme.emotions);
  console.log('Voice input:', voiceInput);
  
  // Score assets based on voice input relevance AND theme compatibility
  const scoredAssets = userAssets.map((asset, index) => {
    let score = 0;
    
    // PRIORITY 1: Voice input relevance (MASSIVELY increased weight for content matching)
    if (voiceInput && voiceInput.trim() !== 'Create an engaging slideshow about my content') {
      const voiceRelevance = calculateVoiceInputRelevance(asset, voiceInput);
      score += voiceRelevance * 100; // DOUBLED weight - content relevance must dominate over viral scores
      console.log(`Asset ${index}: voice relevance=${voiceRelevance.toFixed(2)}`);
    }
    
    // PRIORITY 2: Theme emotion matching (medium weight)
    const assetEmotions = asset.ai_analysis?.emotions || [];
    const emotionMatches = assetEmotions.filter(emotion => 
      theme.emotions.includes(emotion)
    ).length;
    score += emotionMatches * 3; // Reduced weight
    
    // PRIORITY 3: Theme content type matching (medium weight)
    const assetContentType = asset.ai_analysis?.content_type || '';
    if (theme.optimal_for.some(type => assetContentType.includes(type))) {
      score += 2; // Reduced weight
    }
    
    // PRIORITY 4: Quality and viral potential (lower weight)
    score += (asset.viral_potential_score || 0) * 0.3;
    score += (asset.quality_score || 0) * 0.3;
    
    // Small randomization to break ties
    score += Math.random() * 1;
    
    console.log(`Asset ${index}: emotions=${assetEmotions.join(',')}, total_score=${score.toFixed(2)}`);
    
    return { ...asset, theme_compatibility_score: score, original_index: index };
  });
  
  // Sort by compatibility but ensure diversity
  const sortedAssets = scoredAssets
    .sort((a, b) => b.theme_compatibility_score - a.theme_compatibility_score);
  
  console.log('Top scored assets:', sortedAssets.slice(0, slideCount + 2).map(a => 
    `Score: ${a.theme_compatibility_score.toFixed(2)}, Emotions: ${a.ai_analysis?.emotions?.join(',') || 'none'}`
  ));
  
  // Select photos with diversity - don't just take top 4
  const selectedAssets = [];
  const usedIndices = new Set();
  
  // First, take the highest scoring asset
  if (sortedAssets.length > 0) {
    selectedAssets.push(sortedAssets[0]);
    usedIndices.add(sortedAssets[0].original_index);
  }
  
  // Then diversify selection from remaining high-scoring assets
  for (let i = 1; i < sortedAssets.length && selectedAssets.length < slideCount; i++) {
    const asset = sortedAssets[i];
    
    // Skip if we already selected this asset
    if (usedIndices.has(asset.original_index)) continue;
    
    // Add some variety - don't just pick consecutive assets
    if (selectedAssets.length < slideCount) {
      selectedAssets.push(asset);
      usedIndices.add(asset.original_index);
    }
  }
  
  // Fill remaining slots with random assets if needed
  while (selectedAssets.length < slideCount && userAssets.length > selectedAssets.length) {
    const remainingAssets = userAssets.filter((_, index) => !usedIndices.has(index));
    if (remainingAssets.length === 0) break;
    
    const randomAsset = remainingAssets[Math.floor(Math.random() * remainingAssets.length)];
    const originalIndex = userAssets.findIndex(a => a.r2_url === randomAsset.r2_url);
    selectedAssets.push(randomAsset);
    usedIndices.add(originalIndex);
  }
  
  console.log('Final selected assets for slideshow:');
  selectedAssets.forEach((asset, i) => {
    console.log(`  ${i + 1}. URL: ${asset.r2_url}, Score: ${asset.theme_compatibility_score?.toFixed(2)}, Description: ${asset.ai_analysis?.scene_description || 'N/A'}`);
  });
  
  const selectedUrls = selectedAssets.map(asset => asset.r2_url);
  console.log('Returning selected photo URLs:', selectedUrls);
  
  return selectedUrls;
}

async function generateViralElements(options: {
  voiceInput: string;
  theme: any;
  slideshowContent: any;
  userContext: any;
}) {
  const { voiceInput, theme, slideshowContent, userContext } = options;
  
  const viralPrompt = `
Create viral hook and caption for a "${theme.name}" themed slideshow.

User Input: "${voiceInput}"
Slideshow Content: ${slideshowContent.slides.map((s: any) => s.text).join(' → ')}

Generate:
1. A viral hook (first 3 seconds text) that uses the theme's hook strategy
2. A caption that encourages engagement and follows viral patterns
3. Relevant hashtags that align with the theme and content

Theme Hook Strategy: ${theme.writing_style_prompts.hook}

Format as JSON:
{
  "viral_hook": "compelling hook text",
  "caption": "engaging caption with call to action", 
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}
`;

  try {
    const response = await openRouter.generateText({
      model: OPENROUTER_MODELS.CAPTION_GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are a viral content strategist who creates hooks and captions that drive massive engagement. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: viralPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8
    });

    const viralElements = parseAIResponse(response.content);
    
    if (!validateAIResponse(viralElements, ['viral_hook', 'caption', 'hashtags'])) {
      throw new Error('Invalid viral elements response');
    }

    return viralElements;

  } catch (error) {
    console.error('Viral elements generation error:', error);
    
    // Fallback viral elements
    return {
      viral_hook: slideshowContent.slides[0]?.text || 'You won\'t believe this...',
      caption: `This ${theme.name.toLowerCase()} content will change how you see things! 🔥`,
      hashtags: ['#fyp', '#viral', `#${theme.id}`, '#trending', '#mindblown']
    };
  }
}

function constructSlideshow(options: {
  theme: any;
  slideshowContent: any;
  selectedPhotos: string[];
  viralElements: any;
  slideCount: number;
}) {
  const { theme, slideshowContent, selectedPhotos, viralElements, slideCount } = options;
  
  console.log('Constructing slideshow with photos:', selectedPhotos);
  console.log('Slideshow content slides:', slideshowContent.slides.map((s: any, i: number) => 
    `Slide ${i + 1}: "${s.text}"`
  ));
  
  const slides = slideshowContent.slides.map((slideContent: any, index: number) => {
    const imageUrl = selectedPhotos[index] || `https://picsum.photos/400/600?random=${30 + index}`;
    console.log(`Slide ${index + 1}: Text="${slideContent.text}" -> Photo="${imageUrl}"`);
    
    return {
      id: `slide-${index + 1}`,
      imageUrl,
      text: slideContent.text,
      textStyle: theme.textStyle,
      textPosition: { x: 0.5, y: 0.25 }, // Centered positioning
      textScale: 1,
      textRotation: 0,
      metadata: {
        role: slideContent.role,
        viral_strategy: slideContent.viral_strategy,
        emotion_target: slideContent.emotion_target
      }
    };
  });
  
  return {
    id: `generated-${Date.now()}`,
    title: `${theme.name} Magic`,
    template: theme.id,
    slides,
    viralHook: viralElements.viral_hook,
    caption: viralElements.caption,
    hashtags: viralElements.hashtags,
    estimatedViralScore: theme.viral_rate / 10,
    generationMetadata: {
      theme_used: theme.id,
      narrative_flow: slideshowContent.narrative_flow,
      content_method: 'ai_theme_driven'
    }
  };
}

function calculateVoiceInputRelevance(asset: any, voiceInput: string): number {
  if (!voiceInput || !asset.ai_analysis) return 0;

  const voice = voiceInput.toLowerCase();
  const assetTags = asset.ai_analysis.tags || [];
  const assetEmotions = asset.ai_analysis.emotions || [];
  const assetDescription = asset.ai_analysis.scene_description || '';
  const assetContentType = asset.ai_analysis.content_type || '';
  
  let relevanceScore = 0;
  
  console.log(`\n=== VOICE RELEVANCE DEBUG ===`);
  console.log(`Voice input: "${voiceInput}"`);
  console.log(`Asset description: "${assetDescription}"`);
  console.log(`Asset tags: [${assetTags.join(', ')}]`);
  console.log(`Asset emotions: [${assetEmotions.join(', ')}]`);
  
  // Extract keywords from voice input
  const voiceKeywords = voice.split(' ').filter(word => word.length > 2);
  
  // Match against asset tags (highest weight)
  const tagMatches = assetTags.filter(tag => 
    voiceKeywords.some(keyword => tag.toLowerCase().includes(keyword) || keyword.includes(tag.toLowerCase()))
  ).length;
  relevanceScore += tagMatches * 2;
  
  // Match against emotions (high weight)
  const emotionMatches = assetEmotions.filter(emotion => 
    voiceKeywords.some(keyword => emotion.toLowerCase().includes(keyword) || keyword.includes(emotion.toLowerCase()))
  ).length;
  relevanceScore += emotionMatches * 1.5;
  
  // Match against scene description (medium weight)
  const descriptionMatches = voiceKeywords.filter(keyword => 
    assetDescription.toLowerCase().includes(keyword)
  ).length;
  relevanceScore += descriptionMatches * 1.5;
  
  // Match against content type (medium weight)
  const contentMatches = voiceKeywords.filter(keyword => 
    assetContentType.toLowerCase().includes(keyword)
  ).length;
  relevanceScore += contentMatches * 1;
  
  // Special contextual matching for specific locations/venues FIRST (highest priority)
  if (voice.includes('museum') || voice.includes('air museum') || voice.includes('aircraft')) {
    if (assetTags.some(tag => ['museum', 'aircraft', 'plane', 'aviation', 'military', 'vintage aircraft', 'air force', 'historical', 'exhibition'].includes(tag.toLowerCase()))) {
      relevanceScore += 8; // VERY high priority for specific locations
    }
    if (assetDescription.toLowerCase().includes('museum') || assetDescription.toLowerCase().includes('aircraft') || assetDescription.toLowerCase().includes('plane')) {
      relevanceScore += 6;
    }
  }
  
  // Only apply general nostalgic matching if no specific location match found
  if (voice.includes('childhood') || voice.includes('memories') || voice.includes('nostalgic')) {
    // Don't give nostalgic bonus if we already matched a specific location
    const hasLocationMatch = relevanceScore > 10; // If we already got location points
    if (!hasLocationMatch) {
      if (assetTags.some(tag => ['childhood', 'memories', 'nostalgic', 'family', 'young', 'past', 'kids'].includes(tag.toLowerCase()))) {
        relevanceScore += 4;
      }
      if (assetEmotions.some(emotion => ['nostalgic', 'sentimental', 'emotional', 'happy', 'warm'].includes(emotion.toLowerCase()))) {
        relevanceScore += 3;
      }
    }
  }
  
  if (voice.includes('travel') || voice.includes('adventure') || voice.includes('journey') || voice.includes('vacation')) {
    if (assetTags.some(tag => ['travel', 'adventure', 'journey', 'destination', 'explore', 'vacation', 'trip'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
    if (assetContentType.includes('landscape') || assetContentType.includes('location')) {
      relevanceScore += 3;
    }
  }
  
  if (voice.includes('food') || voice.includes('cooking') || voice.includes('meal') || voice.includes('recipe')) {
    if (assetTags.some(tag => ['food', 'cooking', 'meal', 'recipe', 'dish', 'eat', 'restaurant'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
  }
  
  if (voice.includes('workout') || voice.includes('fitness') || voice.includes('exercise') || voice.includes('gym')) {
    if (assetTags.some(tag => ['fitness', 'workout', 'exercise', 'gym', 'sport', 'training'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
  }
  
  if (voice.includes('nature') || voice.includes('outdoor') || voice.includes('hiking')) {
    if (assetTags.some(tag => ['nature', 'outdoor', 'hiking', 'forest', 'mountain', 'beach', 'landscape'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
  }
  
  if (voice.includes('work') || voice.includes('office') || voice.includes('business')) {
    if (assetTags.some(tag => ['work', 'office', 'business', 'professional', 'meeting', 'workplace'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
  }
  
  if (voice.includes('family') || voice.includes('friends') || voice.includes('social')) {
    if (assetTags.some(tag => ['family', 'friends', 'social', 'group', 'people', 'together'].includes(tag.toLowerCase()))) {
      relevanceScore += 4;
    }
  }
  
  // Normalize score to 0-10 range
  const finalScore = Math.min(relevanceScore, 10);
  console.log(`Final relevance score: ${finalScore}`);
  console.log(`=== END DEBUG ===\n`);
  
  return finalScore;
}