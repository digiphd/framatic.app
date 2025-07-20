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
  backgroundMode?: 'none' | 'half' | 'full' | 'white' | 'per_line';
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
  canvasHeight: number,
  containerWidth?: number,
  containerHeight?: number
): SlideTransform {
  // Convert relative coordinates (0-1) to absolute pixel coordinates
  // The coordinates represent the CENTER of the text container (matching mobile DraggableText)
  const centerX = element.x * canvasWidth;
  const centerY = element.y * canvasHeight;
  
  // Calculate top-left position from center coordinates
  // This matches exactly how DraggableText does the conversion
  const offsetX = containerWidth ? containerWidth / 2 : 0;
  const offsetY = containerHeight ? containerHeight / 2 : 0;
  
  return {
    translateX: centerX - offsetX,  // Position so container center is at desired location
    translateY: centerY - offsetY,  // Position so container center is at desired location
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
  resolutionScale: number = 1,
  ctx?: any,
  maxLines: number = 3
): {
  width: number;
  height: number;
  paddingH: number;
  paddingV: number;
  radius: number;
  lines?: string[];
} {
  // Match mobile editor's padding: paddingHorizontal: 16, paddingVertical: 8
  const paddingH = 16 * resolutionScale;
  const paddingV = 8 * resolutionScale;
  const radius = 8 * resolutionScale;
  
  // Match API width calculation exactly (60% of canvas width)
  const maxTextWidth = canvasWidth * 0.6;
  
  // Simplified width calculation to match API behavior
  // The text container should be sized to the max width for consistent wrapping
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const regularCharCount = text.length - emojiCount;
  
  // Calculate actual text width for line estimation
  const fullTextWidth = (regularCharCount * fontSize * 0.6) + (emojiCount * fontSize * 0.72);
  
  let estimatedTextWidth;
  let estimatedLines;
  
  // Check for manual line breaks first
  const manualLines = text.split(/\n/);
  if (manualLines.length > 1) {
    estimatedLines = Math.min(manualLines.length, maxLines || 999);
    // For manual breaks, use the max width to ensure consistency
    estimatedTextWidth = maxTextWidth;
  } else if (fullTextWidth > maxTextWidth) {
    // Text will wrap automatically
    estimatedLines = Math.ceil(fullTextWidth / maxTextWidth);
    estimatedLines = Math.min(estimatedLines, maxLines || 999);
    // Use max width for wrapped text to match API behavior
    estimatedTextWidth = maxTextWidth;
  } else {
    // Single line that fits
    estimatedLines = 1;
    // For short text, still constrain to reasonable width
    estimatedTextWidth = Math.min(Math.max(fullTextWidth, fontSize * 3), maxTextWidth);
  }
  
  // Calculate height based on estimated lines
  const lineHeight = fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
  const textHeight = estimatedLines * lineHeight;
  
  return {
    width: estimatedTextWidth + (paddingH * 2),
    height: textHeight + (paddingV * 2),
    paddingH,
    paddingV,
    radius,
    lines: [text] // Simple fallback for mobile
  };
}

/**
 * Get consistent text colors based on background mode
 */
export function getTextColors(textStyle?: TextStyle): {
  textColor: string;
  backgroundColor: string;
} {
  const backgroundMode = textStyle?.backgroundMode || 'none';
  
  // Use provided colors from textStyle, with smart defaults based on background
  let backgroundColor = 'transparent';
  let textColor = textStyle?.color || '#FFFFFF';
  
  switch (backgroundMode) {
    case 'full':
      backgroundColor = 'rgba(0, 0, 0, 0.7)';
      textColor = textStyle?.color || '#FFFFFF';
      break;
    case 'half':
      backgroundColor = 'rgba(0, 0, 0, 0.4)';
      textColor = textStyle?.color || '#FFFFFF';
      break;
    case 'white':
      backgroundColor = 'rgba(255, 255, 255, 1.0)';
      textColor = textStyle?.color || '#000000'; // Default to black for white backgrounds
      break;
    case 'per_line':
      // Use the backgroundColor specified in textStyle for per_line mode
      backgroundColor = textStyle?.backgroundColor || 'rgba(255, 255, 255, 1.0)';
      // Use the text color specified in textStyle
      textColor = textStyle?.color || '#000000';
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
  return 1 * resolutionScale; // Match mobile's textShadowOffset: { width: 1, height: 1 }
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
  DEFAULT_FONT_FAMILY: 'System', // React Native uses System font which includes emoji support
  DEFAULT_FONT_WEIGHT: 'bold',
  DEFAULT_COLOR: '#FFFFFF',
  DEFAULT_LINE_HEIGHT_RATIO: 1.2,
  TEXT_SHADOW: {
    COLOR: 'rgba(0, 0, 0, 0.8)',
    OFFSET_X: 2,
    OFFSET_Y: 2,
    BLUR_RADIUS: 3,
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
  resolutionScale: number = 1,
  maxWidth?: number
): any {
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    textScale,
    resolutionScale
  );

  // Simple inline white background fix for React Native (avoid function call overhead)
  const textColor = textStyle.backgroundMode === 'white' ? '#000000' : (textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR);

  return {
    color: textColor,
    fontSize,
    fontWeight: textStyle.fontWeight || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_WEIGHT,
    fontStyle: textStyle.fontStyle || 'normal',
    textTransform: textStyle.textTransform || 'none',
    letterSpacing: textStyle.letterSpacing || 0,
    textAlign: 'center',
    // No shadow needed - OutlinedText component handles the outline
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    lineHeight: fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO,
    maxWidth: maxWidth, // Add maxWidth constraint to match API behavior
  };
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

  if (backgroundMode === 'none' || backgroundMode === 'per_line') {
    return {}; // No background for per_line mode - PerLineText component handles it
  }

  return {
    backgroundColor,
    borderRadius: TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale,
    paddingHorizontal: TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale,
    paddingVertical: TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale,
  };
}