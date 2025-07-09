import { createClient } from '@supabase/supabase-js';
import { Asset } from './api';

// Supabase client for realtime subscriptions
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ccyeagnkodnmsoihlsun.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeWVhZ25rb2RubXNvaWhsc3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NzIxMzksImV4cCI6MjA2NzU0ODEzOX0.8fAKiGrXnE-bYgZfKlPR8jgIEqCzQQcKkYJU8RiHZyQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface AssetUpdateEvent {
  type: 'UPDATE' | 'INSERT' | 'DELETE';
  table: 'asset_library';
  schema: 'public';
  new?: Asset;
  old?: Asset;
}

export interface AnalysisProgressEvent {
  userId: string;
  assetId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis?: any;
  viral_potential_score?: number;
  quality_score?: number;
}

export interface SlideshowUpdateEvent {
  type: 'UPDATE' | 'INSERT' | 'DELETE';
  table: 'slideshows';
  schema: 'public';
  new?: any;
  old?: any;
}

export interface SlideshowProgressEvent {
  userId: string;
  slideshowId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, any> = new Map();
  private connected = false;

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  private constructor() {}

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Test connection
      const { data, error } = await supabase.from('asset_library').select('count').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
        throw error;
      }
      
      this.connected = true;
      console.log('Supabase realtime connected successfully');
    } catch (error) {
      console.error('Failed to connect to Supabase realtime:', error);
      throw error;
    }
  }

  subscribeToAssetUpdates(
    userId: string,
    onUpdate: (event: AssetUpdateEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionKey = `asset_updates_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`asset_library_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_library',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Asset update received:', payload);
          onUpdate({
            type: payload.eventType as 'UPDATE' | 'INSERT' | 'DELETE',
            table: 'asset_library',
            schema: 'public',
            new: payload.new as Asset,
            old: payload.old as Asset,
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to asset updates for user ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('Failed to subscribe to asset updates');
          console.error('Subscription error:', error);
          onError?.(error);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionKey);
  }

  subscribeToAnalysisProgress(
    userId: string,
    onProgress: (event: AnalysisProgressEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionKey = `analysis_progress_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`analysis_progress_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asset_library',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as Asset;
          const oldRecord = payload.old as Asset;
          
          // Only emit progress events for analysis status changes
          if (newRecord.analysis_status !== oldRecord?.analysis_status) {
            console.log('Analysis progress update:', {
              assetId: newRecord.id,
              status: newRecord.analysis_status,
              viralScore: newRecord.viral_potential_score,
            });
            
            onProgress({
              userId,
              assetId: newRecord.id,
              status: newRecord.analysis_status,
              analysis: newRecord.ai_analysis,
              viral_potential_score: newRecord.viral_potential_score,
              quality_score: newRecord.quality_score,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Analysis progress subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to analysis progress for user ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('Failed to subscribe to analysis progress');
          console.error('Analysis progress subscription error:', error);
          onError?.(error);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionKey);
  }

  subscribeToLibraryStats(
    userId: string,
    onStatsUpdate: (stats: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    }) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionKey = `library_stats_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`library_stats_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asset_library',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          try {
            // Fetch updated stats
            const { data: assets, error } = await supabase
              .from('asset_library')
              .select('analysis_status')
              .eq('user_id', userId);

            if (error) throw error;

            const stats = {
              total: assets.length,
              pending: assets.filter(a => a.analysis_status === 'pending').length,
              processing: assets.filter(a => a.analysis_status === 'processing').length,
              completed: assets.filter(a => a.analysis_status === 'completed').length,
              failed: assets.filter(a => a.analysis_status === 'failed').length,
            };

            onStatsUpdate(stats);
          } catch (error) {
            console.error('Failed to fetch library stats:', error);
            onError?.(error as Error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Library stats subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to library stats for user ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('Failed to subscribe to library stats');
          console.error('Library stats subscription error:', error);
          onError?.(error);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionKey);
  }

  subscribeToSlideshowUpdates(
    userId: string,
    onUpdate: (event: SlideshowUpdateEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionKey = `slideshow_updates_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`slideshows_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slideshows',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Slideshow update received:', payload);
          onUpdate({
            type: payload.eventType as 'UPDATE' | 'INSERT' | 'DELETE',
            table: 'slideshows',
            schema: 'public',
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe((status) => {
        console.log('Slideshow subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to slideshow updates for user ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('Failed to subscribe to slideshow updates');
          console.error('Slideshow subscription error:', error);
          onError?.(error);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionKey);
  }

  subscribeToSlideshowProgress(
    userId: string,
    onProgress: (event: SlideshowProgressEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriptionKey = `slideshow_progress_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);

    const subscription = supabase
      .channel(`slideshow_progress_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slideshows',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new;
          const oldRecord = payload.old;
          
          // Only emit progress events for status or progress changes
          if (newRecord.creation_status !== oldRecord?.creation_status || 
              newRecord.creation_progress !== oldRecord?.creation_progress) {
            console.log('Slideshow progress update:', {
              slideshowId: newRecord.id,
              status: newRecord.creation_status,
              progress: newRecord.creation_progress,
            });
            
            onProgress({
              userId,
              slideshowId: newRecord.id,
              status: newRecord.creation_status,
              progress: newRecord.creation_progress,
              error: newRecord.error_message,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Slideshow progress subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to slideshow progress for user ${userId}`);
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('Failed to subscribe to slideshow progress');
          console.error('Slideshow progress subscription error:', error);
          onError?.(error);
        }
      });

    this.subscriptions.set(subscriptionKey, subscription);

    // Return unsubscribe function
    return () => this.unsubscribe(subscriptionKey);
  }

  unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      console.log(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  unsubscribeAll(): void {
    for (const [key, subscription] of this.subscriptions) {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${key}`);
    }
    this.subscriptions.clear();
  }

  disconnect(): void {
    this.unsubscribeAll();
    this.connected = false;
    console.log('Supabase realtime disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const realtimeService = RealtimeService.getInstance();