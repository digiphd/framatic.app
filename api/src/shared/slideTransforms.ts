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
  ctx?: CanvasRenderingContext2D,
  maxLines: number = 3,
  textStyle?: TextStyle
): {
  width: number;
  height: number;
  paddingH: number;
  paddingV: number;
  radius: number;
  lines: string[];
} {
  // Use shared constants for consistency
  const paddingH = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.HORIZONTAL * resolutionScale;
  const paddingV = TEXT_STYLE_CONSTANTS.BACKGROUND_PADDING.VERTICAL * resolutionScale;
  const radius = TEXT_STYLE_CONSTANTS.BACKGROUND_RADIUS * resolutionScale;
  
  // Apply text transformation for accurate measurement
  const transformedText = applyTextTransform(text, textStyle?.textTransform);
  
  let textWidth: number;
  let lines: string[] = [transformedText]; // Default to single line
  
  if (ctx) {
    // Calculate max width for text (60% of canvas, matching React Native)
    const maxTextWidth = canvasWidth * 0.6;
    
    // Get wrapped lines with transformed text
    lines = wrapText(ctx, transformedText, maxTextWidth, maxLines);
    
    // Find the widest line for background width
    textWidth = Math.max(
      ...lines.map(line => ctx.measureText(line).width),
      fontSize * 2 // Minimum width
    );
  } else {
    // Fallback estimation that's more accurate for emojis
    // Emojis are typically wider than regular characters
    const emojiCount = (transformedText.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    const regularCharCount = transformedText.length - emojiCount;
    
    // Emojis are roughly 1.2x wider than regular characters
    textWidth = (regularCharCount * fontSize * 0.6) + (emojiCount * fontSize * 0.72);
    
    // Ensure minimum width and respect maximum width
    textWidth = Math.max(textWidth, fontSize * 2); // Minimum 2 character widths
    textWidth = Math.min(textWidth, canvasWidth * 0.8); // Maximum 80% of canvas
  }
  
  // Calculate height based on number of lines
  const lineHeight = fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
  const textHeight = lines.length * lineHeight;
  
  return {
    width: textWidth + (paddingH * 2),
    height: textHeight + (paddingV * 2),
    paddingH,
    paddingV,
    radius,
    lines
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
  DEFAULT_FONT_FAMILY: 'Arial, sans-serif', // Simplified for stability
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
 * Get Canvas context styling for server-side rendering with emoji support
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
  
  // Use fonts compatible with node-canvas-with-twemoji-and-discord-emoji
  // This library should handle emoji rendering automatically
  const fontFamilies = [
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"', 
    '"Noto Color Emoji"',
    '"Twemoji Mozilla"',
    'Arial',
    'sans-serif'
  ];
  
  const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamilies.join(', ')}`;
  ctx.font = fontString;
  
  console.log('Canvas font set to (with Twemoji support):', fontString);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Use getTextColors to ensure proper contrast for white backgrounds
  const { textColor } = getTextColors(textStyle);
  ctx.fillStyle = textColor;
  
  // Try to enable better text rendering
  if ('textRendering' in ctx) {
    (ctx as any).textRendering = 'geometricPrecision';
  }
}

/**
 * Wrap text to fit within specified width, respecting manual line breaks
 */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  // First, split by manual line breaks to respect user-entered newlines
  const manualLines = text.split(/\n/);
  const finalLines: string[] = [];
  
  for (const manualLine of manualLines) {
    // If we've already reached maxLines, stop processing (skip if maxLines is 0 = unlimited)
    if (maxLines > 0 && finalLines.length >= maxLines) {
      break;
    }
    
    // If the manual line is empty, add it as is
    if (manualLine.trim() === '') {
      finalLines.push('');
      continue;
    }
    
    // Auto-wrap each manual line if it's too long
    const words = manualLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        // Current line would be too long, start a new line
        finalLines.push(currentLine);
        currentLine = word;
        
        // Check if we've reached max lines (skip if maxLines is 0 = unlimited)
        if (maxLines > 0 && finalLines.length >= maxLines) {
          // Truncate last line if it would exceed maxLines
          if (finalLines.length === maxLines) {
            const lastLine = finalLines[finalLines.length - 1];
            const truncated = truncateTextToWidth(ctx, lastLine + '...', maxWidth);
            finalLines[finalLines.length - 1] = truncated;
          }
          break;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    // Add the last line from this manual line if we haven't exceeded maxLines (or unlimited)
    if (currentLine && (maxLines === 0 || finalLines.length < maxLines)) {
      finalLines.push(currentLine);
    }
  }
  
  return finalLines;
}

/**
 * Truncate text to fit within specified width
 */
function truncateTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  // Binary search for the longest text that fits
  let left = 0;
  let right = text.length;
  
  while (left < right) {
    const mid = Math.floor((left + right + 1) / 2);
    const truncated = text.substring(0, mid);
    
    if (ctx.measureText(truncated).width <= maxWidth) {
      left = mid;
    } else {
      right = mid - 1;
    }
  }
  
  return text.substring(0, left);
}

/**
 * Apply text transformation matching React Native textTransform
 */
function applyTextTransform(text: string, transform?: string): string {
  if (!transform || transform === 'none') return text;
  
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, char => char.toUpperCase());
    default:
      return text;
  }
}

/**
 * Detect emojis in text and return segments with metadata
 */
function parseTextWithEmojis(text: string): Array<{
  content: string;
  isEmoji: boolean;
  codepoint?: string;
}> {
  const segments: Array<{content: string; isEmoji: boolean; codepoint?: string}> = [];
  
  // Enhanced emoji regex pattern
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/gu;
  
  let lastIndex = 0;
  let match;
  
  while ((match = emojiRegex.exec(text)) !== null) {
    // Add text before emoji
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        segments.push({
          content: textBefore,
          isEmoji: false
        });
      }
    }
    
    // Add emoji with codepoint
    const emoji = match[0];
    const codepoint = emoji.codePointAt(0)?.toString(16).padStart(4, '0').toLowerCase();
    segments.push({
      content: emoji,
      isEmoji: true,
      codepoint: codepoint
    });
    
    lastIndex = emojiRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      segments.push({
        content: remainingText,
        isEmoji: false
      });
    }
  }
  
  return segments;
}

/**
 * Get emoji image URL from codepoint (trying different emoji styles)
 */
function getEmojiImageUrl(codepoint: string): string {
  // Try multiple emoji sources for better compatibility
  // Option 1: Noto Emoji (Google's emoji set, closer to Android/modern style)
  // return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/128/emoji_u${codepoint}.png`;
  
  // Option 2: Twemoji (Twitter's emoji set)
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codepoint}.png`;
  
  // Option 3: EmojiOne/JoyPixels (fallback)
  // return `https://cdn.jsdelivr.net/emojione/assets/4.0/png/64/${codepoint}.png`;
}

