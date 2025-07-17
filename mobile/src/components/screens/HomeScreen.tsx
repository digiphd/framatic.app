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
  ProgressIndicator,
} from '../ui';
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
  analysisProgress?: number;
}

export function HomeScreen({
  onMagicCreate,
  onViewLibrary,
  onViewSlideshows,
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

        {/* Main Action Buttons */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            marginTop: spacing.xl * 2,
            gap: spacing.lg,
          }}
        >
          {/* Create Button */}
          <MagicButton onPress={onMagicCreate}>
            🎤 Create
          </MagicButton>
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.base,
              fontWeight: typography.medium,
              textAlign: 'center',
              marginBottom: spacing.lg,
              paddingHorizontal: spacing.lg,
            }}
          >
            Tap to create a viral slideshow in under 10 seconds
          </Text>
          
          {/* Photo Library Button */}
          <TouchableOpacity
            onPress={onViewLibrary}
            style={{
              backgroundColor: colors.glass,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.lg,
                fontWeight: typography.semibold,
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
                backgroundColor: colors.glass,
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.lg,
                  fontWeight: typography.semibold,
                  textAlign: 'center',
                }}
              >
                🎬 My Slideshows
              </Text>
            </TouchableOpacity>
          )}
        </View>



      </ScrollView>
    </SafeAreaView>
  );
}