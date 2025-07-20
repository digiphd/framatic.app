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
  wrapText,
  STANDARD_CANVAS,
  TEXT_STYLE_CONSTANTS
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
    backgroundMode?: 'none' | 'half' | 'full' | 'white' | 'per_line';
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
        const resolutionScale = calculateResolutionScale(CANVAS_WIDTH, 375); // 375 is standard mobile width

        // Mobile app now sends consistent relative coordinates (0-1 range)
        const relativePosition = slide.textPosition || { x: 0.5, y: 0.25 };
        
        console.log('Server render - Using relative position:', relativePosition);

        // Calculate initial text background for basic dimensions (will be recalculated later)
        const initialTextBackground = calculateTextBackground(
          slide.text || '',
          calculateFontSize(
            slide.textStyle?.fontSize || 24,
            slide.textScale || 1,
            resolutionScale
          ),
          CANVAS_WIDTH,
          resolutionScale,
          ctx, // Pass context for accurate text measurement
          0, // No line limit - allow full text
          slide.textStyle // Pass textStyle for transformation handling
        );

        // Get text colors using shared logic
        const { textColor, backgroundColor } = getTextColors(slide.textStyle);
        const backgroundMode = slide.textStyle?.backgroundMode || 'none';
        
        // Apply shared text styling to Canvas context first (needed for text measurement)
        applyCanvasTextStyle(ctx, slide.textStyle, slide.textScale || 1, resolutionScale);

        // CRITICAL: Define text wrapping width ONCE for both background and text
        const textWrappingWidth = CANVAS_WIDTH * 0.6; // This MUST be used consistently

        // STEP 1: Calculate correct background dimensions using actual text wrapping
        let finalBackgroundWidth = initialTextBackground.width;
        let finalBackgroundHeight = initialTextBackground.height;

        if (backgroundMode !== 'none' && backgroundMode !== 'per_line' && slide.text) {
          
          // Re-wrap text using the EXACT same parameters that drawCanvasTextWithShadow will use
          const wrappedLines = wrapText(ctx, slide.text, textWrappingWidth, 0);
          
          console.log('Background-text coordination:', {
            originalText: slide.text,
            textWrappingWidth,
            wrappedLines,
            lineCount: wrappedLines.length
          });
          
          // Calculate background size based on ACTUAL wrapped text dimensions
          let actualTextWidth;
          let actualTextHeight;
          
          if (wrappedLines.length > 1) {
            // Multi-line: Use the width that the text will actually need when wrapped
            const longestLineWidth = Math.max(...wrappedLines.map(line => ctx.measureText(line).width));
            actualTextWidth = longestLineWidth; // Use actual longest line after proper wrapping
            actualTextHeight = wrappedLines.length * calculateFontSize(
              slide.textStyle?.fontSize || 24,
              slide.textScale || 1,
              resolutionScale
            ) * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
            
            console.log('Multi-line background (synchronized):', {
              longestLineWidth,
              actualTextWidth,
              actualTextHeight,
              linesCount: wrappedLines.length
            });
          } else {
            // Single line: Use actual line width
            const singleLineWidth = ctx.measureText(wrappedLines[0]).width;
            const minWidth = calculateFontSize(slide.textStyle?.fontSize || 24, slide.textScale || 1, resolutionScale) * 2;
            actualTextWidth = Math.max(singleLineWidth, minWidth);
            actualTextHeight = calculateFontSize(
              slide.textStyle?.fontSize || 24,
              slide.textScale || 1,
              resolutionScale
            ) * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
            
            console.log('Single-line background (synchronized):', {
              singleLineWidth,
              minWidth,
              actualTextWidth,
              actualTextHeight
            });
          }
          
          // Use React Native padding constants
          const paddingH = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale;
          const paddingV = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale;
          
          const actualBgWidth = actualTextWidth + (paddingH * 2);
          const actualBgHeight = actualTextHeight + (paddingV * 2);
          
          // Store the corrected dimensions
          finalBackgroundWidth = actualBgWidth;
          finalBackgroundHeight = actualBgHeight;
          
          console.log('Background recalculation:', {
            originalBg: { width: initialTextBackground.width, height: initialTextBackground.height },
            actualBg: { width: actualBgWidth, height: actualBgHeight },
            textDimensions: { width: actualTextWidth, height: actualTextHeight },
            lines: wrappedLines.length
          });
        }

        // STEP 2: Now calculate transform using the CORRECT background dimensions
        const transform = calculateElementTransform(
          {
            x: relativePosition.x,
            y: relativePosition.y,
            scale: slide.textScale || 1,
            rotation: slide.textRotation || 0
          },
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          finalBackgroundWidth,
          finalBackgroundHeight
        );

        console.log('Server render - Transform coordinates:', { 
          translateX: transform.translateX, 
          translateY: transform.translateY,
          backgroundDimensions: { width: finalBackgroundWidth, height: finalBackgroundHeight }
        });
        console.log('Server render - Canvas dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

        // STEP 3: Draw background if needed (skip for per_line mode - handled by drawCanvasTextWithShadow)
        if (backgroundMode !== 'none' && backgroundMode !== 'per_line' && slide.text) {
          ctx.save();
          
          // Apply the same transform sequence as text for consistent background positioning
          ctx.translate(transform.translateX, transform.translateY);
          ctx.translate(finalBackgroundWidth / 2, finalBackgroundHeight / 2);
          ctx.scale(transform.scaleX, transform.scaleY);
          ctx.rotate(transform.rotation * Math.PI / 180);
          ctx.translate(-finalBackgroundWidth / 2, -finalBackgroundHeight / 2);
          
          ctx.fillStyle = backgroundColor;
          
          // Draw rounded rectangle background with correct dimensions
          const bgX = 0;
          const bgY = 0;
          const radius = TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale;
          
          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + finalBackgroundWidth - radius, bgY);
          ctx.quadraticCurveTo(bgX + finalBackgroundWidth, bgY, bgX + finalBackgroundWidth, bgY + radius);
          ctx.lineTo(bgX + finalBackgroundWidth, bgY + finalBackgroundHeight - radius);
          ctx.quadraticCurveTo(bgX + finalBackgroundWidth, bgY + finalBackgroundHeight, bgX + finalBackgroundWidth - radius, bgY + finalBackgroundHeight);
          ctx.lineTo(bgX + radius, bgY + finalBackgroundHeight);
          ctx.quadraticCurveTo(bgX, bgY + finalBackgroundHeight, bgX, bgY + finalBackgroundHeight - radius);
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
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
          // Use the CORRECT container dimensions
          const containerWidth = finalBackgroundWidth;
          const containerHeight = finalBackgroundHeight;
          
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
          // IMPORTANT: Use the SAME textWrappingWidth that we used for background calculation
          await drawCanvasTextWithShadow(
            ctx, 
            slide.text, 
            offsetX, 
            offsetY, 
            slide.textStyle, 
            resolutionScale,
            textWrappingWidth, // Use SAME width as background calculation
            0, // No line limit - allow full text
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