import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { R2Image } from './R2Image';
import { GlassCard } from './glass-card';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { Asset } from '../../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FullScreenImageModalProps {
  asset: Asset | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete: (assetId: string) => void;
}

export function FullScreenImageModal({ 
  asset, 
  isVisible, 
  onClose, 
  onDelete 
}: FullScreenImageModalProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (!asset) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(asset.id);
            onClose();
          }
        }
      ]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    return colors.error;
  };

  const formatAnalysisData = (analysis: any) => {
    if (!analysis) return 'No analysis data available';
    
    const sections = [];
    
    if (analysis.emotions) {
      sections.push(`Emotions: ${analysis.emotions.join(', ')}`);
    }
    
    if (analysis.tags) {
      sections.push(`Tags: ${analysis.tags.join(', ')}`);
    }
    
    if (analysis.content_type) {
      sections.push(`Content Type: ${analysis.content_type}`);
    }
    
    if (analysis.lighting) {
      sections.push(`Lighting: ${analysis.lighting}`);
    }
    
    if (analysis.composition) {
      sections.push(`Composition: ${analysis.composition}`);
    }
    
    if (analysis.scene_description) {
      sections.push(`Scene: ${analysis.scene_description}`);
    }
    
    if (analysis.best_for_templates) {
      sections.push(`Best Templates: ${analysis.best_for_templates.join(', ')}`);
    }
    
    return sections.join('\n\n');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarHidden
    >
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              paddingTop: 50,
              paddingBottom: spacing.md,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowAnalysis(!showAnalysis)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: showAnalysis ? colors.primary : 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="information-circle" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255, 59, 48, 0.8)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="trash" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <R2Image
              r2Url={asset.r2_url}
              style={{
                width: screenWidth,
                height: screenHeight * 0.7,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Info */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              paddingBottom: 40,
            }}
          >
            {/* Viral Score */}
            {asset.viral_potential_score !== null && (
              <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ color: 'white', fontSize: 16, marginBottom: 4 }}>
                  Viral Score
                </Text>
                <View
                  style={{
                    backgroundColor: getScoreColor(asset.viral_potential_score),
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.lg,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}
                  >
                    {asset.viral_potential_score.toFixed(1)}/10
                  </Text>
                </View>
              </View>
            )}

            {/* File Info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>
                {asset.original_filename}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>
                {asset.file_size ? `${(asset.file_size / 1024 / 1024).toFixed(1)}MB` : ''}
              </Text>
            </View>
          </View>

          {/* Analysis Panel */}
          {showAnalysis && (
            <View
              style={{
                position: 'absolute',
                top: 100,
                left: spacing.lg,
                right: spacing.lg,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                maxHeight: screenHeight * 0.6,
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={{
                    color: 'white',
                    fontSize: 18,
                    fontWeight: 'bold',
                    marginBottom: spacing.md,
                  }}
                >
                  AI Analysis
                </Text>
                
                <Text
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {formatAnalysisData(asset.ai_analysis)}
                </Text>

                {asset.quality_score && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={{ color: 'white', fontSize: 16, marginBottom: 4 }}>
                      Quality Score: {asset.quality_score.toFixed(1)}/10
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}