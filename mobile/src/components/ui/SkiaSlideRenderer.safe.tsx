import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../styles/theme';

// Safe version of SkiaSlideRenderer that can be used when Skia is not available
interface SlideData {
  id: string;
  imageUrl: string;
  text: string;
  textStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    backgroundColor?: string;
    backgroundMode?: 'none' | 'half' | 'full' | 'white';
  };
  textPosition?: { x: number; y: number };
  textScale?: number;
  textRotation?: number;
}

interface SafeSkiaSlideRendererProps {
  slide: SlideData;
  width?: number;
  height?: number;
}

export interface SafeSkiaSlideRendererRef {
  capture: () => Promise<string>;
}

export const SafeSkiaSlideRenderer = forwardRef<SafeSkiaSlideRendererRef, SafeSkiaSlideRendererProps>(
  ({ slide, width = 1080, height = 1920 }, ref) => {
    
    useImperativeHandle(ref, () => ({
      capture: async () => {
        throw new Error('Skia renderer is not available. Please enable Skia support first.');
      },
    }));

    return (
      <View style={{ 
        width, 
        height, 
        backgroundColor: colors.background, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.warning,
        borderStyle: 'dashed'
      }}>
        <Text style={{
          color: colors.warning,
          fontSize: 16,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          Skia Renderer Not Available
        </Text>
        <Text style={{
          color: colors.muted,
          fontSize: 12,
          textAlign: 'center',
          maxWidth: width * 0.6,
        }}>
          Enable Skia support to see pixel-perfect previews
        </Text>
      </View>
    );
  }
);

SafeSkiaSlideRenderer.displayName = 'SafeSkiaSlideRenderer';