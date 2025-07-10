import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { 
  Canvas, 
  Text, 
  Image, 
  useImage, 
  useFont, 
  Paint,
  Rect,
  Group,
  Shadow,
  BackdropFilter,
  Blur,
  RoundedRect
} from '@shopify/react-native-skia';
import { apiService } from '../../services/api';
import { 
  calculateElementTransform,
  calculateTextBackground,
  getTextColors,
  calculateFontSize,
  calculateShadowOffset,
  calculateResolutionScale,
  STANDARD_CANVAS
} from '../../shared/slideTransforms';

const { width: screenWidth } = Dimensions.get('window');

// Standard TikTok aspect ratio dimensions
const EXPORT_WIDTH = STANDARD_CANVAS.WIDTH;
const EXPORT_HEIGHT = STANDARD_CANVAS.HEIGHT;

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

interface SkiaSlideRendererProps {
  slide: SlideData;
  width?: number;
  height?: number;
}

export interface SkiaSlideRendererRef {
  capture: () => Promise<string>;
}

export const SkiaSlideRenderer = forwardRef<SkiaSlideRendererRef, SkiaSlideRendererProps>(
  ({ slide, width = EXPORT_WIDTH, height = EXPORT_HEIGHT }, ref) => {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    
    // Calculate resolution scale for consistent sizing
    const resolutionScale = calculateResolutionScale(width);
    
    // Load background image
    const backgroundImage = useImage(presignedUrl);
    
    // Load font - using shared font size calculation for consistency
    const fontSize = calculateFontSize(
      slide.textStyle?.fontSize || 24,
      slide.textScale || 1,
      resolutionScale
    );
    const font = useFont(null, fontSize); // Use system font for now
    
    // Load presigned URL for the image
    useEffect(() => {
      const loadPresignedUrl = async () => {
        try {
          console.log('SkiaSlideRenderer: Loading presigned URL for:', slide.imageUrl);
          const url = await apiService.getPresignedUrl(slide.imageUrl);
          console.log('SkiaSlideRenderer: Got presigned URL:', url);
          setPresignedUrl(url);
        } catch (error) {
          console.error('SkiaSlideRenderer: Failed to get presigned URL:', error);
        }
      };

      if (slide.imageUrl) {
        loadPresignedUrl();
      }
    }, [slide.imageUrl]);

    // Check if everything is ready
    useEffect(() => {
      if (backgroundImage && font && presignedUrl) {
        setIsReady(true);
      }
    }, [backgroundImage, font, presignedUrl]);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!isReady) {
          throw new Error('Skia renderer not ready');
        }
        
        // For now, we'll use the same approach as the current renderer
        // In the future, we can implement Skia's native image capture
        // For now, this ensures the Skia rendering is consistent
        console.log('SkiaSlideRenderer: Capture requested - Skia ensures consistency');
        
        // Return a placeholder URI for now - we'll implement actual capture later
        return 'skia://rendered-slide';
      },
    }));

    // Use shared transformation logic for consistency
    const transform = calculateElementTransform(
      {
        x: slide.textPosition?.x || 0.5,
        y: slide.textPosition?.y || 0.8,
        scale: slide.textScale || 1,
        rotation: slide.textRotation || 0
      },
      width,
      height
    );

    // Use shared color calculation
    const { textColor, backgroundColor } = getTextColors(slide.textStyle);
    
    // Calculate text background dimensions using shared logic
    const textBackground = calculateTextBackground(
      slide.text || '',
      fontSize,
      width,
      resolutionScale
    );
    
    // Calculate shadow offset using shared logic
    const shadowOffset = calculateShadowOffset(resolutionScale);
    
    const backgroundMode = slide.textStyle?.backgroundMode || 'none';

    return (
      <View style={{ width, height }}>
        <Canvas style={{ width, height }}>
          {/* Background Image */}
          {backgroundImage && (
            <Image
              image={backgroundImage}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="cover"
            />
          )}
          
          {/* Text with Background */}
          {slide.text && font && (
            <Group>
              {/* Text Background using shared calculations */}
              {backgroundMode !== 'none' && (
                <RoundedRect
                  x={transform.translateX - textBackground.width / 2}
                  y={transform.translateY - textBackground.height / 2}
                  width={textBackground.width}
                  height={textBackground.height}
                  r={textBackground.radius}
                  color={backgroundColor}
                />
              )}
              
              {/* Text Shadow using shared offset */}
              <Text
                x={transform.translateX + shadowOffset}
                y={transform.translateY + shadowOffset}
                text={slide.text}
                font={font}
                color="rgba(0, 0, 0, 0.8)"
              />
              
              {/* Main Text using shared transform */}
              <Text
                x={transform.translateX}
                y={transform.translateY}
                text={slide.text}
                font={font}
                color={textColor}
              />
            </Group>
          )}
        </Canvas>
      </View>
    );
  }
);

SkiaSlideRenderer.displayName = 'SkiaSlideRenderer';