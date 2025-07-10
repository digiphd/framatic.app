import { NextRequest, NextResponse } from 'next/server';
import { uploadBuffer, getPresignedUrl, extractKeyFromUrl } from '../../../../lib/r2/client';
import { createCanvas, loadImage } from 'canvas';
import { 
  calculateElementTransform,
  calculateTextBackground,
  getTextColors,
  calculateFontSize,
  calculateShadowOffset,
  calculateResolutionScale,
  STANDARD_CANVAS
} from '../../../../shared/slideTransforms';

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
  textPosition?: {
    x: number;
    y: number;
  };
  textScale?: number;
  textRotation?: number;
}

const CANVAS_WIDTH = STANDARD_CANVAS.WIDTH;
const CANVAS_HEIGHT = STANDARD_CANVAS.HEIGHT;

export async function POST(request: NextRequest) {
  try {
    const { slides, slideshowId, userId } = await request.json();

    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'No slides provided' }, { status: 400 });
    }

    const renderedUrls: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide: SlideData = slides[i];
      console.log(`Rendering slide ${i + 1} with Canvas`);
      console.log('Slide data:', JSON.stringify({
        id: slide.id,
        text: slide.text,
        textPosition: slide.textPosition,
        textScale: slide.textScale,
        textRotation: slide.textRotation,
        textStyle: slide.textStyle
      }, null, 2));

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
        
        console.log('Canvas render - Using relative position:', relativePosition);

        // Use shared transformation logic for consistency
        const transform = calculateElementTransform(
          {
            x: relativePosition.x,
            y: relativePosition.y,
            scale: slide.textScale || 1,
            rotation: slide.textRotation || 0
          },
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );

        console.log('Canvas render - Transform coordinates:', { translateX: transform.translateX, translateY: transform.translateY });
        console.log('Canvas render - Canvas dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

        // Calculate font size using shared logic
        const fontSize = calculateFontSize(
          slide.textStyle?.fontSize || 24,
          slide.textScale || 1,
          resolutionScale
        );
        
        // Get text colors using shared logic
        const { textColor, backgroundColor } = getTextColors(slide.textStyle);
        const backgroundMode = slide.textStyle?.backgroundMode || 'none';
        
        // Calculate text background using shared logic
        const textBackground = calculateTextBackground(
          slide.text || '',
          fontSize,
          CANVAS_WIDTH,
          resolutionScale
        );
        
        // Calculate shadow offset using shared logic
        const shadowOffset = calculateShadowOffset(resolutionScale);

        // Set font for text measurement
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';  // Match mobile's center alignment
        ctx.textBaseline = 'middle'; // Match mobile's center alignment

        // Apply transform and draw text background if needed
        if (backgroundMode !== 'none' && slide.text) {
          ctx.fillStyle = backgroundColor;
          
          // Draw rounded rectangle background centered on transform position
          const bgX = transform.translateX - textBackground.width / 2;
          const bgY = transform.translateY - textBackground.height / 2;
          
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
        }

        // Apply transform and draw text if present
        if (slide.text) {
          // Apply rotation and scaling transform
          ctx.save();
          ctx.translate(transform.translateX, transform.translateY);
          ctx.scale(transform.scaleX, transform.scaleY);
          ctx.rotate(transform.rotation * Math.PI / 180);
          
          // Draw text shadow using shared offset (center aligned now)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillText(slide.text, shadowOffset, shadowOffset);
          
          // Draw main text centered at origin (after transform)
          ctx.fillStyle = textColor;
          ctx.fillText(slide.text, 0, 0);
          
          ctx.restore();
        }

        // Convert to buffer
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });

        // Upload rendered image to R2
        const fileName = `rendered-slides-canvas/${userId}/${slideshowId}/${slide.id}-${Date.now()}.jpg`;
        const uploadResult = await uploadBuffer(buffer, fileName, 'image/jpeg');

        if (uploadResult.success && uploadResult.url) {
          renderedUrls.push(uploadResult.url);
          console.log(`Successfully rendered and uploaded slide ${i + 1} with Canvas`);
        } else {
          console.error(`Failed to upload slide ${i + 1}:`, uploadResult.error);
          throw new Error(`Failed to upload slide ${i + 1}`);
        }
      } catch (error) {
        console.error(`Error rendering slide ${i + 1}:`, error);
        throw new Error(`Failed to render slide ${i + 1}: ${error.message}`);
      }
    }

    console.log(`Successfully rendered ${renderedUrls.length} slides with Canvas`);
    return NextResponse.json({ 
      success: true, 
      renderedUrls,
      message: `Successfully rendered ${renderedUrls.length} slides with Canvas`
    });

  } catch (error) {
    console.error('Canvas slideshow rendering error:', error);
    return NextResponse.json({ 
      error: 'Failed to render slideshow with Canvas',
      details: error.message 
    }, { status: 500 });
  }
}