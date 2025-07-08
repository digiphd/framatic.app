// Constants for Famatic.app

export const OPENROUTER_MODELS = {
  VOICE_TO_TEXT: 'openai/whisper-1',
  IMAGE_ANALYSIS: 'anthropic/claude-3.5-sonnet',
  SLIDESHOW_GENERATION: 'openai/gpt-4o',
  CAPTION_GENERATION: 'openai/gpt-4o',
  HASHTAG_GENERATION: 'openai/gpt-4o-mini',
} as const;

export const VIRAL_TEMPLATES = {
  DAY_IN_LIFE: 'day_in_life',
  HIDDEN_GEMS: 'hidden_gems',
  BEFORE_AFTER: 'before_after',
  THINGS_THAT: 'things_that',
  POV_YOURE: 'pov_youre',
  PHOTO_DUMP: 'photo_dump',
  CONTROVERSIAL: 'controversial',
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  CREATOR_PRO: 'creator_pro',
  VIRAL_STUDIO: 'viral_studio',
} as const;

export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const UPLOAD_METHODS = {
  SINGLE: 'single',
  BULK: 'bulk',
  CAMERA: 'camera',
} as const;

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  
  // Assets
  ASSETS_UPLOAD: '/api/assets/upload',
  ASSETS_ANALYZE_BATCH: '/api/assets/analyze-batch',
  ASSETS_STATUS: '/api/assets/status',
  ASSETS_LIBRARY: '/api/assets/library',
  
  // AI
  AI_VOICE_TO_TEXT: '/api/ai/voice-to-text',
  AI_GENERATE_SLIDESHOW: '/api/ai/generate-slideshow',
  AI_MAGIC_CREATE: '/api/ai/magic-create',
  AI_VIRAL_SCORE: '/api/ai/viral-score',
  
  // Slideshow
  SLIDESHOW_EXPORT: '/api/slideshow/export',
  SLIDESHOW_PERFORMANCE: '/api/slideshow/performance',
  
  // Bulk
  BULK_UPLOAD: '/api/assets/bulk-upload',
  BULK_GENERATE: '/api/ai/bulk-generate',
  BULK_STATUS: '/api/bulk/status',
} as const;

export const PERFORMANCE_TARGETS = {
  SIGNUP_TIME_SECONDS: 10,
  SLIDESHOW_CREATION_SECONDS: 10,
  BATCH_ANALYSIS_IMAGES_PER_CALL: 5,
  MAX_BATCH_ANALYSIS_IMAGES: 10,
  BULK_PROCESSING_TIME_SECONDS: 60,
  FIRST_SLIDESHOW_TIME_SECONDS: 30,
} as const;

export const VIRAL_HOOKS = {
  CURIOSITY_GAP: "You won't believe what happened when...",
  CONTROVERSIAL: "This may be controversial, but...",
  DIRECT_CALLOUT: "If you're {target_audience}, stop scrolling!",
  SHOCK_VALUE: "I can't believe what I just discovered!",
  PROBLEM_SOLUTION: "Are you tired of {problem}? Try this!",
  BEFORE_AFTER: "This will change how you see...",
} as const;