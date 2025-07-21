import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  MagicButton,
  ProgressIndicator,
} from '../ui';
import { R2Image } from '../ui/R2Image';
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../styles/theme';

interface HomeScreenProps {
  onMagicCreate: () => void;
  onViewLibrary: () => void;
  onViewSlideshows?: () => void;
  onVoiceCreate?: () => void; // New voice creation handler
  onPreviewSlideshow?: (slideshow: any) => void; // Handler for tapping recent slideshows
  analysisProgress?: number;
}

export function HomeScreen({
  onMagicCreate,
  onViewLibrary,
  onViewSlideshows,
  onVoiceCreate,
  onPreviewSlideshow,
  analysisProgress,
}: HomeScreenProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const [recentSlideshows, setRecentSlideshows] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Fetch recent slideshows on component mount
  useEffect(() => {
    fetchRecentSlideshows();
  }, []);

  const fetchRecentSlideshows = async () => {
    setIsLoadingRecent(true);
    try {
      const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';
      const response = await fetch(`http://10.0.4.115:3000/api/slideshow/list?userId=${MVP_USER_ID}`);
      const data = await response.json();
      
      if (data.success && data.slideshows) {
        // Take only the first 10 for recent display and ensure they have slides
        const recentWithSlides = data.slideshows
          .filter((slideshow: any) => slideshow.slides && slideshow.slides.length > 0)
          .slice(0, 10);
        setRecentSlideshows(recentWithSlides);
      }
    } catch (error) {
      console.error('Failed to fetch recent slideshows:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, '#0A0A0A', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          {/* App Logo/Name */}
          <Text
            style={{
              color: colors.primary,
              fontSize: typography['4xl'],
              fontWeight: typography.bold,
              marginBottom: spacing.sm,
              textAlign: 'center',
            }}
          >
            Framatic.app
          </Text>
          
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography['2xl'],
              fontWeight: typography.bold,
              marginBottom: spacing.xs,
            }}
          >
            Welcome back!
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.lg,
              fontWeight: typography.medium,
            }}
          >
            Ready to create some viral magic?
          </Text>
        </View>


        {/* Analysis Progress (if active) */}
        {analysisProgress !== undefined && analysisProgress < 100 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <GlassCard>
              <View style={{ padding: spacing.md }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.lg,
                    fontWeight: typography.semibold,
                    marginBottom: spacing.sm,
                  }}
                >
                  🤖 AI Analysis in Progress
                </Text>
                <ProgressIndicator
                  progress={analysisProgress}
                  variant="magic"
                  label="Analyzing your photos for viral potential..."
                />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Voice Creation Button - Compact */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <TouchableOpacity
            onPress={onVoiceCreate || onMagicCreate}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="mic" size={20} color={colors.background} style={{ marginRight: spacing.sm }} />
            <Text
              style={{
                color: colors.background,
                fontSize: typography.lg,
                fontWeight: typography.bold,
                textAlign: 'center',
              }}
            >
              Voice Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Slideshows Carousel */}
        {recentSlideshows.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.xl,
                  fontWeight: typography.bold,
                  marginBottom: spacing.xs,
                }}
              >
                Recent Slideshows
              </Text>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.base,
                  fontWeight: typography.medium,
                }}
              >
                Tap to preview or continue editing
              </Text>
            </View>
            
            <FlatList
              data={recentSlideshows}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
              renderItem={({ item }) => {
                const cardWidth = 120;
                const cardHeight = cardWidth * (16 / 9); // 9:16 aspect ratio
                return (
                  <TouchableOpacity
                    onPress={() => onPreviewSlideshow?.(item)}
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                      backgroundColor: colors.glass,
                      borderRadius: borderRadius.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Slideshow Thumbnail - 9:16 format */}
                    <View style={{ flex: 1, backgroundColor: colors.border }}>
                      {item.slides?.[0]?.imageUrl ? (
                        <R2Image
                          url={item.slides[0].imageUrl}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: colors.muted,
                          }}
                        >
                          <Ionicons name="images" size={24} color={colors.background} />
                        </View>
                      )}
                    </View>
                    
                    {/* Slideshow Info Overlay */}
                    <View style={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: spacing.xs,
                    }}>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: typography.xs,
                          fontWeight: typography.semibold,
                          marginBottom: 2,
                        }}
                        numberOfLines={1}
                      >
                        {item.title || 'Untitled'}
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: typography.xs,
                          fontWeight: typography.medium,
                        }}
                      >
                        {item.slides?.length || 0} slides
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => item.id || index.toString()}
            />
          </View>
        )}

        {/* Quick Access Links */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginTop: spacing.xl * 2,
            gap: spacing.md,
          }}
        >
          {/* My Slideshows Link */}
          {onViewSlideshows && (
            <TouchableOpacity
              onPress={onViewSlideshows}
              style={{
                backgroundColor: colors.glass,
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: spacing.sm }}>🎬</Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.lg,
                    fontWeight: typography.semibold,
                  }}
                >
                  My Slideshows
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
          
          {/* Photo Library Link */}
          <TouchableOpacity
            onPress={onViewLibrary}
            style={{
              backgroundColor: colors.glass,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 20, marginRight: spacing.sm }}>📱</Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.lg,
                  fontWeight: typography.semibold,
                }}
              >
                Photo Library
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>



      </ScrollView>
    </SafeAreaView>
  );
}