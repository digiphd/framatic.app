/**
 * Shared slide transformation logic for consistent rendering across mobile and server
 * This ensures pixel-perfect consistency between mobile preview and server-side export
 */

export interface SlideTransform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface SlideElement {
  x: number;        // 0-1 relative position
  y: number;        // 0-1 relative position
  scale: number;    // Text scale multiplier
  rotation: number; // Rotation in degrees
}

export interface TextStyle {
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textTransform?: string;
  letterSpacing?: number;
  backgroundColor?: string;
  backgroundMode?: 'none' | 'half' | 'full' | 'white';
}

export interface SlideRenderConfig {
  width: number;
  height: number;
  resolutionScale: number;
}

/**
 * Calculate element transform using the EXACT same logic as mobile
 * This is the core function that ensures consistency
 */
export function calculateElementTransform(
  element: SlideElement,
  canvasWidth: number,
  canvasHeight: number
): SlideTransform {
  // Convert relative coordinates (0-1) to absolute pixel coordinates
  // This matches how DraggableText positions elements using raw coordinates
  const baseX = element.x * canvasWidth;
  const baseY = element.y * canvasHeight;
  
  return {
    translateX: baseX,  // Use raw coordinates directly (no offset)
    translateY: baseY,  // Use raw coordinates directly (no offset)
    scaleX: element.scale,
    scaleY: element.scale,
    rotation: element.rotation
  };
}

/**
 * Calculate text background dimensions with consistent padding
 */
export function calculateTextBackground(
  text: string,
  fontSize: number,
  canvasWidth: number,
  resolutionScale: number = 1
): {
  width: number;
  height: number;
  paddingH: number;
  paddingV: number;
  radius: number;
} {
  // Use shared constants for consistency
  const paddingH = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale;
  const paddingV = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale;
  const radius = TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale;
  
  // Estimate text width (this should match mobile's measurement)
  // In production, you'd use actual text measurement
  const estimatedTextWidth = Math.min(text.length * fontSize * 0.6, canvasWidth * 0.8);
  
  return {
    width: estimatedTextWidth + (paddingH * 2),
    height: fontSize + (paddingV * 2),
    paddingH,
    paddingV,
    radius
  };
}

/**
 * Get consistent text colors based on background mode
 */
export function getTextColors(textStyle?: TextStyle): {
  textColor: string;
  backgroundColor: string;
} {
  const textColor = textStyle?.color || '#FFFFFF';
  const backgroundMode = textStyle?.backgroundMode || 'none';
  
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
  
  return { textColor, backgroundColor };
}

/**
 * Calculate font size with consistent scaling
 */
export function calculateFontSize(
  baseSize: number,
  textScale: number,
  resolutionScale: number = 1
): number {
  return baseSize * textScale * resolutionScale;
}

/**
 * Calculate shadow offset with consistent scaling
 */
export function calculateShadowOffset(resolutionScale: number = 1): number {
  return TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale;
}

/**
 * Standard canvas dimensions for TikTok format
 */
export const STANDARD_CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1920,
  ASPECT_RATIO: 1080 / 1920
};

/**
 * Calculate resolution scale based on target output vs typical mobile width
 */
export function calculateResolutionScale(targetWidth: number, mobileWidth: number = 375): number {
  return targetWidth / mobileWidth;
}

/**
 * Standard text styling constants for perfect consistency
 */
export const TEXT_STYLE_CONSTANTS = {
  DEFAULT_FONT_SIZE: 24,
  DEFAULT_FONT_FAMILY: 'Arial, sans-serif',
  DEFAULT_FONT_WEIGHT: 'bold',
  DEFAULT_COLOR: '#FFFFFF',
  DEFAULT_LINE_HEIGHT_RATIO: 1.2,
  TEXT_SHADOW: {
    COLOR: 'rgba(0, 0, 0, 0.8)',
    OFFSET_X: 1,
    OFFSET_Y: 1,
    BLUR_RADIUS: 2,
  },
  BACKGROUND_PADDING: {
    HORIZONTAL: 16,
    VERTICAL: 8,
  },
  BACKGROUND_RADIUS: 8,
};

/**
 * Get Canvas context styling for server-side rendering
 */
export function applyCanvasTextStyle(
  ctx: CanvasRenderingContext2D,
  textStyle: TextStyle = {},
  textScale: number = 1,
  resolutionScale: number = 1
): void {
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    textScale,
    resolutionScale
  );

  // Font styling to match React Native exactly
  const fontWeight = textStyle.fontWeight || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_WEIGHT;
  const fontStyle = textStyle.fontStyle || 'normal';
  
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${TEXT_STYLE_CONSTANTS.DEFAULT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR;
}

