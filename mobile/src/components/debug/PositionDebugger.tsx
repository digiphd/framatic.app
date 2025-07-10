import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { colors, spacing } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface PositionDebuggerProps {
  textPosition: { x: number; y: number };
  slideWidth: number;
  slideHeight: number;
  title: string;
}

export function PositionDebugger({ textPosition, slideWidth, slideHeight, title }: PositionDebuggerProps) {
  const [absolutePos, setAbsolutePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Calculate absolute position the same way DraggableText does
    const isRelative = textPosition.x <= 1 && textPosition.y <= 1;
    const absPos = isRelative 
      ? { x: textPosition.x * slideWidth, y: textPosition.y * slideHeight }
      : textPosition;
    setAbsolutePos(absPos);
  }, [textPosition, slideWidth, slideHeight]);

  return (
    <View style={{
      position: 'absolute',
      top: 50,
      left: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: spacing.sm,
      borderRadius: 8,
      zIndex: 9999,
    }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>{title}</Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Screen: {screenWidth}px
      </Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Slide: {slideWidth.toFixed(1)} x {slideHeight.toFixed(1)}
      </Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Aspect: {(slideWidth / slideHeight).toFixed(3)}
      </Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Relative: ({textPosition.x.toFixed(3)}, {textPosition.y.toFixed(3)})
      </Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Absolute: ({absolutePos.x.toFixed(1)}, {absolutePos.y.toFixed(1)})
      </Text>
      <Text style={{ color: colors.text, fontSize: 10 }}>
        Server would be: ({(textPosition.x * 1080).toFixed(1)}, {(textPosition.y * 1920).toFixed(1)})
      </Text>
    </View>
  );
}