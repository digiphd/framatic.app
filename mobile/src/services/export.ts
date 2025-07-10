import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import React from 'react';
import { apiService } from './api';

interface Slide {
  id: string;
  imageUrl: string;
  text: string;
  textStyle?: any;
  textPosition?: { x: number; y: number };
  textScale?: number;
  textRotation?: number;
}

interface Slideshow {
  id: string;
  title: string;
  slides: Slide[];
  caption: string;
  hashtags: string[];
  viralScore: number;
}

export class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async exportSlideshowWithServerRendering(
    slideshow: Slideshow
  ): Promise<boolean> {
    try {
      console.log('Starting server-side rendering export for slideshow:', slideshow.title);
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos to save your slideshow.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Call server-side rendering API
      const response = await apiService.renderSlideshow(slideshow);
      
      if (!response.success || !response.renderedUrls) {
        throw new Error(response.error || 'Server rendering failed');
      }

      console.log(`Server rendered ${response.renderedUrls.length} slides`);

      let savedCount = 0;
      
      // Download and save each rendered image
      for (let i = 0; i < response.renderedUrls.length; i++) {
        const renderedUrl = response.renderedUrls[i];
        console.log(`Downloading rendered slide ${i + 1}/${response.renderedUrls.length}`);
        
        try {
          // Download the rendered image
          const localUri = await this.downloadImage(renderedUrl);
          if (localUri) {
            // Save to Camera Roll
            const asset = await MediaLibrary.createAssetAsync(localUri);
            console.log(`Successfully saved rendered slide ${i + 1}`);
            savedCount++;
            
            // Clean up temp file
            try {
              await FileSystem.deleteAsync(localUri, { idempotent: true });
            } catch (cleanupError) {
              console.log('Failed to clean up temp file:', cleanupError);
            }
          }
        } catch (slideError) {
          console.error(`Failed to save slide ${i + 1}:`, slideError);
        }
      }

      if (savedCount > 0) {
        Alert.alert(
          'Export Successful! 🎨',
          `${savedCount} of ${response.renderedUrls.length} slides with text overlays saved to your Camera Roll!`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to save rendered slides. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Server-side export failed:', error);
      Alert.alert(
        'Export Error',
        'Failed to render slideshow on server. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async exportSlideshowWithSkiaRendering(
    slideshow: Slideshow
  ): Promise<boolean> {
    try {
      console.log('Starting Skia server-side rendering export for slideshow:', slideshow.title);
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos to save your slideshow.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Call Skia server-side rendering API
      const response = await apiService.renderSlideshowWithSkia(slideshow);
      
      if (!response.success || !response.renderedUrls) {
        throw new Error(response.error || 'Skia rendering failed');
      }

      console.log(`Skia rendered ${response.renderedUrls.length} slides`);

      let savedCount = 0;
      
      // Download and save each rendered image
      for (let i = 0; i < response.renderedUrls.length; i++) {
        const renderedUrl = response.renderedUrls[i];
        console.log(`Downloading Skia-rendered slide ${i + 1}/${response.renderedUrls.length}`);
        
        try {
          // Download the rendered image
          const localUri = await this.downloadImage(renderedUrl);
          if (localUri) {
            // Save to Camera Roll
            const asset = await MediaLibrary.createAssetAsync(localUri);
            console.log(`Successfully saved Skia-rendered slide ${i + 1}`);
            savedCount++;
            
            // Clean up temp file
            try {
              await FileSystem.deleteAsync(localUri, { idempotent: true });
            } catch (cleanupError) {
              console.log('Failed to clean up temp file:', cleanupError);
            }
          }
        } catch (slideError) {
          console.error(`Failed to save Skia slide ${i + 1}:`, slideError);
        }
      }

      if (savedCount > 0) {
        Alert.alert(
          'Export Successful! 🎨✨',
          `${savedCount} of ${response.renderedUrls.length} slides with pixel-perfect text overlays saved to your Camera Roll!\n\nRendered with Skia for maximum quality.`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to save Skia-rendered slides. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Skia server-side export failed:', error);
      Alert.alert(
        'Export Error',
        'Failed to render slideshow with Skia on server. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async exportSlideshowWithTextOverlays(
    slideshow: Slideshow,
    renderSlideCallback: (slide: Slide) => Promise<string>
  ): Promise<boolean> {
    try {
      console.log('Starting export with text overlays for slideshow:', slideshow.title);
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos to save your slideshow.',
          [{ text: 'OK' }]
        );
        return false;
      }

      let savedCount = 0;
      const totalSlides = slideshow.slides.length;

      console.log(`Rendering and exporting ${totalSlides} slides with text overlays`);

      // Render and save each slide
      for (const slide of slideshow.slides) {
        try {
          console.log(`Rendering slide ${slide.id} with text overlay`);
          
          // Use the callback to render the slide with text overlay
          const renderedImageUri = await renderSlideCallback(slide);
          
          if (renderedImageUri) {
            // Save the rendered image directly to Photos
            const success = await this.saveRenderedImageToPhotos(renderedImageUri, slideshow);
            if (success) {
              savedCount++;
              console.log(`Successfully saved rendered slide ${slide.id}`);
            } else {
              console.log(`Failed to save rendered slide ${slide.id}`);
            }
          } else {
            console.log(`Failed to render slide ${slide.id}`);
          }
        } catch (error) {
          console.error('Failed to render/save slide:', slide.id, error);
        }
      }

      if (savedCount > 0) {
        Alert.alert(
          'Export Successful! 🎨',
          `${savedCount} of ${totalSlides} slides with text overlays saved to your Camera Roll!\n\nCheck your Photos app to view them!`,
          [{ text: 'Open Photos', onPress: () => {
            // Could potentially deep link to Photos app
          }}, { text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to save slides to Camera Roll. Please check:\n\n• Photos permission is enabled\n• Images are properly loaded\n• Device has storage space',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Export with text overlays failed:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while exporting. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  async saveRenderedImageToPhotos(imageUri: string, slideshow: Slideshow): Promise<boolean> {
    try {
      console.log('Saving rendered image to Camera Roll:', imageUri);

      // Save directly to Camera Roll
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      console.log('Created asset:', asset.id);
      
      // Also try to add to a custom album
      try {
        const albumName = 'Framatic';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          console.log('Creating new album:', albumName);
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          console.log('Adding to existing album:', albumName);
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        console.log('Album creation/addition failed (but main save should work):', albumError);
      }

      // Clean up the temporary rendered image
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
        console.log('Cleaned up temporary file:', imageUri);
      } catch (cleanupError) {
        console.log('Failed to clean up temporary file:', cleanupError);
      }

      console.log('Successfully saved rendered image to Camera Roll');
      return true;
    } catch (error) {
      console.error('Failed to save rendered image to photos:', error);
      return false;
    }
  }

  async exportSlideshowToPhotos(slideshow: Slideshow): Promise<boolean> {
    try {
      console.log('Starting export for slideshow:', slideshow.title);
      console.log('Slideshow slides:', slideshow.slides.map(s => ({ id: s.id, imageUrl: s.imageUrl })));
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos to save your slideshow.',
          [{ text: 'OK' }]
        );
        return false;
      }

      let savedCount = 0;
      const totalSlides = slideshow.slides.length;

      console.log(`Attempting to export ${totalSlides} slides`);

      // Save each slide as an image
      for (const slide of slideshow.slides) {
        try {
          console.log(`Processing slide ${slide.id} with URL: ${slide.imageUrl}`);
          const success = await this.saveSlideToPhotos(slide, slideshow);
          if (success) {
            savedCount++;
            console.log(`Successfully saved slide ${slide.id}`);
          } else {
            console.log(`Failed to save slide ${slide.id}`);
          }
        } catch (error) {
          console.error('Failed to save slide:', slide.id, error);
        }
      }

      if (savedCount > 0) {
        Alert.alert(
          'Export Successful! 📸',
          `${savedCount} of ${totalSlides} slides saved to your Camera Roll.\n\nCheck your Photos app to view them!`,
          [{ text: 'Open Photos', onPress: () => {
            // Could potentially deep link to Photos app
          }}, { text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to save slides to Camera Roll. Please check:\n\n• Photos permission is enabled\n• Images are properly loaded\n• Device has storage space',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Error',
        'An error occurred while exporting. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  private async saveSlideToPhotos(slide: Slide, slideshow: Slideshow): Promise<boolean> {
    try {
      // For now, we'll just save the original images
      // TODO: In the future, render the slide with text overlays
      
      if (!slide.imageUrl || slide.imageUrl.trim() === '') {
        console.log('Skipping slide with empty image URL:', slide.id);
        return false;
      }

      console.log('Saving slide to Camera Roll:', slide.imageUrl);

      // Download the image to local file system first
      const localUri = await this.downloadImage(slide.imageUrl);
      if (!localUri) {
        console.log('Failed to download image for slide:', slide.id);
        return false;
      }

      console.log('Downloaded image to:', localUri);

      // Save directly to Camera Roll (this should save to the main Photos library)
      const asset = await MediaLibrary.createAssetAsync(localUri);
      console.log('Created asset:', asset.id);
      
      // Also try to add to a custom album (optional - the main save above should work)
      try {
        const albumName = 'Framatic';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          console.log('Creating new album:', albumName);
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          console.log('Adding to existing album:', albumName);
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        console.log('Album creation/addition failed (but main save should work):', albumError);
        // Don't fail the whole operation if album creation fails
      }

      // Clean up temp file
      await FileSystem.deleteAsync(localUri, { idempotent: true });

      console.log('Successfully saved slide to Camera Roll');
      return true;
    } catch (error) {
      console.error('Failed to save slide to photos:', error);
      return false;
    }
  }

  private async downloadImage(imageUrl: string): Promise<string | null> {
    try {
      // First, check if this is an R2 URL that needs to be converted to presigned URL
      let downloadUrl = imageUrl;
      
      if (imageUrl.includes('r2://') || imageUrl.includes('r2.cloudflarestorage.com')) {
        console.log('Converting R2 URL to presigned URL:', imageUrl);
        // Use the same API service that R2Image uses
        try {
          downloadUrl = await apiService.getPresignedUrl(imageUrl);
          console.log('Got presigned URL:', downloadUrl);
          console.log('Original URL:', imageUrl);
          console.log('Presigned URL length:', downloadUrl.length);
          console.log('Is presigned URL different from original?', downloadUrl !== imageUrl);
        } catch (presignError) {
          console.error('Error getting presigned URL:', presignError);
          return null;
        }
      } else {
        console.log('Using direct URL (not R2):', imageUrl);
      }

      // Try to determine the file extension from the URL
      let fileExtension = '.jpg';
      try {
        const url = new URL(downloadUrl);
        const pathname = url.pathname;
        const lastDot = pathname.lastIndexOf('.');
        if (lastDot > 0) {
          const ext = pathname.substring(lastDot);
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase())) {
            fileExtension = ext;
          }
        }
      } catch (urlError) {
        console.log('Could not parse URL for extension, using .jpg');
      }
      
      const fileName = `framatic_slide_${Date.now()}${fileExtension}`;
      const localUri = FileSystem.cacheDirectory + fileName;

      console.log('Downloading from URL:', downloadUrl);
      console.log('Saving to local path:', localUri);

      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localUri);
      
      console.log('Download result:', downloadResult);
      
      if (downloadResult.status === 200) {
        // Verify the file was actually created
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        console.log('Downloaded file info:', fileInfo);
        
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
          return downloadResult.uri;
        } else {
          console.error('Downloaded file is empty or does not exist');
          return null;
        }
      } else {
        console.error('Download failed with status:', downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error('Image download failed:', error);
      return null;
    }
  }

  async shareSlideshow(slideshow: Slideshow): Promise<void> {
    // Create shareable text content
    const shareText = this.createShareText(slideshow);
    
    // TODO: In the future, include actual video file
    // For now, just share the text content
    
    try {
      const { Share } = require('react-native');
      await Share.share({
        message: shareText,
        title: slideshow.title,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }

  private createShareText(slideshow: Slideshow): string {
    const { title, caption, hashtags } = slideshow;
    
    let shareText = '';
    
    if (title) {
      shareText += `${title}\n\n`;
    }
    
    if (caption) {
      shareText += `${caption}\n\n`;
    }
    
    if (hashtags && hashtags.length > 0) {
      shareText += hashtags.join(' ');
    }
    
    return shareText.trim();
  }
}

export const exportService = ExportService.getInstance();