import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { colors } from '../../styles/theme';

interface ShimmerPlaceholderProps {
  width: number;
  height: number;
  style?: ViewStyle;
}

export function ShimmerPlaceholder({ width, height, style }: ShimmerPlaceholderProps) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = () => {
      shimmerValue.setValue(0);
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => shimmerAnimation());
    };
    shimmerAnimation();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.glass,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transform: [{ translateX }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width * 0.3,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
}