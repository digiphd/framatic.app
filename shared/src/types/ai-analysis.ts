/**
 * Standardized AI Analysis JSON structure for image analysis
 * This structure will be stored in the ai_analysis JSONB field
 */

export interface AIAnalysis {
  // Basic content analysis
  description: string; // Detailed description of what's in the image
  scene_type: 'portrait' | 'landscape' | 'street' | 'indoor' | 'outdoor' | 'food' | 'travel' | 'lifestyle' | 'product' | 'other';
  
  // Visual characteristics
  lighting: {
    type: 'natural' | 'artificial' | 'mixed' | 'golden_hour' | 'blue_hour' | 'harsh' | 'soft';
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    direction: 'front' | 'back' | 'side' | 'top' | 'mixed';
  };
  
  composition: {
    rule_of_thirds: boolean;
    leading_lines: boolean;
    symmetry: boolean;
    framing: boolean;
    depth_of_field: 'shallow' | 'medium' | 'deep';
  };
  
  colors: {
    dominant_colors: string[]; // Hex color codes
    color_palette: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted' | 'monochrome';
    contrast: 'high' | 'medium' | 'low';
  };
  
  // Content analysis
  subjects: {
    people: {
      count: number;
      age_groups: ('child' | 'teen' | 'adult' | 'senior')[];
      emotions: ('happy' | 'sad' | 'excited' | 'calm' | 'surprised' | 'neutral')[];
      activities: string[];
    };
    objects: string[]; // List of objects detected
    animals: string[]; // List of animals detected
    locations: string[]; // Location/setting descriptors
  };
  
  // Technical quality
  quality: {
    overall_score: number; // 0-10 scale
    sharpness: number; // 0-10 scale
    exposure: 'underexposed' | 'well_exposed' | 'overexposed';
    noise_level: 'low' | 'medium' | 'high';
    resolution_quality: 'low' | 'medium' | 'high';
  };
  
  // Viral potential analysis
  viral_potential: {
    score: number; // 0-10 scale
    factors: string[]; // What makes it potentially viral
    best_templates: string[]; // Which slideshow templates this would work well with
    engagement_prediction: 'low' | 'medium' | 'high';
  };
  
  // Searchable tags
  tags: string[]; // Comprehensive list of searchable tags
  
  // Template compatibility
  template_suitability: {
    [templateName: string]: {
      score: number; // 0-10 how well it fits this template
      reasoning: string; // Why it fits or doesn't fit
    };
  };
  
  // Metadata
  analysis_version: string; // Version of the analysis model used
  analyzed_at: string; // ISO timestamp
  confidence_score: number; // 0-1 overall confidence in the analysis
}

// Template types for reference
export const SLIDESHOW_TEMPLATES = [
  'hidden_gems',
  'before_after', 
  'day_in_life',
  'photo_dump',
  'travel_guide',
  'food_review',
  'lifestyle_tips',
  'product_showcase'
] as const;

export type SlideshowTemplate = typeof SLIDESHOW_TEMPLATES[number];

// Asset library item with analysis
export interface AssetLibraryItem {
  id: string;
  user_id: string;
  r2_url: string;
  original_filename: string;
  file_size: number;
  file_type: 'image' | 'video';
  upload_method: 'single' | 'bulk' | 'camera';
  
  // Analysis status and data
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_analysis?: AIAnalysis;
  
  // Extracted for fast querying
  viral_potential_score?: number;
  quality_score?: number;
  
  // Usage tracking
  times_used: number;
  viral_success_rate: number;
  
  created_at: string;
  updated_at: string;
}

// Search filters for library
export interface LibrarySearchFilters {
  scene_type?: string[];
  lighting_type?: string[];
  color_palette?: string[];
  has_people?: boolean;
  viral_potential_min?: number;
  quality_min?: number;
  tags?: string[];
  template_compatibility?: string;
}