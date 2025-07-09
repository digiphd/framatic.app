import sharp from 'sharp';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  removeMetadata?: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
  originalSize: number;
  compressionRatio: number;
}

export class ImageProcessor {
  private static instance: ImageProcessor;

  public static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  private constructor() {}

  async processImage(
    inputBuffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1080,
      maxHeight = 1920,
      quality = 80,
      format = 'jpeg',
      removeMetadata = true
    } = options;

    try {
      const originalSize = inputBuffer.length;
      
      // Get original image info
      const metadata = await sharp(inputBuffer).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // Process the image
      let processor = sharp(inputBuffer);

      // Remove metadata (EXIF, GPS, etc.) for privacy and size reduction
      if (removeMetadata) {
        processor = processor.withMetadata({});
      }

      // Resize if needed (maintaining aspect ratio)
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        processor = processor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert format and compress
      let outputBuffer: Buffer;
      switch (format) {
        case 'jpeg':
          outputBuffer = await processor
            .jpeg({ 
              quality,
              progressive: true,
              mozjpeg: true // Use mozjpeg for better compression
            })
            .toBuffer();
          break;
        case 'webp':
          outputBuffer = await processor
            .webp({ quality })
            .toBuffer();
          break;
        case 'png':
          outputBuffer = await processor
            .png({ 
              compressionLevel: 9,
              progressive: true
            })
            .toBuffer();
          break;
        default:
          outputBuffer = await processor
            .jpeg({ quality })
            .toBuffer();
      }

      // Get final image info
      const finalMetadata = await sharp(outputBuffer).metadata();
      const finalWidth = finalMetadata.width || 0;
      const finalHeight = finalMetadata.height || 0;

      return {
        buffer: outputBuffer,
        format,
        size: outputBuffer.length,
        dimensions: {
          width: finalWidth,
          height: finalHeight
        },
        originalSize,
        compressionRatio: Math.round((1 - outputBuffer.length / originalSize) * 100)
      };

    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processForTikTok(inputBuffer: Buffer): Promise<ProcessedImage> {
    // TikTok-optimized processing
    return this.processImage(inputBuffer, {
      maxWidth: 1080,
      maxHeight: 1920,
      quality: 85,
      format: 'jpeg',
      removeMetadata: true
    });
  }

  async processForInstagram(inputBuffer: Buffer): Promise<ProcessedImage> {
    // Instagram-optimized processing
    return this.processImage(inputBuffer, {
      maxWidth: 1080,
      maxHeight: 1350,
      quality: 85,
      format: 'jpeg',
      removeMetadata: true
    });
  }

  async createThumbnail(inputBuffer: Buffer, size = 300): Promise<ProcessedImage> {
    // Create thumbnail for gallery view
    return this.processImage(inputBuffer, {
      maxWidth: size,
      maxHeight: size,
      quality: 70,
      format: 'jpeg',
      removeMetadata: true
    });
  }

  async processForAI(inputBuffer: Buffer): Promise<ProcessedImage> {
    // Optimize for AI analysis (smaller size, good quality)
    return this.processImage(inputBuffer, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 75,
      format: 'jpeg',
      removeMetadata: true
    });
  }

  validateImageFormat(buffer: Buffer): {
    isValid: boolean;
    format?: string;
    error?: string;
  } {
    try {
      // Check for common image formats by magic bytes
      const signatures = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
        'image/heic': [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // ftyp + heic
        'image/heif': [0x66, 0x74, 0x79, 0x70, 0x6D, 0x69, 0x66, 0x31], // ftyp + mif1
      };

      for (const [format, signature] of Object.entries(signatures)) {
        if (format === 'image/heic' || format === 'image/heif') {
          // HEIC/HEIF check at offset 4
          const heicCheck = signature.every((byte, index) => buffer[index + 4] === byte);
          if (heicCheck) {
            return { isValid: true, format };
          }
        } else {
          // Standard check at offset 0
          const matches = signature.every((byte, index) => buffer[index] === byte);
          if (matches) {
            return { isValid: true, format };
          }
        }
      }

      return {
        isValid: false,
        error: 'Unsupported image format. Please use JPEG, PNG, WebP, or HEIC/HEIF.'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate image format'
      };
    }
  }
}

export const imageProcessor = ImageProcessor.getInstance();