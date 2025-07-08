import React from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { 
  colors, 
  borderRadius, 
  typography, 
  spacing,
  gradients,
  animations 
} from '../../styles/theme';

interface ProgressIndicatorProps {
  progress: number; // 0 to 100
  label?: string;
  variant?: 'default' | 'glass' | 'magic';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ProgressIndicator({
  progress,
  label,
  variant = 'default',
  size = 'md',
  showPercentage = true,
}: ProgressIndicatorProps) {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: animations.slow,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 6,
          fontSize: typography.sm,
        };
      case 'lg':
        return {
          height: 12,
          fontSize: typography.lg,
        };
      default:
        return {
          height: 8,
          fontSize: typography.base,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const animatedWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ marginVertical: spacing.sm }}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <View 
          style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs 
          }}
        >
          {label && (
            <Text
              style={{
                color: colors.foreground,
                fontSize: sizeStyles.fontSize,
                fontWeight: typography.medium,
              }}
            >
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text
              style={{
                color: colors.muted,
                fontSize: sizeStyles.fontSize,
                fontWeight: typography.medium,
              }}
            >
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}

      {/* Progress bar container */}
      <View
        style={{
          height: sizeStyles.height,
          backgroundColor: colors.glass,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          overflow: 'hidden',
        }}
      >
        {/* Glass background effect */}
        {variant === 'glass' && (
          <BlurView 
            intensity={10}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}

        {/* Progress fill */}
        <Animated.View
          style={{
            width: animatedWidth,
            height: '100%',
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          }}
        >
          {variant === 'magic' ? (
            <LinearGradient
              colors={gradients.magic}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                elevation: 4,
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                backgroundColor: variant === 'glass' ? colors.primary : colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
                elevation: 2,
              }}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// Status-specific progress indicators
export function AnalysisProgress({ progress }: { progress: number }) {
  return (
    <ProgressIndicator
      progress={progress}
      label="Analyzing photos..."
      variant="magic"
      size="md"
    />
  );
}

export function UploadProgress({ progress }: { progress: number }) {
  return (
    <ProgressIndicator
      progress={progress}
      label="Uploading to cloud..."
      variant="glass"
      size="sm"
    />
  );
}

export function GenerationProgress({ progress }: { progress: number }) {
  return (
    <ProgressIndicator
      progress={progress}
      label="Creating magic..."
      variant="magic"
      size="lg"
      showPercentage={false}
    />
  );
}