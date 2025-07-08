-- Famatic.app Database Schema for MVP
-- Supabase migration created via CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (minimal for MVP)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_id TEXT UNIQUE,
  facebook_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator_pro', 'viral_studio')),
  library_photo_count INTEGER DEFAULT 0,
  total_slideshows_created INTEGER DEFAULT 0,
  viral_success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Library (Updated for Async Processing)
CREATE TABLE asset_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  r2_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image' CHECK (file_type IN ('image', 'video')),
  original_filename TEXT,
  file_size INTEGER,
  ai_analysis JSONB, -- Rich metadata for fast querying
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  viral_potential_score FLOAT,
  quality_score FLOAT,
  times_used INTEGER DEFAULT 0,
  viral_success_rate FLOAT DEFAULT 0,
  upload_method TEXT DEFAULT 'single' CHECK (upload_method IN ('single', 'bulk', 'camera')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slideshows table
CREATE TABLE slideshows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_used TEXT NOT NULL,
  generation_prompt TEXT,
  slides JSONB NOT NULL, -- Array of slide objects with asset references
  viral_hook TEXT,
  generated_caption TEXT,
  hashtags TEXT[],
  estimated_viral_score FLOAT,
  actual_performance JSONB, -- Views, likes, shares if shared
  creation_time_seconds FLOAT,
  is_bulk_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viral Templates table
CREATE TABLE viral_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hook_formula TEXT NOT NULL,
  caption_template TEXT NOT NULL,
  slide_count_range JSONB NOT NULL, -- {min: 6, max: 10}
  success_metrics JSONB, -- Research-backed performance data
  target_emotions TEXT[], -- ['curiosity', 'shock', 'relatability']
  optimal_photo_types TEXT[], -- ['candid', 'before_after', 'lifestyle']
  premium_only BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_asset_library_user_id ON asset_library(user_id);
CREATE INDEX idx_asset_library_analysis_status ON asset_library(analysis_status);
CREATE INDEX idx_asset_library_viral_score ON asset_library(viral_potential_score DESC);
CREATE INDEX idx_asset_library_ai_analysis ON asset_library USING GIN(ai_analysis);

CREATE INDEX idx_slideshows_user_id ON slideshows(user_id);
CREATE INDEX idx_slideshows_created_at ON slideshows(created_at DESC);

CREATE INDEX idx_viral_templates_active ON viral_templates(is_active) WHERE is_active = TRUE;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users table
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE slideshows ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own assets" ON asset_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON asset_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON asset_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON asset_library FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own slideshows" ON slideshows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slideshows" ON slideshows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slideshows" ON slideshows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slideshows" ON slideshows FOR DELETE USING (auth.uid() = user_id);

-- Public read access for viral templates
CREATE POLICY "Anyone can view active templates" ON viral_templates FOR SELECT USING (is_active = TRUE);