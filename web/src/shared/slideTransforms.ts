/**
 * Shared slide transformation logic for consistent rendering across mobile and web
 * This ensures pixel-perfect consistency between mobile preview and web editing
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
  textDecoration?: string;
  textAlign?: string;
  letterSpacing?: number;
  backgroundColor?: string;
  backgroundMode?: 'none' | 'half' | 'full' | 'white';
  gradient?: string[];
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
  _ctx?: any,
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
  
  // Better estimation that accounts for emojis
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const regularCharCount = text.length - emojiCount;
  
  // Emojis are roughly 1.2x wider than regular characters
  let textWidth = (regularCharCount * fontSize * 0.6) + (emojiCount * fontSize * 0.72);
  
  // Ensure minimum width and respect maximum width
  textWidth = Math.max(textWidth, fontSize * 2); // Minimum 2 character widths
  const estimatedTextWidth = Math.min(textWidth, canvasWidth * 0.8); // Maximum 80% of canvas
  
  // Calculate height based on potential multiple lines
  const lineHeight = fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
  const estimatedLines = Math.min(Math.ceil(estimatedTextWidth / (canvasWidth * 0.8)), maxLines);
  const textHeight = estimatedLines * lineHeight;
  
  return {
    width: estimatedTextWidth + (paddingH * 2),
    height: textHeight + (paddingV * 2),
    paddingH,
    paddingV,
    radius,
    lines: [text] // Simple fallback for web
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
 * Calculate resolution scale based on target output vs typical web width
 */
export function calculateResolutionScale(targetWidth: number, webWidth: number = 400): number {
  return targetWidth / webWidth;
}

/**
 * Standard text styling constants for perfect consistency
 */
export const TEXT_STYLE_CONSTANTS = {
  DEFAULT_FONT_SIZE: 24,
  DEFAULT_FONT_FAMILY: 'system-ui, -apple-system, sans-serif', // Web system font
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
 * Get complete text styling for CSS
 */
export function getCSSTextStyle(
  textStyle: TextStyle = {},
  textScale: number = 1,
  resolutionScale: number = 1
): React.CSSProperties {
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    textScale,
    resolutionScale
  );

  const baseStyle: React.CSSProperties = {
    color: textStyle.color || TEXT_STYLE_CONSTANTS.DEFAULT_COLOR,
    fontSize: `${fontSize}px`,
    fontWeight: textStyle.fontWeight || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_WEIGHT,
    fontStyle: textStyle.fontStyle || 'normal',
    textTransform: textStyle.textTransform as any || 'none',
    letterSpacing: `${textStyle.letterSpacing || 0}px`,
    textAlign: 'center',
    lineHeight: TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO,
    fontFamily: TEXT_STYLE_CONSTANTS.DEFAULT_FONT_FAMILY,
  };

  // Add text shadow unless white background
  if (textStyle.backgroundMode !== 'white') {
    baseStyle.textShadow = `${TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale}px ${TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_Y * resolutionScale}px ${TEXT_STYLE_CONSTANTS.TEXT_SHADOW.BLUR_RADIUS * resolutionScale}px ${TEXT_STYLE_CONSTANTS.TEXT_SHADOW.COLOR}`;
  }

  // Handle gradients
  if (textStyle.gradient && textStyle.gradient.length > 0) {
    baseStyle.background = `linear-gradient(45deg, ${textStyle.gradient.join(', ')})`;
    baseStyle.WebkitBackgroundClip = 'text';
    baseStyle.WebkitTextFillColor = 'transparent';
    baseStyle.backgroundClip = 'text';
  }

  return baseStyle;
}

/**
 * Get background styling for CSS container
 */
export function getCSSBackgroundStyle(
  textStyle: TextStyle = {},
  resolutionScale: number = 1
): React.CSSProperties {
  const { backgroundColor } = getTextColors(textStyle);
  const backgroundMode = textStyle.backgroundMode || 'none';

  if (backgroundMode === 'none') {
    return {};
  }

  return {
    backgroundColor,
    borderRadius: `${TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale}px`,
    padding: `${TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale}px ${TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale}px`,
  };
}