import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import { uploadBuffer, getPresignedUrl, extractKeyFromUrl } from '../../../../lib/r2/client';

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

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

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

      try {
        // Create canvas
        const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        const ctx = canvas.getContext('2d');
        
        console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
        console.log('Expected dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);
        console.log('Canvas should be 1080x1920 for TikTok format');

        // Load and draw background image
        const key = extractKeyFromUrl(slide.imageUrl);
        const presignedUrl = await getPresignedUrl(key);
        const backgroundImage = await loadImage(presignedUrl);
        
        // Draw background image (cover mode)
        const scale = Math.max(
          CANVAS_WIDTH / backgroundImage.width,
          CANVAS_HEIGHT / backgroundImage.height
        );
        const scaledWidth = backgroundImage.width * scale;
        const scaledHeight = backgroundImage.height * scale;
        const offsetX = (CANVAS_WIDTH - scaledWidth) / 2;
        const offsetY = (CANVAS_HEIGHT - scaledHeight) / 2;
        
        ctx.drawImage(backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);

        // DEBUG: Add a big red rectangle to test canvas scaling
        ctx.fillStyle = 'red';
        ctx.fillRect(100, 100, 400, 200);
        console.log('Drew red debug rectangle at (100,100) with size 400x200');
        
        // DEBUG: Add giant test text
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST TEXT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        console.log('Drew giant yellow TEST TEXT at center with 200px font');
        
        // Add text overlay if present
        if (slide.text && slide.text.trim()) {
          await renderTextOverlay(ctx, slide);
        }

        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });

        // Upload rendered image to R2
        const fileName = `rendered-slides/${userId}/${slideshowId}/${slide.id}-${Date.now()}.jpg`;
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
        throw new Error(`Failed to render slide ${i + 1}: ${slideError}`);
      }
    }

    return NextResponse.json({
      success: true,
      renderedUrls,
      count: renderedUrls.length,
      message: `Successfully rendered ${renderedUrls.length} slides`
    });

  } catch (error) {
    console.error('Server-side slideshow rendering failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render slideshow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function renderTextOverlay(ctx: CanvasRenderingContext2D, slide: SlideData) {
  const text = slide.text;
  const textStyle = slide.textStyle || {};
  const textPosition = slide.textPosition || { x: 0.5, y: 0.25 };
  const textScale = slide.textScale || 1;
  const textRotation = slide.textRotation || 0;

  console.log('=== DEBUG TEXT OVERLAY ===');
  console.log('Text:', text);
  console.log('Text position:', textPosition);
  console.log('Text style:', textStyle);
  console.log('Text scale:', textScale);
  console.log('Text rotation:', textRotation);
  console.log('Canvas dimensions:', CANVAS_WIDTH, 'x', CANVAS_HEIGHT);

  // The transforms are completely wrong. Let me simplify and fix this.
  // Let's ignore the React Native transforms and just position the text properly
  
  // Simple center positioning for debugging
  const finalX = CANVAS_WIDTH / 2;  // Center horizontally
  const finalY = CANVAS_HEIGHT / 4; // Top quarter of the image
  
  console.log('Simplified positioning - Center X:', finalX, 'Top Y:', finalY);
  console.log('Original position data was:', textPosition, 'but ignoring transforms for now');

  // Set font to match React Native exactly
  const baseFontSize = textStyle.fontSize || 24;
  const fontSize = baseFontSize * (textScale || 1);
  console.log('Font size calculation:', { baseFontSize, textScale, finalFontSize: fontSize });
  
  // React Native font sizes need to be scaled up EXTREMELY for canvas rendering
  // Even 8x scaling (192px) is too small, let's go much larger
  const canvasScaleFactor = 20; // Scale up EXTREMELY for high-res canvas
  const scaledFontSize = fontSize * canvasScaleFactor;
  console.log('EXTREMELY scaled font size for canvas:', scaledFontSize, '(should be 480px)');
  
  const fontWeight = textStyle.fontWeight || 'bold';
  
  // Map React Native font weights to CSS
  const cssWeight = fontWeight === 'bold' ? 'bold' : 
                   fontWeight === '600' ? '600' :
                   fontWeight === '500' ? '500' : 
                   fontWeight === 'normal' ? 'normal' : 'bold';
  
  ctx.font = `${cssWeight} ${scaledFontSize}px -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  console.log('Font set to:', ctx.font);

  // Save context for rotation
  ctx.save();
  ctx.translate(finalX, finalY);
  ctx.rotate((textRotation * Math.PI) / 180);

  // CRITICAL: Use consistent wrapping width for both background and text
  const textWrappingWidth = CANVAS_WIDTH * 0.6;
  const lines = wrapText(ctx, text, textWrappingWidth);
  const lineHeight = scaledFontSize * 1.2; // Match React Native lineHeight
  console.log('Text wrapping:', { textWrappingWidth, lines, lineHeight });

  // Draw background if specified - match React Native background logic exactly
  const backgroundMode = textStyle.backgroundMode || 'none';
  if (backgroundMode !== 'none') {
    // FIXED: Use EXACT text dimensions after wrapping
    let actualTextWidth;
    
    if (lines.length > 1) {
      // Multi-line: Use actual longest line width after proper wrapping
      actualTextWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    } else {
      // Single line: Use actual width
      actualTextWidth = Math.max(
        ctx.measureText(lines[0]).width,
        scaledFontSize * 2 // Minimum width
      );
    }
    
    const actualTextHeight = lines.length * lineHeight;
    
    // Match React Native padding constants exactly
    const paddingH = 16 * canvasScaleFactor; // Scale padding for high-res canvas
    const paddingV = 8 * canvasScaleFactor;
    const bgWidth = actualTextWidth + paddingH * 2;
    const bgHeight = actualTextHeight + paddingV * 2;

    console.log('Background sizing (render.ts):', {
      actualTextWidth,
      actualTextHeight,
      bgWidth,
      bgHeight,
      scaledFontSize,
      lineHeight,
      lines: lines.length
    });

    // Match React Native background colors exactly
    let backgroundColor = 'transparent';
    switch (backgroundMode) {
      case 'full':
        backgroundColor = 'rgba(0, 0, 0, 0.7)';
        break;
      case 'half':
        backgroundColor = 'rgba(0, 0, 0, 0.4)';
        break;
      case 'white':
        backgroundColor = 'rgba(255, 255, 255, 0.9)';
        break;
    }

    ctx.fillStyle = backgroundColor;
    
    // Match React Native borderRadius: 8 (scaled for canvas)
    const borderRadius = 8 * canvasScaleFactor;
    if (borderRadius > 0) {
      // Draw rounded rectangle manually for compatibility
      const x = -bgWidth / 2;
      const y = -bgHeight / 2;
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + bgWidth - borderRadius, y);
      ctx.quadraticCurveTo(x + bgWidth, y, x + bgWidth, y + borderRadius);
      ctx.lineTo(x + bgWidth, y + bgHeight - borderRadius);
      ctx.quadraticCurveTo(x + bgWidth, y + bgHeight, x + bgWidth - borderRadius, y + bgHeight);
      ctx.lineTo(x + borderRadius, y + bgHeight);
      ctx.quadraticCurveTo(x, y + bgHeight, x, y + bgHeight - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
    }
  }

  // Set text color - match React Native default or provided color
  ctx.fillStyle = textStyle.color || '#FFFFFF';

  // Remove text shadow for debugging - might be interfering with visibility
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  
  console.log('Text color:', textStyle.color || '#FFFFFF');
  console.log('Text will be drawn at position:', finalX, finalY);
  console.log('Canvas font setting:', ctx.font);

  // Draw text lines - fix the negative Y positions
  // Instead of complex centering, just draw lines starting from 0 and going down
  lines.forEach((line, index) => {
    const lineY = index * lineHeight; // Simple: start at 0, go down
    console.log('Drawing line:', line, 'at position:', 0, lineY);
    
    // Add a thick black stroke to make text more visible
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(line, 0, lineY);
    
    // Draw the white text on top
    ctx.fillText(line, 0, lineY);
  });

  // Restore context
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // First, split by manual line breaks to respect user-entered newlines
  const manualLines = text.split(/\n/);
  const finalLines: string[] = [];
  
  for (const manualLine of manualLines) {
    // If the manual line is empty, add it as is
    if (manualLine.trim() === '') {
      finalLines.push('');
      continue;
    }
    
    // Auto-wrap each manual line if it's too long
    const words = manualLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        finalLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    // Add the last line from this manual line
    if (currentLine) {
      finalLines.push(currentLine);
    }
  }
  
  return finalLines;
}