/**
 * Draw text with shadow on Canvas (matching React Native shadow)
 */
export function drawCanvasTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  textStyle: TextStyle = {},
  resolutionScale: number = 1
): void {
  const backgroundMode = textStyle.backgroundMode || 'none';
  
  // Draw shadow if not white background mode
  if (backgroundMode !== 'white') {
    ctx.save();
    ctx.fillStyle = TEXT_STYLE_CONSTANTS.TEXT_SHADOW.COLOR;
    ctx.fillText(
      text, 
      x + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale),
      y + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_Y * resolutionScale)
    );
    ctx.restore();
  }
  
  // Draw main text
  ctx.fillStyle = textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR;
  ctx.fillText(text, x, y);
}

/**
 * Standard text styling constants for perfect consistency
 */
export const TEXT_STYLE_CONSTANTS = {
  DEFAULT_FONT_SIZE: 24,
  DEFAULT_FONT_FAMILY: 'Arial, sans-serif',
  DEFAULT_FONT_WEIGHT: 'bold',
  DEFAULT_COLOR: '#FFFFFF',
  DEFAULT_LINE_HEIGHT_RATIO: 1.2,
  TEXT_SHADOW: {
    COLOR: 'rgba(0, 0, 0, 0.8)',
    OFFSET_X: 1,
    OFFSET_Y: 1,
    BLUR_RADIUS: 2,
  },
  BACKGROUND_PADDING: {
    HORIZONTAL: 16,
    VERTICAL: 8,
  },
  BACKGROUND_RADIUS: 8,
};

/**
 * Get complete text styling for React Native
 */
export function getReactNativeTextStyle(
  textStyle: TextStyle = {},
  textScale: number = 1,
  resolutionScale: number = 1
): any {
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    textScale,
    resolutionScale
  );

  return {
    color: textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR,
    fontSize,
    fontWeight: textStyle.fontWeight || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_WEIGHT,
    fontStyle: textStyle.fontStyle || 'normal',
    textTransform: textStyle.textTransform || 'none',
    letterSpacing: textStyle.letterSpacing || 0,
    textAlign: 'center',
    textShadowColor: textStyle.backgroundMode === 'white' ? 'transparent' : TEXT_STYLE_CONSTANTS.TEXT_SHADOW.COLOR,
    textShadowOffset: { 
      width: TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale, 
      height: TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_Y * resolutionScale 
    },
    textShadowRadius: textStyle.backgroundMode === 'white' ? 0 : TEXT_STYLE_CONSTANTS.TEXT_SHADOW.BLUR_RADIUS * resolutionScale,
    lineHeight: fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO,
  };
}

/**
 * Get Canvas context styling for server-side rendering
 */
export function applyCanvasTextStyle(
  ctx: CanvasRenderingContext2D,
  textStyle: TextStyle = {},
  textScale: number = 1,
  resolutionScale: number = 1
): void {
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    textScale,
    resolutionScale
  );

  // Font styling to match React Native exactly
  const fontWeight = textStyle.fontWeight || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_WEIGHT;
  const fontStyle = textStyle.fontStyle || 'normal';
  
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${TEXT_STYLE_CONSTANTS.DEFAULT_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR;
}

/**
 * Draw text with shadow on Canvas (matching React Native shadow)
 */
export function drawCanvasTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  textStyle: TextStyle = {},
  resolutionScale: number = 1
): void {
  const backgroundMode = textStyle.backgroundMode || 'none';
  
  // Draw shadow if not white background mode
  if (backgroundMode !== 'white') {
    ctx.save();
    ctx.fillStyle = TEXT_STYLE_CONSTANTS.TEXT_SHADOW.COLOR;
    ctx.fillText(
      text, 
      x + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale),
      y + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_Y * resolutionScale)
    );
    ctx.restore();
  }
  
  // Draw main text
  ctx.fillStyle = textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR;
  ctx.fillText(text, x, y);
}

/**
 * Get background styling for React Native container
 */
export function getReactNativeBackgroundStyle(
  textStyle: TextStyle = {},
  resolutionScale: number = 1
): any {
  const { backgroundColor } = getTextColors(textStyle);
  const backgroundMode = textStyle.backgroundMode || 'none';

  if (backgroundMode === 'none') {
    return {};
  }

  return {
    backgroundColor,
    borderRadius: TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale,
    paddingHorizontal: TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale,
    paddingVertical: TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale,
  };
}