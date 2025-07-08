import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '../../styles/theme';

interface BlurViewProps {
  style?: ViewStyle;
  blurType?: string;
  blurAmount?: number;
  children?: React.ReactNode;
}

// Fallback BlurView for web and when native blur isn't available
export function BlurView({ style, children, ...props }: BlurViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glass,
          backdropFilter: 'blur(20px)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Re-export for compatibility
export default BlurView;