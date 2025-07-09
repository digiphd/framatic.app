-- Migration: Add user_context table for context-aware slideshow generation
-- Created: 2025-01-09
-- Description: Adds user context table for personalized AI content generation

-- User Context table for context-aware slideshow generation
CREATE TABLE user_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  creator_type TEXT NOT NULL CHECK (creator_type IN ('personal', 'lifestyle', 'business', 'influencer', 'brand')),
  business_category TEXT,
  tone_of_voice TEXT NOT NULL CHECK (tone_of_voice IN ('casual', 'professional', 'funny', 'inspirational', 'educational', 'trendy')),
  target_audience TEXT,
  content_goals TEXT[] NOT NULL,
  posting_frequency TEXT DEFAULT 'weekly' CHECK (posting_frequency IN ('daily', 'weekly', 'occasional')),
  preferred_hashtags TEXT[] DEFAULT '{}',
  brand_keywords TEXT[] DEFAULT '{}',
  content_style_preferences JSONB,
  viral_content_examples TEXT[],
  context_learning_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_context_user_id ON user_context(user_id);
CREATE INDEX idx_user_context_creator_type ON user_context(creator_type);
CREATE INDEX idx_user_context_tone ON user_context(tone_of_voice);

-- Apply updated_at trigger to user_context table
CREATE TRIGGER update_user_context_updated_at 
  BEFORE UPDATE ON user_context 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own context" ON user_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own context" ON user_context FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own context" ON user_context FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own context" ON user_context FOR DELETE USING (auth.uid() = user_id);

-- Insert default context for MVP user
INSERT INTO user_context (
  user_id,
  creator_type,
  tone_of_voice,
  content_goals,
  posting_frequency,
  preferred_hashtags,
  brand_keywords
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'personal',
  'casual',
  ARRAY['Share experiences', 'Go viral'],
  'weekly',
  ARRAY['fyp', 'viral', 'authentic'],
  ARRAY['lifestyle', 'authentic', 'real']
) ON CONFLICT (user_id) DO NOTHING;