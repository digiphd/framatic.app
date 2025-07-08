import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ViewStyle, 
  TextStyle, 
  Animated,
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { 
  colors, 
  glassMorphism, 
  borderRadius, 
  typography, 
  spacing,
  animations,
  gradients 
} from '../../styles/theme';

interface MagicButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'magic' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
}

export function MagicButton({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  loading = false,
  ...props
}: MagicButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: animations.fast,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animations.normal,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: animations.normal,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          fontSize: typography.sm,
        };
      case 'lg':
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xl,
          fontSize: typography.lg,
        };
      case 'xl':
        return {
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing['2xl'],
          fontSize: typography.xl,
        };
      default:
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          fontSize: typography.base,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primaryGlass,
        };
      case 'magic':
        return glassMorphism.magicButton;
      case 'glass':
        return glassMorphism.button;
      default:
        return {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const animatedGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        <View
          style={[
            {
              borderRadius: borderRadius.lg,
              overflow: 'hidden',
              position: 'relative',
            },
          ]}
        >
          {/* Blur background for glass effect */}
          {(variant === 'glass' || variant === 'magic') && (
            <BlurView 
              intensity={15}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          )}

          {/* Magic gradient background */}
          {variant === 'magic' && (
            <LinearGradient
              colors={gradients.magic}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          )}

          {/* Animated glow effect */}
          {variant === 'magic' && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: borderRadius.lg + 10,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: animatedGlow,
                elevation: 10,
              }}
            />
          )}

          {/* Button content */}
          <View
            style={[
              {
                borderRadius: borderRadius.lg,
                borderWidth: variant === 'magic' ? 2 : 1,
                paddingVertical: sizeStyles.paddingVertical,
                paddingHorizontal: sizeStyles.paddingHorizontal,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                opacity: disabled ? 0.5 : 1,
              },
              variantStyles,
            ]}
          >
            {loading ? (
              <Text
                style={[
                  {
                    color: colors.foreground,
                    fontSize: sizeStyles.fontSize,
                    fontWeight: typography.semibold,
                  },
                  textStyle,
                ]}
              >
                Loading...
              </Text>
            ) : typeof children === 'string' ? (
              <Text
                style={[
                  {
                    color: colors.foreground,
                    fontSize: sizeStyles.fontSize,
                    fontWeight: typography.semibold,
                  },
                  textStyle,
                ]}
              >
                {children}
              </Text>
            ) : (
              children
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Export preset variants
export const Button = MagicButton;
export const PrimaryButton = (props: Omit<MagicButtonProps, 'variant'>) => 
  <MagicButton variant="primary" {...props} />;
export const GlassButton = (props: Omit<MagicButtonProps, 'variant'>) => 
  <MagicButton variant="glass" {...props} />;
export const MagicCreateButton = (props: Omit<MagicButtonProps, 'variant' | 'size'>) => 
  <MagicButton variant="magic" size="xl" {...props} />;