import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from './blur-view-fallback';
import { 
  colors, 
  borderRadius, 
  typography, 
  spacing,
  gradients,
  animations 
} from '../../styles/theme';

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  duration?: number; // Recording duration in seconds
  transcription?: string;
  disabled?: boolean;
}

export function VoiceRecorder({
  isRecording,
  onStartRecording,
  onStopRecording,
  duration = 0,
  transcription,
  disabled = false,
}: VoiceRecorderProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: animations.normal,
        useNativeDriver: false,
      }).start();

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Stop animations
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: animations.normal,
        useNativeDriver: true,
      }).start();

      Animated.timing(glowAnim, {
        toValue: 0,
        duration: animations.normal,
        useNativeDriver: false,
      }).start();
    }
  }, [isRecording]);

  const handlePress = () => {
    if (disabled) return;
    
    // Quick scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: animations.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: true,
      }),
    ]).start();

    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const buttonSize = 120;
  const { width: screenWidth } = Dimensions.get('window');

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
      {/* Recording indicator */}
      {isRecording && (
        <View 
          style={{ 
            marginBottom: spacing.lg,
            alignItems: 'center' 
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.errorGlass,
              borderWidth: 1,
              borderColor: colors.error,
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.error,
                marginRight: spacing.sm,
              }}
            />
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.sm,
                fontWeight: typography.semibold,
              }}
            >
              Recording • {formatDuration(duration)}
            </Text>
          </View>
        </View>
      )}

      {/* Voice recorder button */}
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        }}
      >
        {/* Glow effect */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -20,
            left: -20,
            right: -20,
            bottom: -20,
            borderRadius: (buttonSize + 40) / 2,
            shadowColor: isRecording ? colors.error : colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: animatedGlow,
            elevation: 15,
          }}
        />

        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            overflow: 'hidden',
          }}
        >
          {/* Blur background */}
          <BlurView 
            intensity={20}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Background gradient */}
          <LinearGradient
            colors={isRecording ? [colors.error, '#FF6B6B'] : gradients.magic}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: isRecording ? colors.error : colors.primary,
            }}
          >
            {/* Microphone icon or stop square */}
            <View
              style={{
                width: isRecording ? 20 : 40,
                height: isRecording ? 20 : 40,
                backgroundColor: colors.foreground,
                borderRadius: isRecording ? 4 : 20,
              }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Instructions */}
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.base,
          fontWeight: typography.medium,
          textAlign: 'center',
          marginTop: spacing.lg,
          paddingHorizontal: spacing.xl,
        }}
      >
        {isRecording 
          ? 'Tap to stop recording' 
          : 'Tap to start recording your slideshow idea'
        }
      </Text>

      {/* Live transcription */}
      {transcription && (
        <View 
          style={{
            marginTop: spacing.lg,
            width: screenWidth - spacing.xl * 2,
            maxWidth: 400,
          }}
        >
          <View
            style={{
              backgroundColor: colors.glass,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.muted,
                fontSize: typography.xs,
                fontWeight: typography.semibold,
                marginBottom: spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Live Transcription
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: typography.base,
                lineHeight: typography.base * 1.5,
                fontWeight: typography.medium,
              }}
            >
              {transcription}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Export a simplified version for quick use
export function QuickVoiceButton({ 
  onPress, 
  isActive = false 
}: { 
  onPress: () => void; 
  isActive?: boolean; 
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: isActive ? colors.primary : colors.glass,
        borderWidth: 2,
        borderColor: isActive ? colors.secondary : colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          backgroundColor: colors.foreground,
          borderRadius: 10,
        }}
      />
    </TouchableOpacity>
  );
}