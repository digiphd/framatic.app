-- Replace existing templates with 3 high-quality MVP templates
-- This migration removes the 7 existing templates and replaces them with 3 visually-tested ones

-- First, clear existing templates
DELETE FROM viral_templates;

-- Insert the 3 MVP templates with viral names and precise styling
INSERT INTO viral_templates (
  name, 
  hook_formula, 
  caption_template, 
  slide_count_range, 
  success_metrics, 
  target_emotions, 
  optimal_photo_types, 
  premium_only,
  is_active
) VALUES
(
  'minimalist_viral',
  'POV: {situation} and it hits different...',
  'The way this {topic} changed everything for me 🔥 Save this if you need to hear it too',
  '{"min": 6, "max": 8}',
  '{"viral_rate": 0.92, "avg_views": 2800000, "best_for": ["authentic", "lifestyle", "photo_dumps"], "textStyle": {"fontSize": 18, "fontWeight": "bold", "color": "#FFFFFF", "backgroundColor": "transparent", "backgroundMode": "none", "letterSpacing": 0.5, "textAlign": "center"}, "positioning": {"x": 0.5, "y": 0.3, "scale": 1.0, "rotation": 0}}',
  ARRAY['authentic', 'relatable', 'curiosity'],
  ARRAY['candid', 'lifestyle', 'portrait'],
  FALSE,
  TRUE
),
(
  'story_mode',
  'This is your sign to {action}...',
  'Needed to share this because it changed my perspective completely ✨ What would you add?',
  '{"min": 7, "max": 10}',
  '{"viral_rate": 0.88, "avg_views": 2200000, "best_for": ["storytelling", "testimonials", "advice"], "textStyle": {"fontSize": 18, "fontWeight": "bold", "color": "#000000", "backgroundColor": "rgba(255, 255, 255, 1.0)", "backgroundMode": "per_line", "letterSpacing": 0.3, "textTransform": "none"}, "positioning": {"x": 0.5, "y": 0.3, "scale": 1.0, "rotation": 0}}',
  ARRAY['inspiration', 'community', 'relatability'],
  ARRAY['candid', 'expressive', 'lifestyle'],
  FALSE,
  TRUE
),
(
  'pop_off',
  'Hot take: {controversial_opinion}...',
  'Said what I said 🤷‍♀️ This is the energy we need more of - agree or disagree?',
  '{"min": 5, "max": 7}',
  '{"viral_rate": 0.85, "avg_views": 1900000, "best_for": ["opinions", "controversy", "bold_statements"], "textStyle": {"fontSize": 18, "fontWeight": "bold", "color": "#FFFFFF", "backgroundColor": "rgba(0, 0, 0, 1.0)", "backgroundMode": "per_line", "letterSpacing": 0.3, "textTransform": "none"}, "positioning": {"x": 0.5, "y": 0.3, "scale": 1.0, "rotation": 0}}',
  ARRAY['controversial', 'bold', 'engagement'],
  ARRAY['expressive', 'portrait', 'candid'],
  FALSE,
  TRUE
);