/**
 * Draw mixed text and emoji content with actual emoji images
 */
async function drawMixedContent(
  ctx: CanvasRenderingContext2D,
  segments: Array<{content: string; isEmoji: boolean; codepoint?: string}>,
  x: number,
  y: number,
  fontSize: number,
  textStyle: TextStyle = {},
  resolutionScale: number = 1,
  loadImage?: (url: string) => Promise<any>
): Promise<void> {
  const backgroundMode = textStyle.backgroundMode || 'none';
  
  // Calculate total width first for centering
  let totalWidth = 0;
  for (const segment of segments) {
    if (segment.isEmoji) {
      totalWidth += fontSize; // Emoji size = fontSize
    } else {
      totalWidth += ctx.measureText(segment.content).width;
    }
  }
  
  console.log('Mixed content total width:', totalWidth, 'at position x:', x);
  
  // Start from left edge for center alignment
  let currentX = x - (totalWidth / 2);
  
  console.log('Starting currentX:', currentX, 'segments:', segments.length);
  
  for (const segment of segments) {
    if (segment.isEmoji && segment.codepoint && loadImage) {
      try {
        // Load and draw actual emoji image
        const emojiUrl = getEmojiImageUrl(segment.codepoint);
        console.log(`Loading emoji image: ${segment.content} from ${emojiUrl}`);
        
        const emojiImage = await loadImage(emojiUrl);
        
        // Draw emoji image at correct size and position
        const emojiSize = fontSize * 0.9; // Slightly smaller than text for better alignment
        const emojiX = currentX;
        const emojiY = y - (emojiSize / 2); // Center vertically with text baseline
        
        console.log(`Drawing emoji at: x=${emojiX}, y=${emojiY}, size=${emojiSize}`);
        
        ctx.drawImage(emojiImage, emojiX, emojiY, emojiSize, emojiSize);
        currentX += emojiSize;
        
      } catch (error) {
        console.error('Failed to load emoji image:', error);
        // Fallback to text rendering without color (will show as shape)
        ctx.save();
        // Use getTextColors to ensure proper contrast for white backgrounds
  const { textColor } = getTextColors(textStyle);
  ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px Arial, sans-serif`; // Use regular font to avoid emoji coloring
        
        // Draw a simple placeholder symbol
        ctx.fillText('●', currentX, y); // Circle as emoji placeholder
        currentX += ctx.measureText('●').width;
        ctx.restore();
      }
    } else {
      // Draw regular text with shadow
      if (backgroundMode !== 'white') {
        ctx.save();
        ctx.fillStyle = TEXT_STYLE_CONSTANTS.TEXT_SHADOW.COLOR;
        ctx.fillText(
          segment.content, 
          currentX + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_X * resolutionScale),
          y + (TEXT_STYLE_CONSTANTS.TEXT_SHADOW.OFFSET_Y * resolutionScale)
        );
        ctx.restore();
      }
      
      // Draw main text
      // Use getTextColors to ensure proper contrast for white backgrounds
  const { textColor } = getTextColors(textStyle);
  ctx.fillStyle = textColor;
      const textWidth = ctx.measureText(segment.content).width;
      console.log(`Drawing text "${segment.content}" at: x=${currentX}, y=${y}, width=${textWidth}`);
      ctx.fillText(segment.content, currentX, y);
      currentX += textWidth;
    }
  }
}

/**
 * Draw text with shadow and wrapping on Canvas (matching React Native behavior)
 */
export async function drawCanvasTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  textStyle: TextStyle = {},
  resolutionScale: number = 1,
  maxWidth?: number,
  maxLines: number = 3,
  loadImage?: (url: string) => Promise<any>,
  fillTextWithTwemoji?: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number) => Promise<void>
): Promise<void> {
  const backgroundMode = textStyle.backgroundMode || 'none';
  
  // Apply text transformation first
  const transformedText = applyTextTransform(text, textStyle.textTransform);
  
  // For viral TikTok style, create a true text outline using stroke
  const outlineWidth = 1.5 * resolutionScale;
  
  // If no maxWidth specified, draw single line (backward compatibility)
  if (!maxWidth) {
    // For per-line mode, draw background for single line (all corners rounded)
    if (backgroundMode === 'per_line') {
      ctx.save();
      
      // Measure the text width
      const textMetrics = ctx.measureText(transformedText);
      const textWidth = textMetrics.width;
      const padding = 16 * resolutionScale;
      const paddingV = 8 * resolutionScale; // Increased padding to prevent descender clipping
      const radius = 8 * resolutionScale;
      
      // Get font size for height calculation
      const fontSize = calculateFontSize(
        textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
        1,
        resolutionScale
      );
      
      // Get background color for per-line mode
      const { backgroundColor } = getTextColors(textStyle);
      
      // Draw individual rounded rectangle background for single line (all corners rounded)
      const bgX = x - (textWidth / 2) - padding;
      const bgY = y - (fontSize / 2) - paddingV;
      const bgWidth = textWidth + (padding * 2);
      const bgHeight = fontSize + (paddingV * 2);
      
      ctx.fillStyle = backgroundColor;
      
      // For single line, all corners are rounded (TikTok-style flowing effect)
      ctx.beginPath();
      ctx.moveTo(bgX + radius, bgY);
      ctx.lineTo(bgX + bgWidth - radius, bgY);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
      ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
      ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
      ctx.lineTo(bgX + radius, bgY + bgHeight);
      ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
      ctx.lineTo(bgX, bgY + radius);
      ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    // Draw black outline for viral effect using multiple fill positions (except white/per_line background modes)
    else if (backgroundMode !== 'white' && backgroundMode !== 'per_line') {
      ctx.save();
      ctx.fillStyle = '#000000';
      
      // Create solid outline by drawing black text at multiple offset positions
      const offsets = [
        { x: -outlineWidth, y: -outlineWidth },
        { x: 0, y: -outlineWidth },
        { x: outlineWidth, y: -outlineWidth },
        { x: -outlineWidth, y: 0 },
        { x: outlineWidth, y: 0 },
        { x: -outlineWidth, y: outlineWidth },
        { x: 0, y: outlineWidth },
        { x: outlineWidth, y: outlineWidth },
      ];
      
      console.log('Drawing text outline using fill method - outlineWidth:', outlineWidth);
      
      for (const offset of offsets) {
        if (fillTextWithTwemoji) {
          await fillTextWithTwemoji(ctx, transformedText, x + offset.x, y + offset.y);
        } else {
          ctx.fillText(transformedText, x + offset.x, y + offset.y);
        }
      }
      
      ctx.restore();
    }
    
    // Draw main text
    const { textColor } = getTextColors(textStyle);
    ctx.fillStyle = textColor;
    
    if (fillTextWithTwemoji) {
      await fillTextWithTwemoji(ctx, transformedText, x, y);
    } else {
      ctx.fillText(transformedText, x, y);
    }
    return;
  }
  
  // Wrap text to match React Native behavior (apply transformation after wrapping)
  const lines = wrapText(ctx, transformedText, maxWidth, maxLines);
  
  if (lines.length === 0) return;
  
  // Calculate line height (matching React Native lineHeight)
  const fontSize = calculateFontSize(
    textStyle.fontSize || TEXT_STYLE_CONSTANTS.DEFAULT_FONT_SIZE,
    1, // textScale should be applied before this function
    resolutionScale
  );
  // Increase line height for per_line backgrounds to prevent overlap
  const baseLineHeight = fontSize * TEXT_STYLE_CONSTANTS.DEFAULT_LINE_HEIGHT_RATIO;
  const lineHeight = backgroundMode === 'per_line' ? baseLineHeight * 1.4 : baseLineHeight;
  
  // Calculate starting Y position for centered multi-line text
  const totalHeight = lines.length * lineHeight;
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  // Measure all line widths first for conditional corner logic
  const lineWidths: number[] = [];
  if (backgroundMode === 'per_line') {
    for (const line of lines) {
      const lineMetrics = ctx.measureText(line);
      lineWidths.push(lineMetrics.width);
    }
  }

  // Draw each line with proper background and text
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const lineY = startY + (index * lineHeight);
    
    // For per-line mode, draw individual background with TikTok-style conditional corners
    if (backgroundMode === 'per_line') {
      ctx.save();
      
      const lineWidth = lineWidths[index];
      const padding = 16 * resolutionScale; // Match React Native padding
      const paddingV = 8 * resolutionScale; // Increased padding to prevent descender clipping
      const radius = 8 * resolutionScale;
      
      // Simple rounded corners for all lines - clean and readable approach
      const topLeftRounded = true;
      const topRightRounded = true;
      const bottomLeftRounded = true;
      const bottomRightRounded = true;
      
      // Get background color for per-line mode
      const { backgroundColor } = getTextColors(textStyle);
      
      // Draw individual background with conditional rounded corners
      const bgX = x - (lineWidth / 2) - padding;
      const bgY = lineY - (fontSize / 2) - paddingV;
      const bgWidth = lineWidth + (padding * 2);
      const bgHeight = fontSize + (paddingV * 2);
      
      ctx.fillStyle = backgroundColor;
      
      // Draw path with conditional rounded corners for TikTok-style flowing effect
      ctx.beginPath();
      
      // Start at top-left corner
      if (topLeftRounded) {
        ctx.moveTo(bgX + radius, bgY);
      } else {
        ctx.moveTo(bgX, bgY);
      }
      
      // Top edge and top-right corner
      if (topRightRounded) {
        ctx.lineTo(bgX + bgWidth - radius, bgY);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
      } else {
        ctx.lineTo(bgX + bgWidth, bgY);
        ctx.lineTo(bgX + bgWidth, bgY + radius);
      }
      
      // Right edge and bottom-right corner
      if (bottomRightRounded) {
        ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
        ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
      } else {
        ctx.lineTo(bgX + bgWidth, bgY + bgHeight);
        ctx.lineTo(bgX + bgWidth - radius, bgY + bgHeight);
      }
      
      // Bottom edge and bottom-left corner
      if (bottomLeftRounded) {
        ctx.lineTo(bgX + radius, bgY + bgHeight);
        ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
      } else {
        ctx.lineTo(bgX, bgY + bgHeight);
        ctx.lineTo(bgX, bgY + bgHeight - radius);
      }
      
      // Left edge and back to start
      if (topLeftRounded) {
        ctx.lineTo(bgX, bgY + radius);
        ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
      } else {
        ctx.lineTo(bgX, bgY);
      }
      
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    } 
    // For non-per_line modes, draw outline (except white/per_line background modes)
    else if (backgroundMode !== 'white' && backgroundMode !== 'per_line') {
      ctx.save();
      ctx.fillStyle = '#000000';
      
      // Create solid outline by drawing black text at multiple offset positions
      const offsets = [
        { x: -outlineWidth, y: -outlineWidth },
        { x: 0, y: -outlineWidth },
        { x: outlineWidth, y: -outlineWidth },
        { x: -outlineWidth, y: 0 },
        { x: outlineWidth, y: 0 },
        { x: -outlineWidth, y: outlineWidth },
        { x: 0, y: outlineWidth },
        { x: outlineWidth, y: outlineWidth },
      ];
      
      for (const offset of offsets) {
        if (fillTextWithTwemoji) {
          await fillTextWithTwemoji(ctx, line, x + offset.x, lineY + offset.y);
        } else {
          ctx.fillText(line, x + offset.x, lineY + offset.y);
        }
      }
      
      ctx.restore();
    }
    
    // Draw main text
    const { textColor } = getTextColors(textStyle);
    ctx.fillStyle = textColor;
    
    if (fillTextWithTwemoji) {
      await fillTextWithTwemoji(ctx, line, x, lineY);
    } else {
      ctx.fillText(line, x, lineY);
    }
  }
}