// Environment configuration validation
import { validateEnvironmentVariables } from '@famatic/shared';

export const config = (() => {
  try {
    return validateEnvironmentVariables();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
})();

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// API Configuration
export const API_CONFIG = {
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50'),
  BATCH_SIZE: parseInt(process.env.BATCH_ANALYSIS_SIZE || '5'),
  MAX_BATCH_SIZE: parseInt(process.env.MAX_BATCH_ANALYSIS_SIZE || '10'),
  ENABLE_AI_LOGGING: process.env.ENABLE_AI_LOGGING === 'true',
} as const;