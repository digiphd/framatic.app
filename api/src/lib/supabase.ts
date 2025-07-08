import { createClient } from '@supabase/supabase-js';
import { AssetLibraryItem } from '../../../shared/src/types/ai-analysis';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for server-side operations

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Create a new asset library item
 */
export async function createAssetLibraryItem(
  userId: string,
  r2Url: string,
  originalFilename: string,
  fileSize: number,
  fileType: 'image' | 'video',
  uploadMethod: 'single' | 'bulk' | 'camera'
): Promise<AssetLibraryItem> {
  const { data, error } = await supabase
    .from('asset_library')
    .insert({
      user_id: userId,
      r2_url: r2Url,
      original_filename: originalFilename,
      file_size: fileSize,
      file_type: fileType,
      upload_method: uploadMethod,
      analysis_status: 'pending',
      times_used: 0,
      viral_success_rate: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset library item:', error);
    throw new Error('Failed to create asset library item');
  }

  return data;
}

/**
 * Update analysis status and data
 */
export async function updateAssetAnalysis(
  assetId: string,
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed',
  aiAnalysis?: any,
  viralPotentialScore?: number,
  qualityScore?: number
): Promise<void> {
  const updateData: any = {
    analysis_status: analysisStatus,
    updated_at: new Date().toISOString(),
  };

  if (aiAnalysis) {
    updateData.ai_analysis = aiAnalysis;
  }

  if (viralPotentialScore !== undefined) {
    updateData.viral_potential_score = viralPotentialScore;
  }

  if (qualityScore !== undefined) {
    updateData.quality_score = qualityScore;
  }

  const { error } = await supabase
    .from('asset_library')
    .update(updateData)
    .eq('id', assetId);

  if (error) {
    console.error('Error updating asset analysis:', error);
    throw new Error('Failed to update asset analysis');
  }
}

/**
 * Get pending analysis items
 */
export async function getPendingAnalysisItems(limit: number = 10): Promise<AssetLibraryItem[]> {
  const { data, error } = await supabase
    .from('asset_library')
    .select('*')
    .eq('analysis_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error getting pending analysis items:', error);
    throw new Error('Failed to get pending analysis items');
  }

  return data || [];
}

/**
 * Get user's asset library
 */
export async function getUserAssetLibrary(
  userId: string,
  filters?: {
    analysisStatus?: string;
    fileType?: string;
    searchTags?: string[];
    minViralScore?: number;
    minQualityScore?: number;
  }
): Promise<AssetLibraryItem[]> {
  let query = supabase
    .from('asset_library')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.analysisStatus) {
    query = query.eq('analysis_status', filters.analysisStatus);
  }

  if (filters?.fileType) {
    query = query.eq('file_type', filters.fileType);
  }

  if (filters?.minViralScore !== undefined) {
    query = query.gte('viral_potential_score', filters.minViralScore);
  }

  if (filters?.minQualityScore !== undefined) {
    query = query.gte('quality_score', filters.minQualityScore);
  }

  // For tag-based filtering, we'll need to use the JSONB operators
  if (filters?.searchTags && filters.searchTags.length > 0) {
    // This uses PostgreSQL's JSONB operators to search for tags
    const tagQuery = filters.searchTags.map(tag => 
      `ai_analysis->>'tags' @> '["${tag}"]'`
    ).join(' OR ');
    
    query = query.or(tagQuery);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting user asset library:', error);
    throw new Error('Failed to get user asset library');
  }

  return data || [];
}