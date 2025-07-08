import { AIAnalysis, SLIDESHOW_TEMPLATES } from '../../../shared/src/types/ai-analysis';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY environment variable');
}

/**
 * Convert image buffer to base64 data URL
 */
function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Create the analysis prompt for the vision model
 */
function createAnalysisPrompt(): string {
  return `
You are an expert image analyst for a viral content creation platform. Analyze this image and provide a detailed JSON response with the following structure:

{
  "description": "Detailed description of what's in the image",
  "scene_type": "portrait|landscape|street|indoor|outdoor|food|travel|lifestyle|product|other",
  "lighting": {
    "type": "natural|artificial|mixed|golden_hour|blue_hour|harsh|soft",
    "quality": "excellent|good|fair|poor",
    "direction": "front|back|side|top|mixed"
  },
  "composition": {
    "rule_of_thirds": true/false,
    "leading_lines": true/false,
    "symmetry": true/false,
    "framing": true/false,
    "depth_of_field": "shallow|medium|deep"
  },
  "colors": {
    "dominant_colors": ["#hex1", "#hex2", "#hex3"],
    "color_palette": "warm|cool|neutral|vibrant|muted|monochrome",
    "contrast": "high|medium|low"
  },
  "subjects": {
    "people": {
      "count": 0,
      "age_groups": ["child|teen|adult|senior"],
      "emotions": ["happy|sad|excited|calm|surprised|neutral"],
      "activities": ["activity1", "activity2"]
    },
    "objects": ["object1", "object2"],
    "animals": ["animal1", "animal2"],
    "locations": ["location1", "location2"]
  },
  "quality": {
    "overall_score": 8.5,
    "sharpness": 9.0,
    "exposure": "underexposed|well_exposed|overexposed",
    "noise_level": "low|medium|high",
    "resolution_quality": "low|medium|high"
  },
  "viral_potential": {
    "score": 7.2,
    "factors": ["factor1", "factor2"],
    "best_templates": ["template1", "template2"],
    "engagement_prediction": "low|medium|high"
  },
  "tags": ["tag1", "tag2", "tag3"],
  "template_suitability": {
    "hidden_gems": {"score": 8.5, "reasoning": "Perfect for showcasing unique locations"},
    "before_after": {"score": 3.2, "reasoning": "No transformation element present"},
    "day_in_life": {"score": 7.0, "reasoning": "Captures authentic daily moment"},
    "photo_dump": {"score": 9.0, "reasoning": "Great candid aesthetic"},
    "travel_guide": {"score": 6.5, "reasoning": "Shows interesting location"},
    "food_review": {"score": 2.0, "reasoning": "No food content visible"},
    "lifestyle_tips": {"score": 7.5, "reasoning": "Could inspire lifestyle content"},
    "product_showcase": {"score": 4.0, "reasoning": "No clear product focus"}
  },
  "confidence_score": 0.85
}

Important guidelines:
1. Be accurate and specific in your analysis
2. Use realistic scores (0-10 scale where appropriate)
3. Provide actionable insights for content creation
4. Focus on viral potential and social media appeal
5. Consider TikTok/Instagram aesthetics and trends
6. Return valid JSON only, no markdown formatting

Available templates: ${SLIDESHOW_TEMPLATES.join(', ')}
`;
}

/**
 * Analyze an image using OpenRouter's vision model
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<AIAnalysis> {
  try {
    // Convert image to base64 data URL
    const dataUrl = bufferToDataUrl(imageBuffer, mimeType);
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://framatic.app',
        'X-Title': 'Framatic - AI Image Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: createAnalysisPrompt()
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1, // Low temperature for consistent analysis
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter');
    }

    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let analysis: AIAnalysis;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', content);
      throw new Error('Failed to parse analysis response as JSON');
    }

    // Add metadata
    analysis.analysis_version = '1.0.0';
    analysis.analyzed_at = new Date().toISOString();
    
    // Validate and clean the analysis
    return validateAndCleanAnalysis(analysis);

  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and clean the AI analysis response
 */
function validateAndCleanAnalysis(analysis: any): AIAnalysis {
  // Ensure required fields exist with defaults
  const cleanAnalysis: AIAnalysis = {
    description: analysis.description || 'No description available',
    scene_type: analysis.scene_type || 'other',
    lighting: {
      type: analysis.lighting?.type || 'natural',
      quality: analysis.lighting?.quality || 'good',
      direction: analysis.lighting?.direction || 'front'
    },
    composition: {
      rule_of_thirds: analysis.composition?.rule_of_thirds || false,
      leading_lines: analysis.composition?.leading_lines || false,
      symmetry: analysis.composition?.symmetry || false,
      framing: analysis.composition?.framing || false,
      depth_of_field: analysis.composition?.depth_of_field || 'medium'
    },
    colors: {
      dominant_colors: analysis.colors?.dominant_colors || [],
      color_palette: analysis.colors?.color_palette || 'neutral',
      contrast: analysis.colors?.contrast || 'medium'
    },
    subjects: {
      people: {
        count: analysis.subjects?.people?.count || 0,
        age_groups: analysis.subjects?.people?.age_groups || [],
        emotions: analysis.subjects?.people?.emotions || [],
        activities: analysis.subjects?.people?.activities || []
      },
      objects: analysis.subjects?.objects || [],
      animals: analysis.subjects?.animals || [],
      locations: analysis.subjects?.locations || []
    },
    quality: {
      overall_score: Math.max(0, Math.min(10, analysis.quality?.overall_score || 5)),
      sharpness: Math.max(0, Math.min(10, analysis.quality?.sharpness || 5)),
      exposure: analysis.quality?.exposure || 'well_exposed',
      noise_level: analysis.quality?.noise_level || 'low',
      resolution_quality: analysis.quality?.resolution_quality || 'medium'
    },
    viral_potential: {
      score: Math.max(0, Math.min(10, analysis.viral_potential?.score || 5)),
      factors: analysis.viral_potential?.factors || [],
      best_templates: analysis.viral_potential?.best_templates || [],
      engagement_prediction: analysis.viral_potential?.engagement_prediction || 'medium'
    },
    tags: analysis.tags || [],
    template_suitability: analysis.template_suitability || {},
    analysis_version: analysis.analysis_version || '1.0.0',
    analyzed_at: analysis.analyzed_at || new Date().toISOString(),
    confidence_score: Math.max(0, Math.min(1, analysis.confidence_score || 0.5))
  };

  return cleanAnalysis;
}