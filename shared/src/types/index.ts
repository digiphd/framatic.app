// Core types for Famatic.app

export interface User {
  id: string;
  tiktok_id?: string;
  facebook_id?: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'creator_pro' | 'viral_studio';
  library_photo_count: number;
  total_slideshows_created: number;
  viral_success_count: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  r2_url: string;
  file_type: 'image' | 'video';
  original_filename: string;
  file_size: number;
  ai_analysis: AssetAnalysis | null;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  viral_potential_score: number | null;
  quality_score: number | null;
  times_used: number;
  viral_success_rate: number;
  upload_method: 'single' | 'bulk' | 'camera';
  created_at: string;
}

export interface AssetAnalysis {
  emotions: string[];
  quality_score: number;
  viral_potential: number;
  content_type: string;
  lighting: string;
  composition: string;
  colors: string[];
  tags: string[];
  best_for_templates: string[];
  face_count: number;
  scene_description: string;
}

export interface Slideshow {
  id: string;
  user_id: string;
  title: string;
  template_used: string;
  generation_prompt: string;
  slides: SlideData[];
  viral_hook: string;
  generated_caption: string;
  hashtags: string[];
  estimated_viral_score: number;
  actual_performance: PerformanceData | null;
  creation_time_seconds: number;
  is_bulk_generated: boolean;
  created_at: string;
}

export interface SlideData {
  asset_id: string;
  asset_url: string;
  order: number;
  text_overlay?: string;
  transition_type: string;
  duration_ms: number;
}

export interface PerformanceData {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  platform: string;
  posted_at: string;
}

export interface ViralTemplate {
  id: string;
  name: string;
  hook_formula: string;
  caption_template: string;
  slide_count_range: {
    min: number;
    max: number;
  };
  success_metrics: {
    viral_rate: number;
    avg_views: number;
    best_for: string[];
  };
  target_emotions: string[];
  optimal_photo_types: string[];
  premium_only: boolean;
  is_active: boolean;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AssetUploadResponse {
  asset_id: string;
  r2_url: string;
  analysis_queued: boolean;
}

export interface SlideshowCreateRequest {
  voice_input?: string;
  text_input?: string;
  template_preference?: string;
  asset_ids?: string[];
}

export interface SlideshowCreateResponse {
  slideshow_id: string;
  preview_url: string;
  processing_time_seconds: number;
}

// OpenRouter.ai types
export interface OpenRouterModels {
  VOICE_TO_TEXT: 'openai/whisper-1';
  IMAGE_ANALYSIS: 'anthropic/claude-3.5-sonnet';
  SLIDESHOW_GENERATION: 'openai/gpt-4o';
  CAPTION_GENERATION: 'openai/gpt-4o';
  HASHTAG_GENERATION: 'openai/gpt-3.5-turbo';
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}