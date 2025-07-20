import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './glass-card';
import { 
  colors, 
  borderRadius, 
  typography, 
  spacing,
  gradients 
} from '../../styles/theme';

interface TemplateCardProps {
  name: string;
  viralRate: number; // 0-1 (e.g., 0.89 for 89%)
  avgViews: string; // Formatted string like "2.3M"
  bestFor: string[];
  selected?: boolean;
  onPress?: () => void;
  description?: string;
}

export function TemplateCard({
  name,
  viralRate,
  avgViews,
  bestFor,
  selected = false,
  onPress,
  description,
}: TemplateCardProps) {
  const formatTemplateName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getViralRateColor = (rate: number) => {
    if (rate >= 0.85) return colors.success;
    if (rate >= 0.75) return colors.primary;
    if (rate >= 0.65) return colors.warning;
    return colors.error;
  };

  const viralRateColor = getViralRateColor(viralRate);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard
        variant={selected ? 'magic' : 'default'}
        style={{
          marginHorizontal: spacing.xs,
          marginVertical: spacing.xs,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.primary : colors.glassBorder,
        }}
      >
        <View style={{ padding: spacing.md }}>
          {/* Header with name and viral rate */}
          <View 
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing.sm 
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.lg,
                  fontWeight: typography.bold,
                  marginBottom: spacing.xs,
                }}
              >
                {formatTemplateName(name)}
              </Text>
              
              {description && (
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: typography.sm,
                    lineHeight: typography.sm * 1.4,
                  }}
                >
                  {description}
                </Text>
              )}
            </View>

            {/* Viral rate badge */}
            <View
              style={{
                backgroundColor: `${viralRateColor}20`,
                borderWidth: 1,
                borderColor: viralRateColor,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginLeft: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: viralRateColor,
                  fontSize: typography.sm,
                  fontWeight: typography.bold,
                }}
              >
                {Math.round(viralRate * 100)}%
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View 
            style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.xs,
                  fontWeight: typography.medium,
                }}
              >
                AVG VIEWS
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.lg,
                  fontWeight: typography.bold,
                }}
              >
                {avgViews}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  color: colors.muted,
                  fontSize: typography.xs,
                  fontWeight: typography.medium,
                }}
              >
                VIRAL RATE
              </Text>
              <Text
                style={{
                  color: viralRateColor,
                  fontSize: typography.lg,
                  fontWeight: typography.bold,
                }}
              >
                {Math.round(viralRate * 100)}%
              </Text>
            </View>
          </View>

          {/* Best for tags */}
          <View>
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.xs,
                fontWeight: typography.medium,
                marginBottom: spacing.xs,
              }}
            >
              BEST FOR
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {bestFor.map((tag, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.glass,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    borderRadius: borderRadius.sm,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.xs,
                    marginBottom: spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: typography.xs,
                      fontWeight: typography.medium,
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Selected indicator */}
          {selected && (
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                right: spacing.sm,
                width: 24,
                height: 24,
                borderRadius: borderRadius.full,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: typography.sm,
                  fontWeight: typography.bold,
                }}
              >
                ✓
              </Text>
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// Preset template cards based on unified viral templates
export const ViralTemplates = {
  minimalistViral: {
    name: 'minimalist_viral',
    viralRate: 0.92,
    avgViews: '2.8M',
    bestFor: ['authentic', 'lifestyle', 'photo_dumps'],
    description: 'Clean white text with shadow - perfect for authentic moments',
  },
  storyMode: {
    name: 'story_mode',
    viralRate: 0.88,
    avgViews: '2.2M',
    bestFor: ['storytelling', 'testimonials', 'advice'],
    description: 'Semi-transparent background for perfect readability',
  },
  popOff: {
    name: 'pop_off',
    viralRate: 0.85,
    avgViews: '1.9M',
    bestFor: ['opinions', 'controversy', 'bold_statements'],
    description: 'Bold white background for maximum impact statements',
  },
} as const;