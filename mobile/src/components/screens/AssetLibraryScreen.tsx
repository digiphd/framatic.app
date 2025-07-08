import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48) / 3 - 8; // 3 columns with margins

// Mock asset data - this will come from the API
const mockAssets = [
  {
    id: '1',
    r2_url: 'https://picsum.photos/400/600?random=1',
    viral_potential_score: 8.5,
    quality_score: 9.2,
    analysis_status: 'completed',
    ai_analysis: {
      emotions: ['authentic', 'happy', 'candid'],
      content_type: 'portrait',
      best_for_templates: ['day_in_life', 'photo_dump']
    }
  },
  {
    id: '2', 
    r2_url: 'https://picsum.photos/400/600?random=2',
    viral_potential_score: 7.8,
    quality_score: 8.9,
    analysis_status: 'completed',
    ai_analysis: {
      emotions: ['beautiful', 'serene'],
      content_type: 'landscape',
      best_for_templates: ['hidden_gems', 'before_after']
    }
  },
  {
    id: '3',
    r2_url: 'https://picsum.photos/400/600?random=3', 
    viral_potential_score: 9.1,
    quality_score: 8.7,
    analysis_status: 'processing',
    ai_analysis: null
  },
  {
    id: '4',
    r2_url: 'https://picsum.photos/400/600?random=4',
    viral_potential_score: 6.5,
    quality_score: 7.2,
    analysis_status: 'completed',
    ai_analysis: {
      emotions: ['candid', 'fun'],
      content_type: 'group',
      best_for_templates: ['things_that', 'pov_youre']
    }
  },
  {
    id: '5',
    r2_url: 'https://picsum.photos/400/600?random=5',
    viral_potential_score: 8.9,
    quality_score: 9.5,
    analysis_status: 'completed',
    ai_analysis: {
      emotions: ['authentic', 'inspiring'],
      content_type: 'portrait',
      best_for_templates: ['before_after', 'day_in_life']
    }
  },
  {
    id: '6',
    r2_url: 'https://picsum.photos/400/600?random=6',
    viral_potential_score: 7.2,
    quality_score: 8.1,
    analysis_status: 'pending',
    ai_analysis: null
  }
];

interface AssetLibraryScreenProps {
  onBack: () => void;
}

export function AssetLibraryScreen({ onBack }: AssetLibraryScreenProps) {
  const [assets, setAssets] = useState(mockAssets);
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Permission to access camera roll is required!');
        return;
      }

      // Pick multiple images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10, // Bulk processing limit
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        
        // Simulate upload and analysis
        setTimeout(() => {
          const newAssets = result.assets!.map((asset, index) => ({
            id: `new_${Date.now()}_${index}`,
            r2_url: asset.uri,
            viral_potential_score: Math.random() * 10,
            quality_score: Math.random() * 10,
            analysis_status: 'processing' as const,
            ai_analysis: null
          }));
          
          setAssets(prev => [...newAssets, ...prev]);
          setUploading(false);
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
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

  const renderAsset = (asset: any) => (
    <TouchableOpacity 
      key={asset.id}
      style={{
        width: imageSize,
        marginBottom: spacing.sm,
      }}
      activeOpacity={0.8}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: asset.r2_url }}
          style={{
            width: imageSize,
            height: imageSize * 1.5,
            borderRadius: borderRadius.md,
            backgroundColor: colors.glass,
          }}
          resizeMode="cover"
        />
        
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
        {asset.analysis_status === 'completed' && (
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
            <Ionicons name="sync" size={12} color={colors.warning} />
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
        
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Photo Library
        </Text>
        
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
            opacity: uploading ? 0.5 : 1,
          }}
        >
          <Ionicons 
            name={uploading ? "sync" : "add"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <GlassCard style={{ flex: 1, padding: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Total Photos
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: 'bold',
              marginTop: 4,
            }}
          >
            {assets.length}
          </Text>
        </GlassCard>
        
        <GlassCard style={{ flex: 1, padding: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Avg Score
          </Text>
          <Text
            style={{
              color: colors.primary,
              fontSize: 24,
              fontWeight: 'bold',
              marginTop: 4,
            }}
          >
            {(assets.reduce((sum, asset) => sum + asset.viral_potential_score, 0) / assets.length).toFixed(1)}
          </Text>
        </GlassCard>
        
        <GlassCard style={{ flex: 1, padding: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Processing
          </Text>
          <Text
            style={{
              color: colors.warning,
              fontSize: 24,
              fontWeight: 'bold',
              marginTop: 4,
            }}
          >
            {assets.filter(a => a.analysis_status !== 'completed').length}
          </Text>
        </GlassCard>
      </View>

      {/* Upload Section */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <MagicButton
          onPress={pickImages}
          disabled={uploading}
          style={{ width: '100%' }}
        >
          {uploading ? "Uploading..." : "Upload Photos"}
        </MagicButton>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 12,
            textAlign: 'center',
            marginTop: spacing.sm,
          }}
        >
          Upload up to 10 photos for bulk AI analysis
        </Text>
      </View>

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
          {assets.map(renderAsset)}
        </View>
        
        {assets.length === 0 && (
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
    </View>
  );
}