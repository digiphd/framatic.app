import React from 'react';
import { Text, View } from 'react-native';

interface OutlinedTextProps {
  children: React.ReactNode;
  style?: any;
  outlineColor?: string;
  outlineWidth?: number;
}

/**
 * OutlinedText component that creates a true text outline effect
 * by rendering multiple Text elements with different colors and positions
 * This creates the viral TikTok-style solid black outline around white text
 */
export function OutlinedText({ 
  children, 
  style = {}, 
  outlineColor = '#000000', 
  outlineWidth = 2 
}: OutlinedTextProps) {
  const { color: textColor, ...baseStyle } = style;
  
  // Create outline by rendering text multiple times at different positions
  const outlinePositions = [
    { x: -outlineWidth, y: -outlineWidth },
    { x: 0, y: -outlineWidth },
    { x: outlineWidth, y: -outlineWidth },
    { x: -outlineWidth, y: 0 },
    { x: outlineWidth, y: 0 },
    { x: -outlineWidth, y: outlineWidth },
    { x: 0, y: outlineWidth },
    { x: outlineWidth, y: outlineWidth },
  ];

  return (
    <View style={{ position: 'relative' }}>
      {/* Render outline text at each position */}
      {outlinePositions.map((pos, index) => (
        <Text
          key={index}
          style={{
            ...baseStyle,
            color: outlineColor,
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            textShadowColor: 'transparent', // Remove any existing shadow
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 0,
          }}
        >
          {children}
        </Text>
      ))}
      
      {/* Render main text on top */}
      <Text
        style={{
          ...baseStyle,
          color: textColor,
          textShadowColor: 'transparent', // Remove any existing shadow
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 0,
        }}
      >
        {children}
      </Text>
    </View>
  );
}