import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GlassCard,
  MagicButton,
  TemplateCard,
  ProgressIndicator,
} from '../ui';
import { ViralTemplates } from '../ui/template-card';
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../styles/theme';

interface DashboardStats {
  totalSlideshows: number;
  viralHits: number;
  totalViews: string;
  librarySize: number;
}

interface RecentSlideshow {
  id: string;
  title: string;
  template: string;
  views: string;
  viralScore: number;
  createdAt: string;
}

interface HomeScreenProps {
  onMagicCreate: () => void;
  onTemplateSelect: (template: string) => void;
  onViewLibrary: () => void;
  onViewSlideshows?: () => void;
  stats?: DashboardStats;
  recentSlideshows?: RecentSlideshow[];
  analysisProgress?: number;
}

export function HomeScreen({
  onMagicCreate,
  onTemplateSelect,
  onViewLibrary,
  onViewSlideshows,
  stats = {
    totalSlideshows: 12,
    viralHits: 3,
    totalViews: '2.1M',
    librarySize: 45,
  },
  recentSlideshows = [],
  analysisProgress,
}: HomeScreenProps) {
  const { width: screenWidth } = Dimensions.get('window');

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

        {/* Stats Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: spacing.lg,
            marginTop: spacing.xl,
          }}
        >
          {[
            { label: 'Slideshows', value: stats.totalSlideshows.toString(), color: colors.primary },
            { label: 'Viral Hits', value: stats.viralHits.toString(), color: colors.success },
            { label: 'Total Views', value: stats.totalViews, color: colors.secondary },
            { label: 'Photos', value: stats.librarySize.toString(), color: colors.accent },
          ].map((stat, index) => (
            <View
              key={index}
              style={{
                width: (screenWidth - spacing.lg * 2 - spacing.sm) / 2,
                marginRight: index % 2 === 0 ? spacing.sm : 0,
                marginBottom: spacing.sm,
              }}
            >
              <GlassCard>
                <View style={{ padding: spacing.md, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: stat.color,
                      fontSize: typography['2xl'],
                      fontWeight: typography.bold,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: typography.sm,
                      fontWeight: typography.medium,
                      textAlign: 'center',
                    }}
                  >
                    {stat.label}
                  </Text>
                </View>
              </GlassCard>
            </View>
          ))}
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

        {/* Magic Create Button */}
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            marginTop: spacing.xl,
          }}
        >
          <MagicButton onPress={onMagicCreate}>
            ✨ Create Magic
          </MagicButton>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.base,
              fontWeight: typography.medium,
              textAlign: 'center',
              marginTop: spacing.md,
              paddingHorizontal: spacing.lg,
            }}
          >
            Tap to create a viral slideshow in under 10 seconds
          </Text>
          
          {/* Action Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            gap: spacing.md, 
            marginTop: spacing.lg,
            width: '100%'
          }}>
            {/* Photo Library Button */}
            <TouchableOpacity
              onPress={onViewLibrary}
              style={{
                flex: 1,
                backgroundColor: colors.glass,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.base,
                  fontWeight: typography.medium,
                  textAlign: 'center',
                }}
              >
                📱 Photo Library
              </Text>
            </TouchableOpacity>

            {/* My Slideshows Button */}
            {onViewSlideshows && (
              <TouchableOpacity
                onPress={onViewSlideshows}
                style={{
                  flex: 1,
                  backgroundColor: colors.glass,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.base,
                    fontWeight: typography.medium,
                    textAlign: 'center',
                  }}
                >
                  🎬 My Slideshows
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Templates */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.xl,
                fontWeight: typography.bold,
                marginBottom: spacing.xs,
              }}
            >
              Popular Templates
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.base,
                fontWeight: typography.medium,
              }}
            >
              Research-backed formats with proven viral success
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.md }}
          >
            {Object.entries(ViralTemplates).slice(0, 3).map(([key, template]) => (
              <View
                key={key}
                style={{
                  width: screenWidth * 0.75,
                  marginHorizontal: spacing.xs,
                }}
              >
                <TemplateCard
                  {...template}
                  onPress={() => onTemplateSelect(template.name)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Slideshows */}
        {recentSlideshows.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.xl,
                fontWeight: typography.bold,
                marginBottom: spacing.lg,
              }}
            >
              Recent Creations
            </Text>

            {recentSlideshows.slice(0, 3).map((slideshow) => (
              <GlassCard key={slideshow.id} style={{ marginBottom: spacing.md }}>
                <View style={{ padding: spacing.md }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: typography.lg,
                          fontWeight: typography.semibold,
                          marginBottom: spacing.xs,
                        }}
                      >
                        {slideshow.title}
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: typography.sm,
                          fontWeight: typography.medium,
                        }}
                      >
                        {slideshow.template.replace('_', ' ')} • {slideshow.createdAt}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: typography.lg,
                          fontWeight: typography.bold,
                        }}
                      >
                        {slideshow.views}
                      </Text>
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: typography.xs,
                          fontWeight: typography.medium,
                        }}
                      >
                        views
                      </Text>
                    </View>
                  </View>

                  {/* Viral score indicator */}
                  <View
                    style={{
                      backgroundColor: colors.glass,
                      borderRadius: borderRadius.full,
                      height: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${slideshow.viralScore}%`,
                        height: '100%',
                        backgroundColor: slideshow.viralScore > 70 ? colors.success : colors.primary,
                        borderRadius: borderRadius.full,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: typography.xs,
                      fontWeight: typography.medium,
                      marginTop: spacing.xs,
                    }}
                  >
                    Viral Score: {slideshow.viralScore}%
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: typography.xl,
              fontWeight: typography.bold,
              marginBottom: spacing.lg,
            }}
          >
            Quick Actions
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[
              { icon: '📁', label: 'Asset Library', action: 'library' },
              { icon: '🎬', label: 'Templates', action: 'templates' },
              { icon: '📊', label: 'Analytics', action: 'analytics' },
              { icon: '⚙️', label: 'Settings', action: 'settings' },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  width: (screenWidth - spacing.lg * 2 - spacing.sm) / 2,
                  marginRight: index % 2 === 0 ? spacing.sm : 0,
                  marginBottom: spacing.sm,
                }}
              >
                <GlassCard>
                  <View
                    style={{
                      padding: spacing.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 80,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>
                      {item.icon}
                    </Text>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: typography.sm,
                        fontWeight: typography.medium,
                        textAlign: 'center',
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </GlassCard>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}