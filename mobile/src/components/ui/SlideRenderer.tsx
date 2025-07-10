import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Text, Dimensions, Image } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { R2Image } from './R2Image';
import { colors } from '../../styles/theme';
import { apiService } from '../../services/api';
import { 
  calculateElementTransform,
  calculateResolutionScale,
  getTextColors,
  getReactNativeTextStyle,
  getReactNativeBackgroundStyle,
  calculateTextBackground,
  calculateFontSize
} from '../../shared/slideTransforms';

const { width: screenWidth } = Dimensions.get('window');

// Standard TikTok aspect ratio dimensions
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

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

interface SlideRendererProps {
  slide: SlideData;
  width?: number;
  height?: number;
}

export interface SlideRendererRef {
  capture: () => Promise<string>;
}

export const SlideRenderer = forwardRef<SlideRendererRef, SlideRendererProps>(
  ({ slide, width = EXPORT_WIDTH, height = EXPORT_HEIGHT }, ref) => {
    const viewRef = useRef<View>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);

    useEffect(() => {
      const loadPresignedUrl = async () => {
        try {
          console.log('SlideRenderer: Loading presigned URL for:', slide.imageUrl);
          const url = await apiService.getPresignedUrl(slide.imageUrl);
          console.log('SlideRenderer: Got presigned URL:', url);
          
          // Prefetch the image to ensure it's cached before rendering
          console.log('SlideRenderer: Prefetching image...');
          await Image.prefetch(url);
          console.log('SlideRenderer: Image prefetched successfully');
          
          setPresignedUrl(url);
        } catch (error) {
          console.error('SlideRenderer: Failed to get presigned URL or prefetch:', error);
          setImageError(true);
        }
      };

      if (slide.imageUrl) {
        loadPresignedUrl();
      }
    }, [slide.imageUrl]);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!viewRef.current) {
          throw new Error('View ref not available');
        }
        
        // Wait for presigned URL and image to load before capturing (with timeout)
        if (!presignedUrl || (!imageLoaded && !imageError)) {
          console.log('SlideRenderer: Waiting for presigned URL and image to load...');
          const maxWaitTime = 15000; // 15 seconds timeout
          const startTime = Date.now();
          
          await new Promise((resolve, reject) => {
            const checkLoaded = () => {
              if (presignedUrl && imageLoaded) {
                console.log('SlideRenderer: Image loaded successfully, proceeding with capture');
                resolve(true);
              } else if (imageError) {
                console.log('SlideRenderer: Image failed to load, but capturing anyway');
                resolve(true); // Still try to capture, might show fallback
              } else if (Date.now() - startTime > maxWaitTime) {
                console.log('SlideRenderer: Image loading timeout, proceeding with capture anyway');
                resolve(true); // Timeout, but still try to capture
              } else {
                setTimeout(checkLoaded, 100);
              }
            };
            checkLoaded();
          });
        }
        
        try {
          console.log('SlideRenderer: Capturing slide...');
          
          // Add a small delay to ensure the view is fully rendered
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const uri = await captureRef(viewRef.current, {
            format: 'jpg',
            quality: 0.9,
            width,
            height,
            snapshotContentContainer: false,
          });
          console.log('SlideRenderer: Capture successful:', uri);
          return uri;
        } catch (error) {
          console.error('SlideRenderer: Failed to capture slide:', error);
          throw error;
        }
      },
    }));

    const getTextStyle = () => {
      const resolutionScale = calculateResolutionScale(width, screenWidth);
      return {
        ...getReactNativeTextStyle(slide.textStyle, slide.textScale, resolutionScale),
        maxWidth: width * 0.8,
      };
    };

    const getTextContainerStyle = () => {
      // Calculate text background dimensions first
      const resolutionScale = calculateResolutionScale(width, screenWidth);
      const textBackground = calculateTextBackground(
        slide.text || '',
        calculateFontSize(
          slide.textStyle?.fontSize || 24,
          slide.textScale || 1,
          resolutionScale
        ),
        width,
        resolutionScale,
        undefined, // No Canvas context available on mobile
        3 // Match React Native numberOfLines={3}
      );

      // Use shared transformation logic with container dimensions for exact centering
      const transform = calculateElementTransform(
        {
          x: slide.textPosition?.x || 0.5,
          y: slide.textPosition?.y || 0.25,
          scale: slide.textScale || 1,
          rotation: slide.textRotation || 0
        },
        width,
        height,
        textBackground.width,
        textBackground.height
      );

      // Use shared background styling
      const backgroundStyle = getReactNativeBackgroundStyle(slide.textStyle, resolutionScale);

      return {
        position: 'absolute' as const,
        left: transform.translateX,        // Use shared transform coordinates
        top: transform.translateY,         // Use shared transform coordinates
        transform: [
          { scaleX: transform.scaleX },    // Apply shared scaling
          { scaleY: transform.scaleY },    // Apply shared scaling
          { rotate: `${transform.rotation}deg` }, // Apply shared rotation
        ],
        ...backgroundStyle,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: width * 0.8,
      };
    };

    return (
      <View
        ref={viewRef}
        style={{
          width,
          height,
          backgroundColor: colors.background,
          position: 'relative',
        }}
      >
        {/* Background Image */}
        {presignedUrl ? (
          <Image
            source={{ uri: presignedUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
            onLoad={() => {
              console.log('SlideRenderer: Image loaded successfully');
              // Add a small delay to ensure the image is fully rendered
              setTimeout(() => {
                setImageLoaded(true);
                setImageError(false);
              }, 100);
            }}
            onError={(error) => {
              console.error('SlideRenderer: Image failed to load:', error);
              setImageLoaded(false);
              setImageError(true);
            }}
          />
        ) : (
          <View style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: colors.muted }}>Loading...</Text>
          </View>
        )}

        {/* Text Overlay */}
        {slide.text && (
          <View style={getTextContainerStyle()}>
            <Text style={getTextStyle()} numberOfLines={3}>
              {slide.text}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

SlideRenderer.displayName = 'SlideRenderer';