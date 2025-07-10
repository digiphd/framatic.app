import * as FileSystem from 'expo-file-system';

// Use your local network IP instead of localhost for mobile testing
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.4.115:3001/api';

export interface Asset {
  id: string;
  r2_url: string;
  file_type: 'image' | 'video';
  original_filename: string | null;
  file_size: number | null;
  ai_analysis: any | null;
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  viral_potential_score: number | null;
  quality_score: number | null;
  times_used: number;
  viral_success_rate: number;
  upload_method: 'single' | 'bulk' | 'camera';
  created_at: string;
}

export interface UploadResponse {
  success: boolean;
  asset?: Asset;
  processing?: {
    original_size: number;
    processed_size: number;
    compression_ratio: number;
    dimensions: {
      width: number;
      height: number;
    };
  };
  error?: string;
  message?: string;
}

export interface BulkUploadResponse {
  success: boolean;
  uploaded: number;
  total: number;
  failed: number;
  assets: Asset[];
  errors: Array<{
    index: number;
    filename: string;
    error: string;
  }>;
  processing?: {
    total_original_size: number;
    total_processed_size: number;
    average_compression: number;
  };
  message: string;
}

export class ApiService {
  private static instance: ApiService;
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private constructor() {}

  async uploadSingleImage(imageUri: string, userId?: string): Promise<UploadResponse> {
    try {
      const filename = imageUri.split('/').pop() || 'image.jpg';
      
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await fetch(`${API_BASE_URL}/assets/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Single upload error:', error);
      throw error;
    }
  }

  async uploadBulkImages(
    imageUris: string[], 
    userId?: string,
    onProgress?: (progress: { completed: number; total: number }) => void
  ): Promise<BulkUploadResponse> {
    try {
      const formData = new FormData();
      
      // Add all files to form data
      for (let i = 0; i < imageUris.length; i++) {
        const imageUri = imageUris[i];
        const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
        
        formData.append('files', {
          uri: imageUri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }
      
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await fetch(`${API_BASE_URL}/assets/bulk-upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      
      if (!response.ok && response.status !== 207) { // 207 = Multi-Status (partial success)
        throw new Error(data.error || 'Bulk upload failed');
      }

      return data;
    } catch (error) {
      console.error('Bulk upload error:', error);
      throw error;
    }
  }

  async getAssets(userId?: string): Promise<Asset[]> {
    try {
      const url = new URL(`${API_BASE_URL}/assets/library`);
      if (userId) {
        url.searchParams.append('userId', userId);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      const data = await response.json();
      return data.assets || [];
    } catch (error) {
      console.error('Get assets error:', error);
      throw error;
    }
  }

  async getAssetAnalysisStatus(userId?: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/assets/status`);
      if (userId) {
        url.searchParams.append('userId', userId);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis status');
      }

      const data = await response.json();
      return data.status || { pending: 0, processing: 0, completed: 0, failed: 0 };
    } catch (error) {
      console.error('Get analysis status error:', error);
      throw error;
    }
  }

  async searchAssets(
    query: string,
    filters?: {
      emotions?: string[];
      contentType?: string;
      minViralScore?: number;
      maxViralScore?: number;
      analysisStatus?: string;
    },
    userId?: string
  ): Promise<Asset[]> {
    try {
      const url = new URL(`${API_BASE_URL}/assets/search`);
      url.searchParams.append('q', query);
      
      if (userId) {
        url.searchParams.append('userId', userId);
      }
      
      if (filters) {
        if (filters.emotions && filters.emotions.length > 0) {
          url.searchParams.append('emotions', filters.emotions.join(','));
        }
        if (filters.contentType) {
          url.searchParams.append('contentType', filters.contentType);
        }
        if (filters.minViralScore !== undefined) {
          url.searchParams.append('minViralScore', filters.minViralScore.toString());
        }
        if (filters.maxViralScore !== undefined) {
          url.searchParams.append('maxViralScore', filters.maxViralScore.toString());
        }
        if (filters.analysisStatus) {
          url.searchParams.append('analysisStatus', filters.analysisStatus);
        }
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to search assets');
      }

      const data = await response.json();
      return data.assets || [];
    } catch (error) {
      console.error('Search assets error:', error);
      throw error;
    }
  }

  async getPresignedUrl(r2Url: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ r2Url })
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const data = await response.json();
      return data.presignedUrl;
    } catch (error) {
      console.error('Presigned URL error:', error);
      throw error;
    }
  }

  async deleteAsset(assetId: string, userId?: string): Promise<{
    success: boolean;
    message: string;
    assetId: string;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/assets/delete`);
      url.searchParams.append('id', assetId);
      if (userId) {
        url.searchParams.append('userId', userId);
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete asset error:', error);
      throw error;
    }
  }

  async deleteAssets(assetIds: string[], userId?: string): Promise<{
    success: boolean;
    deleted: number;
    total: number;
    failed: number;
    deletedAssets: string[];
    errors: Array<{ assetId: string; error: string }>;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assetIds, userId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete assets');
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  }

  async checkStorageHealth(): Promise<{
    status: string;
    storage: {
      r2: {
        connected: boolean;
        error?: string;
      };
    };
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health/storage`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  async getUserContext(userId: string): Promise<{
    success: boolean;
    context: any | null;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user-context?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user context');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user context error:', error);
      throw error;
    }
  }

  async saveUserContext(userId: string, context: any): Promise<{
    success: boolean;
    context?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user-context?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context)
      });

      if (!response.ok) {
        throw new Error('Failed to save user context');
      }

      return await response.json();
    } catch (error) {
      console.error('Save user context error:', error);
      throw error;
    }
  }

  async updateUserContext(userId: string, updates: any): Promise<{
    success: boolean;
    context?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user-context?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update user context');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user context error:', error);
      throw error;
    }
  }

  // Slideshow methods
  async createAsyncSlideshow(
    selectedAssetIds: string[],
    userId: string,
    options?: {
      userPrompt?: string;
      templatePreference?: string;
      maxSlides?: number;
    }
  ): Promise<{
    success: boolean;
    slideshow_id: string;
    message: string;
    estimated_completion_time: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/create-async?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_asset_ids: selectedAssetIds,
          user_prompt: options?.userPrompt,
          template_preference: options?.templatePreference,
          max_slides: options?.maxSlides
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create slideshow');
      }

      return await response.json();
    } catch (error) {
      console.error('Create async slideshow error:', error);
      throw error;
    }
  }

  async getSlideshows(userId: string): Promise<Array<{
    id: string;
    title: string;
    template_used: string;
    generation_prompt: string;
    slides: Array<{
      asset_id: string;
      text: string;
      position: number;
      style: any;
    }>;
    viral_hook: string;
    generated_caption: string;
    hashtags: string[];
    estimated_viral_score: number;
    creation_status: 'pending' | 'processing' | 'completed' | 'failed';
    creation_progress: number;
    creation_time_seconds?: number;
    is_bulk_generated: boolean;
    created_at: string;
    export_url?: string;
    error_message?: string;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/list?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch slideshows');
      }

      const data = await response.json();
      return data.slideshows || [];
    } catch (error) {
      console.error('Get slideshows error:', error);
      throw error;
    }
  }

  async deleteSlideshow(slideshowId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/delete?userId=${userId}&slideshowId=${slideshowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete slideshow');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete slideshow error:', error);
      throw error;
    }
  }

  async retrySlideshow(slideshowId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    slideshow_id: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/retry?userId=${userId}&slideshowId=${slideshowId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to retry slideshow');
      }

      return await response.json();
    } catch (error) {
      console.error('Retry slideshow error:', error);
      throw error;
    }
  }

  async renderSlideshow(slideshow: any): Promise<{
    success: boolean;
    renderedUrls?: string[];
    count?: number;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: slideshow.slides,
          userId: '00000000-0000-0000-0000-000000000001', // Default user ID for now
          slideshowId: slideshow.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to render slideshow on server');
      }

      return await response.json();
    } catch (error) {
      console.error('Render slideshow error:', error);
      throw error;
    }
  }

  async renderSlideshowWithSkia(slideshow: any): Promise<{
    success: boolean;
    renderedUrls?: string[];
    count?: number;
    message?: string;
    error?: string;
    renderingEngine?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/slideshow/render-skia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: slideshow.slides,
          userId: '00000000-0000-0000-0000-000000000001', // Default user ID for now
          slideshowId: slideshow.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to render slideshow with Skia on server');
      }

      return await response.json();
    } catch (error) {
      console.error('Render slideshow with Skia error:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance();