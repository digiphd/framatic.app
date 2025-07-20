import React, { useState, useRef, useCallback } from 'react';
import { Text, View, LayoutChangeEvent } from 'react-native';
import { spacing, borderRadius } from '../../styles/theme';

interface AutoWrappingTextProps {
  children: React.ReactNode;
  style?: any;
  backgroundColor?: string;
  maxWidth?: number;
}

/**
 * AutoWrappingText component that automatically detects line breaks in React Native text
 * and creates individual backgrounds for each line (Story Mode staircase effect)
 */
export function AutoWrappingText({ 
  children, 
  style = {}, 
  backgroundColor = 'rgba(255, 255, 255, 1.0)',
  maxWidth 
}: AutoWrappingTextProps) {
  const text = typeof children === 'string' ? children : '';
  const [lines, setLines] = useState<string[]>([]);
  const [textMeasured, setTextMeasured] = useState(false);
  
  // Use a hidden text component to measure line breaks
  const onTextLayout = useCallback((event: any) => {
    const { lines: textLines } = event.nativeEvent;
    
    if (textLines && textLines.length > 0) {
      // Extract the actual text for each line
      const extractedLines = textLines.map((line: any) => {
        // Get the text for this line based on the character range
        const startIndex = line.ascender || 0;
        const endIndex = line.capHeight || text.length;
        return text.substring(startIndex, endIndex).trim();
      });
      
      // Filter out empty lines
      const filteredLines = extractedLines.filter((line: string) => line.length > 0);
      
      if (filteredLines.length > 0) {
        setLines(filteredLines);
        setTextMeasured(true);
      }
    }
  }, [text]);
  
  // Fallback: split by manual line breaks if automatic measurement fails
  const manualLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Use measured lines if available, otherwise fall back to manual splitting
  const displayLines = textMeasured && lines.length > 0 ? lines : manualLines;
  
  if (displayLines.length === 0) {
    return null;
  }
  
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Hidden text for measuring line breaks */}
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
      
      {/* Render each line with its own background */}
      {displayLines.map((line, index) => (
        <View
          key={index}
          style={{
            backgroundColor,
            marginVertical: 1,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs / 2,
            borderRadius: borderRadius.sm,
            alignSelf: 'center',
          }}
        >
          <Text
            style={{
              ...style,
              textAlign: 'center',
              backgroundColor: 'transparent',
            }}
          >
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}