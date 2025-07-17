interface Photo {
  id: string;
  url: string;
  r2_url?: string;
  filename: string;
  original_filename?: string;
  uploadedAt: string;
  created_at?: string;
  qualityScore: number;
  quality_score?: number;
  viralScore?: number;
  viral_potential_score?: number;
  emotions: string[];
  tags: string[];
  isFavorite: boolean;
  fileSize: string;
  file_size?: number;
  ai_analysis?: {
    emotions?: string[];
    tags?: string[];
    content_type?: string;
    lighting?: string;
    composition?: string;
    scene_description?: string;
    best_for_templates?: string[];
    colors?: string[];
    face_count?: number;
    quality_score?: number;
    viral_potential?: number;
  };
  analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export type { Photo };

export interface PhotoAnalysis {
  emotions: string[];
  tags: string[];
  content_type: string;
  lighting: string;
  composition: string;
  scene_description: string;
  best_for_templates: string[];
  colors: string[];
  face_count: number;
  quality_score: number;
  viral_potential: number;
}