import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { R2Image } from '../ui/R2Image';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { apiService } from '../../services/api';
import { realtimeService } from '../../services/realtime';
import { ErrorHandlers } from '../ui/ErrorAlert';

const { width: screenWidth } = Dimensions.get('window');
const tileSize = (screenWidth - 48) / 2 - 8; // 2 columns with margins
const tileHeight = tileSize * 1.4; // Slightly shorter than full TikTok ratio for better gallery view

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface Slideshow {
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
}

interface MySlideshowsScreenProps {
  onBack: () => void;
  onCreateNew: () => void;
  onEditSlideshow?: (slideshow: Slideshow) => void;
}

export function MySlideshowsScreen({ onBack, onCreateNew, onEditSlideshow }: MySlideshowsScreenProps) {
  const [slideshows, setSlideshows] = useState<Slideshow[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  // Setup rotation animation for processing indicators
  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);


  // Load slideshows and setup realtime
  useEffect(() => {
    loadSlideshows();
    setupRealtime();
    
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  const setupRealtime = async () => {
    try {
      await realtimeService.connect();
      setRealtimeConnected(true);

      // Subscribe to slideshow updates
      realtimeService.subscribeToSlideshowUpdates(
        MVP_USER_ID,
        (event) => {
          console.log('Slideshow update received:', event);
          
          if (event.type === 'INSERT' && event.new) {
            // New slideshow created
            setSlideshows(prev => [event.new!, ...prev]);
          } else if (event.type === 'UPDATE' && event.new) {
            // Slideshow updated (status change, completion, etc.)
            setSlideshows(prev => prev.map(slideshow => 
              slideshow.id === event.new!.id ? { ...slideshow, ...event.new! } : slideshow
            ));
          } else if (event.type === 'DELETE' && event.old) {
            // Slideshow deleted
            setSlideshows(prev => prev.filter(slideshow => slideshow.id !== event.old!.id));
          }
        },
        (error) => {
          console.error('Slideshow realtime error:', error);
          setRealtimeConnected(false);
        }
      );

      // Subscribe to slideshow creation progress
      realtimeService.subscribeToSlideshowProgress(
        MVP_USER_ID,
        (progress) => {
          console.log('Slideshow progress:', progress);
          setSlideshows(prev => prev.map(slideshow => 
            slideshow.id === progress.slideshowId ? {
              ...slideshow,
              creation_status: progress.status,
              creation_progress: progress.progress,
              error_message: progress.error
            } : slideshow
          ));
        },
        (error) => {
          console.error('Slideshow progress error:', error);
        }
      );

    } catch (error) {
      console.error('Failed to setup realtime:', error);
      setRealtimeConnected(false);
    }
  };

  const loadSlideshows = async () => {
    try {
      setLoading(true);
      
      // Load both slideshows and assets
      const [fetchedSlideshows, fetchedAssets] = await Promise.all([
        apiService.getSlideshows(MVP_USER_ID),
        apiService.getAssets(MVP_USER_ID)
      ]);
      
      setSlideshows(fetchedSlideshows);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error('Failed to load slideshows:', error);
      ErrorHandlers.networkError(error, loadSlideshows);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSlideshows();
    setRefreshing(false);
  };

  const handleDeleteSlideshow = async (slideshowId: string) => {
    Alert.alert(
      'Delete Slideshow',
      'Are you sure you want to delete this slideshow?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteSlideshow(slideshowId, MVP_USER_ID);
              setSlideshows(prev => prev.filter(s => s.id !== slideshowId));
            } catch (error) {
              console.error('Failed to delete slideshow:', error);
              Alert.alert('Delete Error', 'Failed to delete slideshow. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleRetrySlideshow = async (slideshowId: string) => {
    try {
      await apiService.retrySlideshow(slideshowId, MVP_USER_ID);
      // Status will be updated via realtime subscription
    } catch (error) {
      console.error('Failed to retry slideshow:', error);
      ErrorHandlers.slideshowGeneration(error);
    }
  };

  const handleEditSlideshow = async (slideshow: Slideshow) => {
    if (slideshow.creation_status === 'completed' && onEditSlideshow) {
      try {
        // Use cached assets to resolve asset IDs to R2 URLs
        // Create maps for both ID and filename lookups
        const assetIdMap = new Map(assets.map(asset => [asset.id, asset.r2_url]));
        const assetFilenameMap = new Map(assets.map(asset => [asset.original_filename, asset.r2_url]));
        
        // Convert to the format expected by PreviewScreen
        const formattedSlideshow = {
          id: slideshow.id,
          title: slideshow.title,
          template: slideshow.template_used,
          slides: slideshow.slides.map((slide, index) => {
            // Try to get R2 URL by ID first, then by filename
            const r2Url = assetIdMap.get(slide.asset_id) || assetFilenameMap.get(slide.asset_id) || '';
            console.log(`Slide ${index}: asset_id=${slide.asset_id}, r2Url=${r2Url}`);
            return {
              id: `slide-${index}`,
              imageUrl: r2Url, // Use actual R2 URL
              text: slide.text,
              textStyle: slide.style,
              textPosition: { x: 0.5, y: 0.25 }, // Default position
              textScale: 1,
              textRotation: 0,
            };
          }),
          viralHook: slideshow.viral_hook,
          caption: slideshow.generated_caption,
          hashtags: slideshow.hashtags,
          viralScore: slideshow.estimated_viral_score,
        };
        
        console.log('Formatted slideshow for preview:', formattedSlideshow);
        
        onEditSlideshow(formattedSlideshow);
      } catch (error) {
        console.error('Failed to resolve asset URLs:', error);
        ErrorHandlers.slideshowGeneration(error);
      }
    } else {
      console.log('Slideshow not ready for editing:', slideshow.id);
    }
  };

  const handleExportSlideshow = async (slideshow: Slideshow) => {
    if (slideshow.export_url) {
      // TODO: Download or share the exported video
      console.log('Export slideshow:', slideshow.export_url);
    } else {
      // TODO: Generate export if not available
      console.log('Generate export for slideshow:', slideshow.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'processing': return colors.warning;
      case 'pending': return colors.gray;
      case 'failed': return colors.error;
      default: return colors.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'processing': return 'Creating...';
      case 'pending': return 'Queued';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const getViralScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    return colors.error;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const renderSlideshowTile = (slideshow: Slideshow) => {
    const firstSlide = slideshow.slides?.[0];
    const isProcessing = slideshow.creation_status === 'processing';
    const isFailed = slideshow.creation_status === 'failed';
    const isCompleted = slideshow.creation_status === 'completed';

    // Find the corresponding asset for the first slide
    // Try to match by ID first, then by filename
    const firstAsset = firstSlide?.asset_id ? 
      assets.find(asset => asset.id === firstSlide.asset_id) || 
      assets.find(asset => asset.original_filename === firstSlide.asset_id) : null;

    return (
      <TouchableOpacity
        key={slideshow.id}
        style={{
          width: tileSize,
          height: tileHeight, // Better gallery view ratio
          marginBottom: spacing.md,
        }}
        activeOpacity={0.8}
        onPress={() => isCompleted ? handleEditSlideshow(slideshow) : null}
        disabled={!isCompleted}
      >
        <View style={{ position: 'relative', flex: 1 }}>
          {/* Background Image/Placeholder */}
          {firstAsset?.r2_url && isCompleted ? (
            // Render first slide as thumbnail
            <View style={{
              flex: 1,
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              backgroundColor: colors.glass,
            }}>
              <R2Image
                r2Url={firstAsset.r2_url}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
              
              {/* Text Overlay Preview */}
              {firstSlide.text && (
                <View style={{
                  position: 'absolute',
                  bottom: 40,
                  left: 12,
                  right: 12,
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    textShadowColor: 'rgba(0, 0, 0, 0.7)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }} numberOfLines={2}>
                    {firstSlide.text}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{
              flex: 1,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.glass,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {isProcessing ? (
                <Animated.View
                  style={{
                    transform: [{
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }}
                >
                  <Ionicons name="sync" size={32} color={colors.warning} />
                </Animated.View>
              ) : isFailed ? (
                <Ionicons name="alert-circle" size={32} color={colors.error} />
              ) : (
                <Ionicons name="film" size={32} color={colors.textSecondary} />
              )}
            </View>
          )}

          {/* Gradient Overlay for Status */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              borderRadius: borderRadius.lg,
              justifyContent: 'flex-end',
              padding: spacing.sm,
            }}
          >
            {/* Title */}
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 2,
            }} numberOfLines={1}>
              {slideshow.title}
            </Text>
            
            {/* Status & Details */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: getStatusColor(slideshow.creation_status),
                  marginRight: 4,
                }} />
                <Text style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 10,
                  fontWeight: '500',
                }}>
                  {getStatusText(slideshow.creation_status)}
                </Text>
              </View>
              
              {isCompleted && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{
                    color: getViralScoreColor(slideshow.estimated_viral_score),
                    fontSize: 10,
                    fontWeight: '600',
                  }}>
                    {slideshow.estimated_viral_score.toFixed(1)}
                  </Text>
                  <Ionicons name="flame" size={12} color={getViralScoreColor(slideshow.estimated_viral_score)} style={{ marginLeft: 2 }} />
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Progress Bar for Processing */}
          {isProcessing && (
            <View style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              height: 3,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <View style={{
                height: '100%',
                width: `${slideshow.creation_progress || 0}%`,
                backgroundColor: colors.primary,
                borderRadius: 2,
              }} />
            </View>
          )}

          {/* Action Menu Button */}
          <TouchableOpacity
            onPress={() => slideshow.creation_status === 'failed' ? handleRetrySlideshow(slideshow.id) : handleDeleteSlideshow(slideshow.id)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons 
              name={slideshow.creation_status === 'failed' ? 'refresh' : 'ellipsis-vertical'} 
              size={16} 
              color="white" 
            />
          </TouchableOpacity>

          {/* Completion Badge */}
          {isCompleted && (
            <View style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: colors.success,
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}>
              <Text style={{
                color: 'white',
                fontSize: 10,
                fontWeight: '600',
              }}>
                READY
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: spacing.md,
      }}>
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
          }}>
            My Slideshows
          </Text>
          {realtimeConnected && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.success,
                marginRight: 4,
              }} />
              <Text style={{ color: colors.success, fontSize: 10 }}>
                Live
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          onPress={onCreateNew}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Slideshows List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={{
            alignItems: 'center',
            marginTop: spacing.xl * 2,
            paddingHorizontal: spacing.lg,
          }}>
            {/* Main Loading Card */}
            <View
              style={{
                padding: spacing.xl * 1.5,
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: borderRadius.xl,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.25)',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
                minWidth: 280,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated Background Gradient */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: loadingOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                }}
              >
                <LinearGradient
                  colors={[
                    'rgba(147, 51, 234, 0.15)', // purple
                    'rgba(59, 130, 246, 0.15)', // blue
                    'rgba(16, 185, 129, 0.15)'  // green
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </Animated.View>

              {/* Animated Icon Container */}
              <Animated.View
                style={{
                  marginBottom: spacing.lg,
                  padding: spacing.lg,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  transform: [{
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  }],
                }}
              >
                <Ionicons name="film" size={56} color={colors.primary} />
              </Animated.View>
              
              {/* Loading Text */}
              <Text style={{
                color: colors.text,
                fontSize: 22,
                fontWeight: '700',
                marginBottom: spacing.sm,
                textAlign: 'center',
                letterSpacing: 0.5,
              }}>
                Loading Slideshows
              </Text>
              
              <Text style={{
                color: colors.textSecondary,
                fontSize: 15,
                textAlign: 'center',
                lineHeight: 22,
                opacity: 0.9,
                marginBottom: spacing.lg,
              }}>
                Discovering your viral content...
              </Text>
              
              {/* Animated Progress Dots */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                      opacity: spinValue.interpolate({
                        inputRange: [
                          (index * 0.33),
                          (index * 0.33) + 0.33,
                          1
                        ],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        scale: spinValue.interpolate({
                          inputRange: [
                            (index * 0.33),
                            (index * 0.33) + 0.33,
                            1
                          ],
                          outputRange: [0.8, 1.2, 0.8],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  />
                ))}
              </View>
              
              {/* Floating Particles */}
              <View style={{
                position: 'absolute',
                top: -20,
                left: -20,
                right: -20,
                bottom: -20,
                overflow: 'hidden',
                borderRadius: borderRadius.xl,
              }}>
                {[...Array(10)].map((_, index) => (
                  <Animated.View
                    key={index}
                    style={{
                      position: 'absolute',
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.primary,
                      opacity: 0.4,
                      top: `${10 + (index * 8)}%`,
                      left: `${5 + (index * 9)}%`,
                      transform: [{
                        translateY: spinValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -25],
                        }),
                      }, {
                        scale: spinValue.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.3, 1, 0.3],
                        }),
                      }],
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Secondary Loading Indicators */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.xl,
              gap: spacing.lg,
            }}>
              {['📱', '🎬', '✨'].map((emoji, index) => (
                <Animated.View
                  key={index}
                  style={{
                    padding: spacing.md,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    transform: [{
                      scale: spinValue.interpolate({
                        inputRange: [
                          (index * 0.25),
                          (index * 0.25) + 0.5,
                          1
                        ],
                        outputRange: [0.9, 1.1, 0.9],
                        extrapolate: 'clamp',
                      }),
                    }],
                    opacity: spinValue.interpolate({
                      inputRange: [
                        (index * 0.25),
                        (index * 0.25) + 0.5,
                        1
                      ],
                      outputRange: [0.5, 1, 0.5],
                      extrapolate: 'clamp',
                    }),
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : slideshows.length === 0 ? (
          <GlassCard style={{
            padding: spacing.xl,
            alignItems: 'center',
            marginTop: spacing.xl,
          }}>
            <Ionicons 
              name="film-outline" 
              size={64} 
              color={colors.textSecondary} 
              style={{ marginBottom: spacing.md }}
            />
            <Text style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: spacing.sm,
            }}>
              No Slideshows Yet
            </Text>
            <Text style={{
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: spacing.lg,
            }}>
              Create your first viral slideshow from your photo library
            </Text>
            <MagicButton
              title="Create Slideshow"
              onPress={onCreateNew}
              style={{ width: 160 }}
            />
          </GlassCard>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {slideshows.map(renderSlideshowTile)}
          </View>
        )}
      </ScrollView>

    </View>
  );
}