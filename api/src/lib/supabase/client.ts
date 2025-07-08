import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Type-safe database interface
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          tiktok_id: string | null;
          facebook_id: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'creator_pro' | 'viral_studio';
          library_photo_count: number;
          total_slideshows_created: number;
          viral_success_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tiktok_id?: string | null;
          facebook_id?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'creator_pro' | 'viral_studio';
          library_photo_count?: number;
          total_slideshows_created?: number;
          viral_success_count?: number;
        };
        Update: {
          tiktok_id?: string | null;
          facebook_id?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'creator_pro' | 'viral_studio';
          library_photo_count?: number;
          total_slideshows_created?: number;
          viral_success_count?: number;
        };
      };
      asset_library: {
        Row: {
          id: string;
          user_id: string;
          r2_url: string;
          file_type: 'image' | 'video';
          original_filename: string | null;
          file_size: number | null;
          ai_analysis: any | null; // JSONB
          analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
          viral_potential_score: number | null;
          quality_score: number | null;
          times_used: number;
          viral_success_rate: number;
          upload_method: 'single' | 'bulk' | 'camera';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          r2_url: string;
          file_type?: 'image' | 'video';
          original_filename?: string | null;
          file_size?: number | null;
          ai_analysis?: any | null;
          analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
          viral_potential_score?: number | null;
          quality_score?: number | null;
          times_used?: number;
          viral_success_rate?: number;
          upload_method?: 'single' | 'bulk' | 'camera';
        };
        Update: {
          ai_analysis?: any | null;
          analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
          viral_potential_score?: number | null;
          quality_score?: number | null;
          times_used?: number;
          viral_success_rate?: number;
        };
      };
      slideshows: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          template_used: string;
          generation_prompt: string | null;
          slides: any; // JSONB
          viral_hook: string | null;
          generated_caption: string | null;
          hashtags: string[] | null;
          estimated_viral_score: number | null;
          actual_performance: any | null; // JSONB
          creation_time_seconds: number | null;
          is_bulk_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          template_used: string;
          generation_prompt?: string | null;
          slides: any;
          viral_hook?: string | null;
          generated_caption?: string | null;
          hashtags?: string[] | null;
          estimated_viral_score?: number | null;
          actual_performance?: any | null;
          creation_time_seconds?: number | null;
          is_bulk_generated?: boolean;
        };
        Update: {
          title?: string;
          viral_hook?: string | null;
          generated_caption?: string | null;
          hashtags?: string[] | null;
          estimated_viral_score?: number | null;
          actual_performance?: any | null;
        };
      };
      viral_templates: {
        Row: {
          id: string;
          name: string;
          hook_formula: string;
          caption_template: string;
          slide_count_range: any; // JSONB
          success_metrics: any | null; // JSONB
          target_emotions: string[] | null;
          optimal_photo_types: string[] | null;
          premium_only: boolean;
          is_active: boolean;
          created_at: string;
        };
      };
    };
  };
};

// Utility functions for common database operations
export const db = {
  // Asset operations
  async createAsset(asset: Database['public']['Tables']['asset_library']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('asset_library')
      .insert(asset)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAssetAnalysis(
    assetId: string, 
    analysis: any, 
    viralScore: number, 
    qualityScore: number
  ) {
    const { data, error } = await supabaseAdmin
      .from('asset_library')
      .update({
        ai_analysis: analysis,
        analysis_status: 'completed',
        viral_potential_score: viralScore,
        quality_score: qualityScore
      })
      .eq('id', assetId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAnalyzedAssets(userId: string, limit = 50) {
    const { data, error } = await supabaseAdmin
      .from('asset_library')
      .select('*')
      .eq('user_id', userId)
      .eq('analysis_status', 'completed')
      .order('viral_potential_score', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  // Template operations
  async getActiveTemplates() {
    const { data, error } = await supabaseAdmin
      .from('viral_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Slideshow operations
  async createSlideshow(slideshow: Database['public']['Tables']['slideshows']['Insert']) {
    const { data, error } = await supabaseAdmin
      .from('slideshows')
      .insert(slideshow)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};