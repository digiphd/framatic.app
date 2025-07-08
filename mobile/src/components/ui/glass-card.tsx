import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { colors, glassMorphism, borderRadius, gradients } from '../../styles/theme';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'magic';
  blurIntensity?: number;
}

export function GlassCard({ 
  children, 
  className, 
  style, 
  variant = 'default',
  blurIntensity = 20,
  ...props 
}: GlassCardProps) {
  const getCardStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          ...glassMorphism.card,
          borderColor: colors.primary,
          shadowColor: colors.primary,
        };
      case 'magic':
        return {
          ...glassMorphism.magicButton,
          backgroundColor: colors.primaryGlass,
        };
      default:
        return glassMorphism.card;
    }
  };

  const cardStyle = getCardStyle();

  return (
    <View
      style={[
        {
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
        },
        style,
      ]}
      {...props}
    >
      {/* Blur background */}
      <BlurView 
        intensity={blurIntensity}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Glass overlay */}
      <View
        style={[
          cardStyle,
          {
            borderRadius: borderRadius.lg,
            backgroundColor: cardStyle.backgroundColor,
          },
        ]}
      >
        {/* Gradient border effect */}
        {variant === 'magic' && (
          <LinearGradient
            colors={gradients.border}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: borderRadius.lg,
              padding: 1,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: borderRadius.lg - 1,
                backgroundColor: colors.glass,
              }}
            />
          </LinearGradient>
        )}
        
        {/* Content */}
        <View style={{ flex: 1, zIndex: 1 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

// Export variants for easy access
export const Card = GlassCard;
export const PrimaryCard = (props: Omit<GlassCardProps, 'variant'>) => 
  <GlassCard variant="primary" {...props} />;
export const MagicCard = (props: Omit<GlassCardProps, 'variant'>) => 
  <GlassCard variant="magic" {...props} />;