-- Seed data for Famatic.app MVP
-- Viral templates based on research from claude.md

-- Insert viral templates based on research
INSERT INTO viral_templates (name, hook_formula, caption_template, slide_count_range, success_metrics, target_emotions, optimal_photo_types, premium_only) VALUES
(
  'day_in_life',
  'Day {number} of {activity} - you won''t believe what happened!',
  'Following my {routine} for {duration} and the results are insane! What should I try next? 👀',
  '{"min": 6, "max": 8}',
  '{"viral_rate": 0.75, "avg_views": 900000, "best_for": ["lifestyle", "routine", "authentic"]}',
  ARRAY['authentic', 'relatable', 'curiosity'],
  ARRAY['candid', 'lifestyle', 'routine'],
  FALSE
),
(
  'hidden_gems',
  'Hidden {location} that 99% of people don''t know about...',
  'Found this secret {place} and I''m obsessed! 📍 Save this for your next {activity}',
  '{"min": 7, "max": 10}',
  '{"viral_rate": 0.89, "avg_views": 2300000, "best_for": ["travel", "discovery", "secrets"]}',
  ARRAY['curiosity', 'shock', 'discovery'],
  ARRAY['travel', 'outdoor', 'discovery'],
  FALSE
),
(
  'before_after',
  'This {transformation} will change how you see {topic}...',
  'The glow up is REAL! {timeframe} difference and I''m never going back ✨',
  '{"min": 6, "max": 8}',
  '{"viral_rate": 0.84, "avg_views": 1800000, "best_for": ["transformation", "progress", "improvement"]}',
  ARRAY['shock', 'inspiration', 'relatability'],
  ARRAY['before_after', 'transformation', 'progress'],
  FALSE
),
(
  'things_that',
  'Things that just hit different when you''re {situation}...',
  'If you know, you know 💯 What would you add to this list?',
  '{"min": 8, "max": 10}',
  '{"viral_rate": 0.82, "avg_views": 1500000, "best_for": ["lists", "relatable", "nostalgia"]}',
  ARRAY['relatability', 'nostalgia', 'community'],
  ARRAY['candid', 'lifestyle', 'authentic'],
  FALSE
),
(
  'pov_youre',
  'POV: You''re {character} and {situation}...',
  'This is too real 😭 Tag someone who needs to see this',
  '{"min": 6, "max": 9}',
  '{"viral_rate": 0.78, "avg_views": 1200000, "best_for": ["scenarios", "relatable", "comedy"]}',
  ARRAY['relatability', 'humor', 'community'],
  ARRAY['candid', 'expressive', 'authentic'],
  FALSE
),
(
  'photo_dump',
  'Recent camera roll hits different...',
  'Just some moments that made me smile lately 📸 What''s in your camera roll?',
  '{"min": 8, "max": 12}',
  '{"viral_rate": 0.75, "avg_views": 900000, "best_for": ["authentic", "casual", "lifestyle"]}',
  ARRAY['authentic', 'nostalgia', 'relatability'],
  ARRAY['candid', 'lifestyle', 'authentic'],
  FALSE
),
(
  'controversial_take',
  'This might be controversial but {opinion}...',
  'Said what I said 🤷‍♀️ What''s your take on this?',
  '{"min": 6, "max": 8}',
  '{"viral_rate": 0.71, "avg_views": 850000, "best_for": ["opinions", "debate", "engagement"]}',
  ARRAY['controversial', 'curiosity', 'community'],
  ARRAY['expressive', 'candid', 'authentic'],
  TRUE
);

-- Insert a default MVP user for testing (optional)
INSERT INTO users (id, username, display_name, subscription_tier) VALUES
('00000000-0000-0000-0000-000000000001', 'mvp_user', 'MVP Test User', 'free');