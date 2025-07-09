import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { SearchFilterBar } from '../ui/SearchFilterBar';
import { R2Image } from '../ui/R2Image';
import { FullScreenImageModal } from '../ui/FullScreenImageModal';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { apiService, Asset } from '../../services/api';
import { realtimeService } from '../../services/realtime';
import { debugApi } from '../../services/debug-api';
import { ErrorHandlers } from '../ui/ErrorAlert';
import { showSuccessToast, showErrorToast, showInfoToast } from '../ui/ToastNotification';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48) / 3 - 8; // 3 columns with margins

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface AssetLibraryScreenProps {
  onBack: () => void;
  onNavigateToSlideshows?: () => void;
}

export function AssetLibraryScreen({ onBack, onNavigateToSlideshows }: AssetLibraryScreenProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [fullScreenAsset, setFullScreenAsset] = useState<Asset | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Setup rotation animation
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

  // Load assets on component mount and setup realtime
  useEffect(() => {
    let cleanupPolling: (() => void) | undefined;
    
    const initializeRealtime = async () => {
      cleanupPolling = await setupRealtime();
    };
    
    loadAssets();
    initializeRealtime();
    
    // Cleanup on unmount
    return () => {
      realtimeService.disconnect();
      if (cleanupPolling && typeof cleanupPolling === 'function') {
        cleanupPolling();
      }
    };
  }, []);

  const setupRealtime = async (): Promise<(() => void) | undefined> => {
    try {
      await realtimeService.connect();
      setRealtimeConnected(true);

      // Subscribe to asset updates with error handling
      try {
        realtimeService.subscribeToAssetUpdates(
          MVP_USER_ID,
          (event) => {
            console.log('Asset update received:', event);
            
            if (event.type === 'INSERT' && event.new) {
              // New asset added
              setAssets(prev => [event.new!, ...prev]);
              setFilteredAssets(prev => [event.new!, ...prev]);
            } else if (event.type === 'UPDATE' && event.new) {
              // Asset updated (analysis completed, status changed)
              console.log('Updating asset in state:', event.new.id, event.new.analysis_status);
              setAssets(prev => prev.map(asset => 
                asset.id === event.new!.id ? { ...asset, ...event.new! } : asset
              ));
              setFilteredAssets(prev => prev.map(asset => 
                asset.id === event.new!.id ? { ...asset, ...event.new! } : asset
              ));
            } else if (event.type === 'DELETE' && event.old) {
              // Asset deleted
              setAssets(prev => prev.filter(asset => asset.id !== event.old!.id));
              setFilteredAssets(prev => prev.filter(asset => asset.id !== event.old!.id));
            }
          },
          (error) => {
            console.error('Realtime error:', error);
            setRealtimeConnected(false);
            // Continue without realtime if it fails
          }
        );
      } catch (error) {
        console.error('Failed to setup asset updates subscription:', error);
      }

      // Subscribe to analysis progress
      realtimeService.subscribeToAnalysisProgress(
        MVP_USER_ID,
        (progress) => {
          console.log('Analysis progress:', progress);
          // Update asset status in real-time
          setAssets(prev => prev.map(asset => 
            asset.id === progress.assetId ? {
              ...asset,
              analysis_status: progress.status,
              ai_analysis: progress.analysis || asset.ai_analysis,
              viral_potential_score: progress.viral_potential_score ?? asset.viral_potential_score,
              quality_score: progress.quality_score ?? asset.quality_score,
            } : asset
          ));
        },
        (error) => {
          console.error('Analysis progress error:', error);
        }
      );

    } catch (error) {
      console.error('Failed to setup realtime:', error);
      setRealtimeConnected(false);
      
      // Set up polling fallback for analysis status updates
      return startPollingForUpdates();
    }
    
    return undefined;
  };

  const startPollingForUpdates = () => {
    const pollInterval = setInterval(async () => {
      try {
        // Check if there are any assets being processed
        const processingAssets = assets.filter(asset => 
          asset.analysis_status === 'processing' || asset.analysis_status === 'pending'
        );
        
        if (processingAssets.length > 0) {
          console.log('Polling for updates on', processingAssets.length, 'processing assets');
          const updatedAssets = await apiService.getAssets(MVP_USER_ID);
          
          // Update only the assets that have changed status
          setAssets(prev => prev.map(asset => {
            const updated = updatedAssets.find(u => u.id === asset.id);
            if (updated && updated.analysis_status !== asset.analysis_status) {
              console.log(`Asset ${asset.id} status changed: ${asset.analysis_status} → ${updated.analysis_status}`);
              return updated;
            }
            return asset;
          }));
          
          setFilteredAssets(prev => prev.map(asset => {
            const updated = updatedAssets.find(u => u.id === asset.id);
            if (updated && updated.analysis_status !== asset.analysis_status) {
              return updated;
            }
            return asset;
          }));
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Clean up interval on unmount
    return () => clearInterval(pollInterval);
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // First test the API connection
      const connectionTest = await debugApi.testConnection();
      console.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        throw new Error(`API connection failed: ${connectionTest.message}`);
      }
      
      const fetchedAssets = await apiService.getAssets(MVP_USER_ID);
      console.log('Fetched assets:', fetchedAssets);
      console.log('Number of assets:', fetchedAssets.length);
      
      if (fetchedAssets.length > 0) {
        console.log('First asset sample:', {
          id: fetchedAssets[0].id,
          filename: fetchedAssets[0].original_filename,
          r2_url: fetchedAssets[0].r2_url,
          analysis_status: fetchedAssets[0].analysis_status,
        });
      }
      
      setAssets(fetchedAssets);
      setFilteredAssets(fetchedAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
      Alert.alert(
        'Connection Error', 
        `Failed to connect to API: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure the API server is running on your local machine.`,
        [
          { text: 'Retry', onPress: loadAssets },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, filters: any) => {
    try {
      setIsSearching(true);
      
      let results = [...assets];
      
      // Apply search query if provided
      if (query.trim()) {
        const searchResults = await apiService.searchAssets(query, filters, MVP_USER_ID);
        results = searchResults;
      }
      
      // Apply sorting
      if (filters.sortBy === 'viral_score') {
        results.sort((a, b) => {
          const scoreA = a.viral_potential_score || 0;
          const scoreB = b.viral_potential_score || 0;
          return filters.sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
        });
      } else {
        // Default sort by created_at
        results.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
      }
      
      setFilteredAssets(results);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', 'Failed to search assets');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setFilteredAssets(assets);
    setIsSearching(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedAssets(new Set());
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleAssetPress = (asset: Asset) => {
    if (isSelectionMode) {
      toggleAssetSelection(asset.id);
    } else {
      setFullScreenAsset(asset);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.size === 0) return;
    
    Alert.alert(
      'Delete Images',
      `Are you sure you want to delete ${selectedAssets.size} selected image${selectedAssets.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const assetIds = Array.from(selectedAssets);
              console.log('Deleting assets:', assetIds);
              
              const result = await apiService.deleteAssets(assetIds, MVP_USER_ID);
              
              if (result.success) {
                console.log(`Successfully deleted ${result.deleted}/${result.total} assets`);
                
                // Remove deleted assets from local state
                setAssets(prev => prev.filter(asset => !result.deletedAssets.includes(asset.id)));
                setFilteredAssets(prev => prev.filter(asset => !result.deletedAssets.includes(asset.id)));
                
                if (result.errors.length > 0) {
                  Alert.alert(
                    'Partial Success',
                    `Deleted ${result.deleted} images. ${result.failed} failed to delete.`
                  );
                }
              }
            } catch (error) {
              console.error('Bulk delete failed:', error);
              Alert.alert('Delete Error', 'Failed to delete images. Please try again.');
            } finally {
              setSelectedAssets(new Set());
              setIsSelectionMode(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateSlideshow = async () => {
    if (selectedAssets.size === 0) return;
    
    const selectedAssetIds = Array.from(selectedAssets);
    console.log('Creating async slideshow with assets:', selectedAssetIds);
    
    try {
      // Create slideshow asynchronously
      const result = await apiService.createAsyncSlideshow(
        selectedAssetIds,
        MVP_USER_ID,
        {
          userPrompt: 'Create an engaging slideshow that matches my style and goals',
        }
      );
      
      if (result.success) {
        // Show success toast
        showSuccessToast(
          'Slideshow creation started! 🎬',
          onNavigateToSlideshows ? {
            text: 'View',
            onPress: onNavigateToSlideshows
          } : undefined
        );
        
        // Clear selection
        setSelectedAssets(new Set());
        setIsSelectionMode(false);
        
        console.log('Slideshow creation initiated:', result.slideshow_id);
        console.log('Estimated completion time:', result.estimated_completion_time, 'seconds');
        
        // Optional: Navigate to slideshows screen automatically
        if (onNavigateToSlideshows) {
          setTimeout(() => {
            onNavigateToSlideshows();
          }, 1000); // Small delay to show toast
        }
      } else {
        showErrorToast('Failed to start slideshow creation', {
          text: 'Retry',
          onPress: handleCreateSlideshow
        });
      }
    } catch (error) {
      console.error('Slideshow creation error:', error);
      showErrorToast('Something went wrong while creating slideshow', {
        text: 'Retry',
        onPress: handleCreateSlideshow
      });
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      console.log('Deleting asset:', assetId);
      
      const result = await apiService.deleteAsset(assetId, MVP_USER_ID);
      
      if (result.success) {
        console.log('Successfully deleted asset:', assetId);
        
        // Remove from local state
        setAssets(prev => prev.filter(asset => asset.id !== assetId));
        setFilteredAssets(prev => prev.filter(asset => asset.id !== assetId));
      }
    } catch (error) {
      console.error('Failed to delete asset:', error);
      Alert.alert('Delete Error', 'Failed to delete image. Please try again.');
    }
  };

  const pickImages = async () => {
    try {
      console.log('Starting image picker...');
      
      // Request permission
      console.log('Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission result:', permissionResult);
      
      if (!permissionResult.granted) {
        console.log('Permission denied');
        Alert.alert(
          'Permission Required', 
          'This app needs access to your photo library to upload images. Please grant permission in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this will open the app settings
              console.log('User requested to open settings');
            }}
          ]
        );
        return;
      }

      console.log('Permission granted, launching image picker...');
      
      // Try multiple image selection first, fallback to single if it fails
      let result;
      try {
        console.log('Attempting multi-image selection...');
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsMultipleSelection: true,
          quality: 0.8, // Compress to 80% quality
          allowsEditing: false,
          selectionLimit: 10, // Bulk processing limit
        });
      } catch (multiError) {
        console.log('Multi-selection failed, trying single image:', multiError);
        
        // Fallback to single image selection
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsMultipleSelection: false,
          quality: 0.8,
          allowsEditing: false,
        });
      }
      
      console.log('Image picker result:', result);

      if (!result.canceled && result.assets) {
        setUploading(true);
        setUploadProgress({ completed: 0, total: result.assets.length });
        
        try {
          // Upload all images using bulk upload
          const imageUris = result.assets.map(asset => asset.uri);
          const uploadResult = await apiService.uploadBulkImages(
            imageUris,
            MVP_USER_ID,
            (progress) => setUploadProgress(progress)
          );
          
          if (uploadResult.success) {
            console.log(`Upload successful: ${uploadResult.uploaded}/${uploadResult.total} images processed`);
            
            // Show brief success message in console instead of dialog
            if (uploadResult.processing) {
              const totalOriginal = uploadResult.assets.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
              const totalProcessed = uploadResult.assets.reduce((sum, asset) => sum + (asset.file_size || 0), 0);
              console.log(`Processing complete: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalProcessed / 1024 / 1024).toFixed(1)}MB`);
            }
            
            // Assets will appear automatically via realtime updates
            // No need to reload as realtime will handle the updates
          } else {
            Alert.alert('Upload Failed', uploadResult.message);
          }
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Upload Error', 'Failed to upload images. Please try again.');
        } finally {
          setUploading(false);
          setUploadProgress(null);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      
      let errorMessage = 'Failed to pick images';
      let errorTitle = 'Image Picker Error';
      
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
        
        // Provide more specific error messages
        if (error.message.includes('Permission')) {
          errorTitle = 'Permission Error';
          errorMessage = 'Photo library access was denied. Please enable it in device Settings.';
        } else if (error.message.includes('cancelled') || error.message.includes('canceled')) {
          // User cancelled, don't show error
          console.log('User cancelled image picker');
          return;
        } else if (error.message.includes('not available')) {
          errorTitle = 'Feature Not Available';
          errorMessage = 'Image picker is not available on this device.';
        } else {
          errorMessage = `Image picker failed: ${error.message}`;
        }
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: pickImages }
        ]
      );
      
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    return colors.error;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'processing': return colors.warning;
      case 'pending': return colors.gray;
      default: return colors.error;
    }
  };

  const renderAsset = (asset: Asset) => (
    <TouchableOpacity 
      key={asset.id}
      style={{
        width: imageSize,
        marginBottom: spacing.sm,
      }}
      activeOpacity={0.8}
      onPress={() => handleAssetPress(asset)}
      onLongPress={() => {
        if (!isSelectionMode) {
          setIsSelectionMode(true);
          toggleAssetSelection(asset.id);
        }
      }}
    >
      <View style={{ position: 'relative' }}>
        <R2Image
          r2Url={asset.r2_url}
          style={{
            width: imageSize,
            height: imageSize * 1.5,
            borderRadius: borderRadius.md,
            backgroundColor: colors.glass,
          }}
          resizeMode="cover"
          onError={(error) => {
            console.error(`Failed to load image for asset ${asset.id}:`, error);
            console.log('Asset R2 URL:', asset.r2_url);
          }}
          onLoad={() => {
            console.log(`Successfully loaded image for asset ${asset.id}`);
          }}
        />
        
        {/* Selection Indicator */}
        {isSelectionMode && (
          <View
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: selectedAssets.has(asset.id) ? colors.primary : 'rgba(0, 0, 0, 0.5)',
              borderWidth: 2,
              borderColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedAssets.has(asset.id) && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
        )}

        {/* Status Indicator */}
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: getStatusColor(asset.analysis_status),
          }}
        />
        
        {/* Viral Score */}
        {asset.analysis_status === 'completed' && asset.viral_potential_score !== null && (
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              left: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: getScoreColor(asset.viral_potential_score),
                fontSize: 10,
                fontWeight: '600',
              }}
            >
              {asset.viral_potential_score.toFixed(1)}
            </Text>
          </View>
        )}
        
        {/* Processing Indicator */}
        {asset.analysis_status === 'processing' && (
          <View
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
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
              <Ionicons name="sync" size={12} color={colors.warning} />
            </Animated.View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: 60,
          paddingBottom: spacing.md,
        }}
      >
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: colors.text,
            }}
          >
            Photo Library
          </Text>
          {realtimeConnected && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.success,
                  marginRight: 4,
                }}
              />
              <Text style={{ color: colors.success, fontSize: 10 }}>
                Live
              </Text>
            </View>
          )}
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {!isSelectionMode && onNavigateToSlideshows && (
            <TouchableOpacity
              onPress={onNavigateToSlideshows}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.glass,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="film-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          
          {!isSelectionMode && (
            <TouchableOpacity
              onPress={toggleSelectionMode}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.glass,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={pickImages}
            disabled={uploading}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: uploading ? 0.8 : 1,
            }}
          >
            {uploading ? (
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
                <Ionicons name="sync" size={20} color="white" />
              </Animated.View>
            ) : (
              <Ionicons name="add" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>


      {/* Search and Filter */}
      <SearchFilterBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />

      {/* Selection Mode Actions */}
      {isSelectionMode && (
        <View style={{ 
          paddingHorizontal: spacing.lg, 
          marginBottom: spacing.lg,
          flexDirection: 'row',
          gap: spacing.md,
        }}>
          <TouchableOpacity
            onPress={toggleSelectionMode}
            style={{
              flex: 1,
              backgroundColor: colors.glass,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '600' }}>
              Cancel
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleBulkDelete}
            disabled={selectedAssets.size === 0}
            style={{
              flex: 1,
              backgroundColor: selectedAssets.size > 0 ? colors.error : colors.glass,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              opacity: selectedAssets.size === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ 
              color: selectedAssets.size > 0 ? 'white' : colors.textSecondary, 
              fontWeight: '600' 
            }}>
              Delete ({selectedAssets.size})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleCreateSlideshow}
            disabled={selectedAssets.size === 0}
            style={{
              flex: 1,
              backgroundColor: selectedAssets.size > 0 ? colors.primary : colors.glass,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              opacity: selectedAssets.size === 0 ? 0.5 : 1,
            }}
          >
            <Text style={{ 
              color: selectedAssets.size > 0 ? 'white' : colors.textSecondary, 
              fontWeight: '600' 
            }}>
              Slideshow ({selectedAssets.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}


      {/* Photo Grid */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {filteredAssets.map(renderAsset)}
        </View>
        
        {isSearching && (
          <GlassCard
            style={{
              padding: spacing.xl,
              alignItems: 'center',
              marginTop: spacing.xl,
            }}
          >
            <Ionicons 
              name="search" 
              size={64} 
              color={colors.textSecondary} 
              style={{ marginBottom: spacing.md }}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              Searching...
            </Text>
          </GlassCard>
        )}
        
        {!isSearching && filteredAssets.length === 0 && assets.length > 0 && (
          <GlassCard
            style={{
              padding: spacing.xl,
              alignItems: 'center',
              marginTop: spacing.xl,
            }}
          >
            <Ionicons 
              name="search" 
              size={64} 
              color={colors.textSecondary} 
              style={{ marginBottom: spacing.md }}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              No Results Found
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Try adjusting your search terms or filters
            </Text>
          </GlassCard>
        )}
        
        {assets.length === 0 && !loading && (
          <GlassCard
            style={{
              padding: spacing.xl,
              alignItems: 'center',
              marginTop: spacing.xl,
            }}
          >
            <Ionicons 
              name="images-outline" 
              size={64} 
              color={colors.textSecondary} 
              style={{ marginBottom: spacing.md }}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: spacing.sm,
              }}
            >
              No Photos Yet
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Upload your first photos to start creating viral TikTok slideshows
            </Text>
          </GlassCard>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <FullScreenImageModal
        asset={fullScreenAsset}
        isVisible={fullScreenAsset !== null}
        onClose={() => setFullScreenAsset(null)}
        onDelete={handleDeleteAsset}
      />
    </View>
  );
}