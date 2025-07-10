import { NextRequest, NextResponse } from 'next/server';
import { uploadBuffer, getPresignedUrl, extractKeyFromUrl } from '../../../../lib/r2/client';
import { 
  calculateElementTransform,
  calculateTextBackground,
  getTextColors,
  calculateFontSize,
  calculateShadowOffset,
  calculateResolutionScale,
  applyCanvasTextStyle,
  drawCanvasTextWithShadow,
  STANDARD_CANVAS
} from '../../../../shared/slideTransforms';

// Use Canvas API for server-side rendering (Skia Web has compatibility issues)
import { createCanvas, loadImage } from 'canvas';
import { fillTextWithTwemoji } from 'node-canvas-with-twemoji-and-discord-emoji';

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

interface RenderRequest {
  slides: SlideData[];
  userId: string;
  slideshowId: string;
}

const CANVAS_WIDTH = STANDARD_CANVAS.WIDTH;
const CANVAS_HEIGHT = STANDARD_CANVAS.HEIGHT;

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const { slides, userId, slideshowId } = body;

    console.log(`Starting server-side rendering for slideshow ${slideshowId}, ${slides.length} slides`);

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides provided' },
        { status: 400 }
      );
    }

    const renderedUrls: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      console.log(`Rendering slide ${i + 1}/${slides.length}: ${slide.id}`);
      console.log('Slide data:', JSON.stringify({
        id: slide.id,
        text: slide.text,
        textPosition: slide.textPosition,
        textScale: slide.textScale,
        textRotation: slide.textRotation,
        textStyle: slide.textStyle
      }, null, 2));
      
      if (slide.textStyle?.textTransform) {
        console.log('TextTransform detected:', slide.textStyle.textTransform);
      }

      try {
        // Get background image
        const key = extractKeyFromUrl(slide.imageUrl);
        const presignedUrl = await getPresignedUrl(key);
        
        // Create canvas
        const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        const ctx = canvas.getContext('2d');

        // Load and draw background image
        const backgroundImage = await loadImage(presignedUrl);
        
        // Draw background image (cover fit)
        const imgAspect = backgroundImage.width / backgroundImage.height;
        const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider than canvas
          drawHeight = CANVAS_HEIGHT;
          drawWidth = drawHeight * imgAspect;
          drawX = (CANVAS_WIDTH - drawWidth) / 2;
          drawY = 0;
        } else {
          // Image is taller than canvas
          drawWidth = CANVAS_WIDTH;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (CANVAS_HEIGHT - drawHeight) / 2;
        }
        
        ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);

        // Calculate resolution scale using shared logic
        const resolutionScale = calculateResolutionScale(CANVAS_WIDTH);

        // Mobile app now sends consistent relative coordinates (0-1 range)
        const relativePosition = slide.textPosition || { x: 0.5, y: 0.25 };
        
        console.log('Server render - Using relative position:', relativePosition);

        // Calculate text background first to get container dimensions
        const textBackground = calculateTextBackground(
          slide.text || '',
          calculateFontSize(
            slide.textStyle?.fontSize || 24,
            slide.textScale || 1,
            resolutionScale
          ),
          CANVAS_WIDTH,
          resolutionScale,
          ctx, // Pass context for accurate text measurement
          3, // Match React Native numberOfLines={3}
          slide.textStyle // Pass textStyle for transformation handling
        );

        // Use shared transformation logic with container dimensions for exact centering
        const transform = calculateElementTransform(
          {
            x: relativePosition.x,
            y: relativePosition.y,
            scale: slide.textScale || 1,
            rotation: slide.textRotation || 0
          },
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          textBackground.width,
          textBackground.height
        );

        console.log('Server render - Transform coordinates:', { translateX: transform.translateX, translateY: transform.translateY });
        console.log('Server render - Canvas dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

        // Get text colors using shared logic
        const { textColor, backgroundColor } = getTextColors(slide.textStyle);
        const backgroundMode = slide.textStyle?.backgroundMode || 'none';
        
        // Apply shared text styling to Canvas context first (needed for text measurement)
        applyCanvasTextStyle(ctx, slide.textStyle, slide.textScale || 1, resolutionScale);

        // Apply transform and draw text background if needed (must be transformed too)
        if (backgroundMode !== 'none' && slide.text) {
          ctx.save();
          
          // Apply the same transform sequence as text for consistent background positioning
          ctx.translate(transform.translateX, transform.translateY);
          ctx.translate(textBackground.width / 2, textBackground.height / 2);
          ctx.scale(transform.scaleX, transform.scaleY);
          ctx.rotate(transform.rotation * Math.PI / 180);
          ctx.translate(-textBackground.width / 2, -textBackground.height / 2);
          
          ctx.fillStyle = backgroundColor;
          
          // Draw rounded rectangle background at container origin
          const bgX = 0;
          const bgY = 0;
          
          ctx.beginPath();
          ctx.moveTo(bgX + textBackground.radius, bgY);
          ctx.lineTo(bgX + textBackground.width - textBackground.radius, bgY);
          ctx.quadraticCurveTo(bgX + textBackground.width, bgY, bgX + textBackground.width, bgY + textBackground.radius);
          ctx.lineTo(bgX + textBackground.width, bgY + textBackground.height - textBackground.radius);
          ctx.quadraticCurveTo(bgX + textBackground.width, bgY + textBackground.height, bgX + textBackground.width - textBackground.radius, bgY + textBackground.height);
          ctx.lineTo(bgX + textBackground.radius, bgY + textBackground.height);
          ctx.quadraticCurveTo(bgX, bgY + textBackground.height, bgX, bgY + textBackground.height - textBackground.radius);
          ctx.lineTo(bgX, bgY + textBackground.radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + textBackground.radius, bgY);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }

        // Apply transform and draw text if present (match React Native transform behavior)
        if (slide.text) {
          ctx.save();
          
          // In React Native, transform coordinates represent the container's top-left corner
          // But Canvas ctx.translate() moves the drawing origin to that point
          // We need to offset to make Canvas behave like React Native container positioning
          
          // React Native applies transforms around the element's center point
          // Calculate container dimensions (same as React Native)
          const containerWidth = textBackground.width;
          const containerHeight = textBackground.height;
          
          // Move to container top-left (like React Native left/top)
          ctx.translate(transform.translateX, transform.translateY);
          
          // Move to container center for rotation/scale origin (like React Native)
          ctx.translate(containerWidth / 2, containerHeight / 2);
          
          // Apply scale and rotation around container center
          ctx.scale(transform.scaleX, transform.scaleY);
          ctx.rotate(transform.rotation * Math.PI / 180);
          
          // Move back to top-left for content positioning
          ctx.translate(-containerWidth / 2, -containerHeight / 2);
          
          // Now we're positioned back at container top-left after transforms
          // Move to container center for text positioning (React Native centers text in container)
          const offsetX = containerWidth / 2;
          const offsetY = containerHeight / 2;
          
          // Use shared text drawing function with wrapping and emoji support
          const maxTextWidth = CANVAS_WIDTH * 0.8; // Match React Native maxWidth
          await drawCanvasTextWithShadow(
            ctx, 
            slide.text, 
            offsetX, 
            offsetY, 
            slide.textStyle, 
            resolutionScale,
            maxTextWidth, // Enable text wrapping
            3, // Match React Native numberOfLines={3}
            loadImage, // Pass loadImage function
            fillTextWithTwemoji // Pass emoji rendering function
          );
          
          ctx.restore();
        }

        // Convert to buffer
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });

        // Upload rendered image to R2
        const fileName = `rendered-slides-skia/${userId}/${slideshowId}/${slide.id}-${Date.now()}.jpg`;
        const uploadResult = await uploadBuffer(buffer, fileName, 'image/jpeg');

        if (uploadResult.success && uploadResult.url) {
          renderedUrls.push(uploadResult.url);
          console.log(`Successfully rendered and uploaded slide ${i + 1}`);
        } else {
          console.error(`Failed to upload rendered slide ${i + 1}:`, uploadResult.error);
          throw new Error(`Failed to upload rendered slide ${i + 1}`);
        }
      } catch (slideError) {
        console.error(`Error rendering slide ${i + 1}:`, slideError);
        throw new Error(`Failed to render slide ${i + 1}: ${slideError.message}`);
      }
    }

    console.log(`Successfully rendered ${renderedUrls.length} slides`);
    return NextResponse.json({ 
      success: true, 
      renderedUrls,
      count: renderedUrls.length,
      message: `Successfully rendered ${renderedUrls.length} slides`,
      renderingEngine: 'canvas-optimized'
    });

  } catch (error) {
    console.error('Server-side slideshow rendering failed:', error);
    return NextResponse.json({ 
      error: 'Failed to render slideshow',
      details: error.message 
    }, { status: 500 });
  }
}