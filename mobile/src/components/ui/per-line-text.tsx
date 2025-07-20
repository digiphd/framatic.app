import React, { useMemo, useState, useCallback } from 'react';
import { Text, View } from 'react-native';
import { spacing, borderRadius } from '../../styles/theme';

interface PerLineTextProps {
  children: React.ReactNode;
  style?: any;
  backgroundStyle?: any;
  maxWidth?: number;
}

/**
 * PerLineText component that creates individual white backgrounds for each line of text
 * This creates the "staircase" effect for Story Mode where each line has its own background
 */
export function PerLineText({ 
  children, 
  style = {}, 
  backgroundStyle = {},
  maxWidth 
}: PerLineTextProps) {
  const text = typeof children === 'string' ? children : '';
  const [lines, setLines] = useState<string[]>([]);
  
  // Simple word-based wrapping estimation for React Native
  const wrappedLines = useMemo(() => {
    if (!text) return [];
    
    // First handle manual line breaks
    const manualLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // For each manual line, estimate if it needs word wrapping
    const processedLines: string[] = [];
    
    for (const line of manualLines) {
      // Simple heuristic: if line is longer than ~40 characters, try to split it
      if (line.length > 40) {
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          // Simple character-based wrapping (approximate)
          if (testLine.length > 40 && currentLine) {
            processedLines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine) {
          processedLines.push(currentLine);
        }
      } else {
        processedLines.push(line);
      }
    }
    
    return processedLines;
  }, [text]);
  
  const backgroundColor = backgroundStyle?.backgroundColor || 'rgba(255, 255, 255, 1.0)';
  
  // Use onTextLayout to get actual line information
  const onTextLayout = useCallback((event: any) => {
    const { lines: textLines } = event.nativeEvent;
    if (textLines && textLines.length > 0) {
      // Try to extract text from each line
      const extractedLines: string[] = [];
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        if (line && line.text) {
          extractedLines.push(line.text.trim());
        }
      }
      
      if (extractedLines.length > 0 && extractedLines.some(line => line.length > 0)) {
        setLines(extractedLines.filter(line => line.length > 0));
      }
    }
  }, []);
  
  // Use measured lines if available, otherwise use the estimated wrapped lines
  const displayLines = lines.length > 0 ? lines : wrappedLines;
  
  if (displayLines.length === 0) {
    return null;
  }
  
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Hidden text for measuring actual line breaks */}
      <Text
        style={{
          ...style,
          position: 'absolute',
          opacity: 0,
          maxWidth: maxWidth,
          textAlign: 'center',
        }}
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
      
      {/* Render each line with TikTok-style flowing corners based on width relationships */}
      {displayLines.map((line, index) => {
        const isFirst = index === 0;
        const isLast = index === displayLines.length - 1;
        
        // Estimate line widths for conditional corner logic
        const currentLineLength = line.length;
        const prevLineLength = index > 0 ? displayLines[index - 1].length : 0;
        const nextLineLength = index < displayLines.length - 1 ? displayLines[index + 1].length : 0;
        
        // Simple rounded corners for all lines - clean and readable
        const topLeftRounded = true;
        const topRightRounded = true;
        const bottomLeftRounded = true;
        const bottomRightRounded = true;
        
        return (
          <View
            key={index}
            style={{
              backgroundColor,
              marginVertical: 0, // Keep lines connected
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs, // Increased padding to prevent descender clipping
              // Conditional rounded corners for TikTok-style flowing effect
              borderTopLeftRadius: topLeftRounded ? borderRadius.sm : 0,
              borderTopRightRadius: topRightRounded ? borderRadius.sm : 0,
              borderBottomLeftRadius: bottomLeftRounded ? borderRadius.sm : 0,
              borderBottomRightRadius: bottomRightRounded ? borderRadius.sm : 0,
              alignSelf: 'center',
              // Ensure each line wraps to its content width
              flexShrink: 1,
            }}
          >
            <Text
              style={{
                ...style,
                textAlign: 'center',
                backgroundColor: 'transparent',
                // Remove maxWidth to let each line size naturally
              }}
              numberOfLines={1}
            >
              {line}
            </Text>
          </View>
        );
      })}
    </View>
  );
}