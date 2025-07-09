import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { colors } from '../../styles/theme';
import { ShimmerPlaceholder } from './ShimmerPlaceholder';

interface R2ImageProps extends Omit<ImageProps, 'source'> {
  r2Url: string;
  fallbackIcon?: string;
}

export function R2Image({ r2Url, style, onError, onLoad, fallbackIcon = 'image-outline', ...props }: R2ImageProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPresignedUrl = async () => {
      try {
        console.log('Getting presigned URL for:', r2Url);
        setLoading(true);
        setError(null);
        
        const url = await apiService.getPresignedUrl(r2Url);
        console.log('Got presigned URL:', url);
        setPresignedUrl(url);
      } catch (err) {
        console.error('Failed to get presigned URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    if (r2Url && r2Url.trim() !== '') {
      getPresignedUrl();
    } else {
      console.log('R2 URL is empty, showing error state');
      setLoading(false);
      setError('No image URL provided');
    }
  }, [r2Url]);

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    onLoad?.();
  };

  const handleImageError = (err: any) => {
    console.error('Image failed to load:', err);
    setError('Failed to load image');
    onError?.(err);
  };

  if (loading) {
    const imageStyle = Array.isArray(style) ? Object.assign({}, ...style) : style || {};
    const width = typeof imageStyle.width === 'number' ? imageStyle.width : 100;
    const height = typeof imageStyle.height === 'number' ? imageStyle.height : 150;
    
    return (
      <View style={[style, { position: 'relative' }]}>
        <ShimmerPlaceholder width={width} height={height} style={style} />
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: -10,
          marginLeft: -10,
        }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (error || !presignedUrl) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glass }]}>
        <Ionicons name={fallbackIcon as any} size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: presignedUrl }}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}