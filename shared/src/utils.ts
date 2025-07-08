// Utility functions for Famatic.app

import { AssetAnalysis, ViralTemplate } from './types';

export function generateId(): string {
  // Use Node.js crypto module or fallback to timestamp-based ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${Math.round(remainingSeconds)}s`;
}

export function calculateViralScore(analysis: AssetAnalysis): number {
  // Weighted scoring based on viral potential factors
  const emotionScore = analysis.emotions.includes('authentic') ? 0.3 : 0.2;
  const qualityScore = (analysis.quality_score / 10) * 0.3;
  const compositionScore = analysis.composition === 'rule_of_thirds' ? 0.2 : 0.1;
  const lightingScore = analysis.lighting === 'natural' ? 0.2 : 0.1;
  
  return Math.min(10, (emotionScore + qualityScore + compositionScore + lightingScore) * 10);
}

export function selectBestAssetsForTemplate(
  assets: Array<{ analysis: AssetAnalysis; id: string }>,
  template: ViralTemplate,
  targetCount: number = 8
): string[] {
  // Filter assets that match template requirements
  const matchingAssets = assets.filter(asset => {
    const analysis = asset.analysis;
    return (
      analysis.best_for_templates.includes(template.name) ||
      template.target_emotions.some(emotion => analysis.emotions.includes(emotion))
    );
  });

  // Sort by viral potential and quality
  matchingAssets.sort((a, b) => {
    const scoreA = a.analysis.viral_potential * 0.6 + a.analysis.quality_score * 0.4;
    const scoreB = b.analysis.viral_potential * 0.6 + b.analysis.quality_score * 0.4;
    return scoreB - scoreA;
  });

  // Return top assets within slide count range
  const slideCount = Math.min(
    targetCount,
    Math.max(template.slide_count_range.min, template.slide_count_range.max)
  );
  
  return matchingAssets.slice(0, slideCount).map(asset => asset.id);
}

export function validateEnvironmentVariables(): { [key: string]: string } {
  const required = [
    'OPENROUTER_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY',
    'CLOUDFLARE_R2_SECRET_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
  ];

  // In development, only warn about missing variables instead of throwing
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const message = `Missing environment variables: ${missing.join(', ')}`;
    
    if (isDevelopment) {
      console.warn(`⚠️ ${message}`);
      console.warn('Some API features may not work properly.');
    } else {
      throw new Error(message);
    }
  }

  return required.reduce((acc, key) => {
    acc[key] = process.env[key] || '';
    return acc;
  }, {} as { [key: string]: string });
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
}

export function isValidImageType(mimeType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  return validTypes.includes(mimeType.toLowerCase());
}

export function generateHashtags(analysis: AssetAnalysis, template: ViralTemplate): string[] {
  const baseHashtags = ['#fyp', '#viral', '#authentic'];
  const emotionHashtags = analysis.emotions.map(emotion => `#${emotion}`);
  const tagHashtags = analysis.tags.map(tag => `#${tag.replace(/\s+/g, '')}`);
  
  // Template-specific hashtags
  const templateHashtags = template.name === 'day_in_life' 
    ? ['#dayinmylife', '#routine', '#lifestyle']
    : template.name === 'hidden_gems'
    ? ['#hiddengems', '#travel', '#discover']
    : ['#transformation', '#beforeafter', '#glow'];

  return [...baseHashtags, ...emotionHashtags, ...tagHashtags, ...templateHashtags]
    .filter((hashtag, index, arr) => arr.indexOf(hashtag) === index)
    .slice(0, 15); // Limit to 15 hashtags
}