export interface UserContext {
  id: string;
  user_id: string;
  creator_type: 'personal' | 'lifestyle' | 'business' | 'influencer' | 'brand';
  business_category: string | null;
  tone_of_voice: 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational' | 'trendy';
  target_audience: string | null;
  content_goals: string[];
  posting_frequency: 'daily' | 'weekly' | 'occasional';
  preferred_hashtags: string[];
  brand_keywords: string[];
  content_style_preferences: ContentStylePreferences | null;
  viral_content_examples: string[] | null;
  context_learning_data: ContextLearningData | null;
  created_at: string;
  updated_at: string;
}

export interface ContentStylePreferences {
  color_palette?: string[];
  visual_style?: 'minimalist' | 'vibrant' | 'dark_mode' | 'natural' | 'professional';
  text_overlay_style?: 'bold' | 'subtle' | 'creative' | 'clean';
  preferred_templates?: string[];
  avoid_templates?: string[];
  custom_hooks?: string[];
}

export interface ContextLearningData {
  successful_captions?: string[];
  high_performing_hashtags?: string[];
  best_performing_templates?: string[];
  optimal_posting_times?: string[];
  audience_engagement_patterns?: {
    likes_per_view?: number;
    comments_per_view?: number;
    shares_per_view?: number;
    viral_threshold?: number;
  };
  content_iteration_history?: {
    original_caption?: string;
    final_caption?: string;
    performance_improvement?: number;
    timestamp?: string;
  }[];
}

export interface UserContextInput {
  creator_type: 'personal' | 'lifestyle' | 'business' | 'influencer' | 'brand';
  business_category?: string;
  tone_of_voice: 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational' | 'trendy';
  target_audience?: string;
  content_goals: string[];
  posting_frequency: 'daily' | 'weekly' | 'occasional';
  preferred_hashtags?: string[];
  brand_keywords?: string[];
  content_style_preferences?: ContentStylePreferences;
  viral_content_examples?: string[];
}

export interface ContextAwareSlideshowRequest {
  selected_asset_ids: string[];
  user_prompt?: string;
  template_preference?: string;
  style_override?: {
    tone?: 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational' | 'trendy';
    target_audience?: string;
    content_goals?: string[];
  };
}

export interface ContextAwareTemplateSelection {
  template_id: string;
  template_name: string;
  relevance_score: number;
  context_match_reasons: string[];
  hook_formula: string;
  caption_template: string;
  recommended_hashtags: string[];
}