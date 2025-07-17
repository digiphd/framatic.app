import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { 
  getReactNativeTextStyle, 
  getReactNativeBackgroundStyle,
  calculateResolutionScale,
  calculateTextBackground,
  calculateFontSize
} from '../../shared/slideTransforms';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DraggableTextProps {
  text: string;
  style?: any;
  isEditing: boolean;
  isSelected: boolean;
  isBeingEdited?: boolean; // Hide this text if it's being edited in overlay
  onPress: () => void;
  onTextChange: (text: string, style: any, position: { x: number; y: number }, scale: number, rotation: number) => void;
  onStartTextEdit?: () => void;
  initialPosition?: { x: number; y: number };
  initialScale?: number;
  initialRotation?: number;
  slideId?: string; // Add slideId to make each instance unique
  slideWidth?: number; // Width of the slide container
  slideHeight?: number; // Height of the slide container
}

export function DraggableText({
  text,
  style = {},
  isEditing,
  isSelected,
  isBeingEdited = false,
  onPress,
  onTextChange,
  onStartTextEdit,
  initialPosition = { x: 0.5, y: 0.25 }, // Default to relative coordinates
  initialScale = 1,
  initialRotation = 0,
  slideId = 'default',
  slideWidth = screenWidth - (spacing.md * 2),
  slideHeight = (screenWidth - (spacing.md * 2)) * (16/9), // TikTok aspect ratio 9:16 (height = width * 16/9)
}: DraggableTextProps) {
  // Convert relative coordinates to absolute coordinates for internal use
  // For proper centering, we need to account for the text container size
  const convertToAbsolute = (relativePos: { x: number; y: number }) => {
    const isRelative = relativePos.x <= 1 && relativePos.y <= 1;
    if (!isRelative) return relativePos;
    
    // Calculate accurate text container dimensions using shared logic
    const resolutionScale = calculateResolutionScale(slideWidth, screenWidth);
    const fontSize = calculateFontSize(
      style?.fontSize || 24,
      scale,
      resolutionScale
    );
    
    const textBackground = calculateTextBackground(
      text || '',
      fontSize,
      slideWidth,
      resolutionScale,
      undefined, // No Canvas context on mobile
      3 // maxLines
    );
    
    // Calculate center position and then convert to top-left
    const centerX = relativePos.x * slideWidth;
    const centerY = relativePos.y * slideHeight;
    
    return { 
      x: centerX - (textBackground.width / 2), 
      y: centerY - (textBackground.height / 2)
    };
  };
  
  const [position, setPosition] = useState(convertToAbsolute(initialPosition));
  const [scale, setScale] = useState(initialScale);
  const [rotation, setRotation] = useState(initialRotation);
  const [lastOffset, setLastOffset] = useState(convertToAbsolute(initialPosition));
  const [lastScale, setLastScale] = useState(initialScale);
  const [lastRotation, setLastRotation] = useState(initialRotation);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);
  
  // Remove debounced update - we'll update only on release

  // Remove inline editing state - we'll use the overlay instead

  // Create new animated values for each slide to ensure complete isolation
  const pan = useRef<Animated.ValueXY | null>(null);
  const scaleAnim = useRef<Animated.Value | null>(null);
  const rotationAnim = useRef<Animated.Value | null>(null);
  
  // Initialize or recreate animated values when slideId changes
  if (!pan.current || !scaleAnim.current || !rotationAnim.current) {
    pan.current = new Animated.ValueXY(convertToAbsolute(initialPosition));
    scaleAnim.current = new Animated.Value(initialScale);
    rotationAnim.current = new Animated.Value(initialRotation);
  }

  // Recreate animated values when slideId changes to ensure complete isolation
  useEffect(() => {
    const absolutePosition = convertToAbsolute(initialPosition);
    pan.current = new Animated.ValueXY(absolutePosition);
    scaleAnim.current = new Animated.Value(initialScale);
    rotationAnim.current = new Animated.Value(initialRotation);
    
    setPosition(absolutePosition);
    setLastOffset(absolutePosition);
    setScale(initialScale);
    setLastScale(initialScale);
    setRotation(initialRotation);
    setLastRotation(initialRotation);
    setInitialDistance(0);
    setInitialAngle(0);
  }, [slideId]);

  // Sync internal state with props when they change (e.g., when switching slides)
  // Only reset position if it's significantly different (not from our own update)
  useEffect(() => {
    const absoluteInitialPosition = convertToAbsolute(initialPosition);
    
    // Check if the new position is significantly different from current position
    // This prevents resetting when the change comes from our own onTextChange
    const positionDiff = Math.abs(absoluteInitialPosition.x - position.x) + Math.abs(absoluteInitialPosition.y - position.y);
    
    if (positionDiff > 10) { // Only reset if position difference is > 10 pixels
      setPosition(absoluteInitialPosition);
      setLastOffset(absoluteInitialPosition);
      pan.current?.setOffset({ x: 0, y: 0 }); // Reset offset first
      pan.current?.setValue(absoluteInitialPosition); // Then set the value
    }
  }, [initialPosition.x, initialPosition.y]);

  useEffect(() => {
    setScale(initialScale);
    setLastScale(initialScale);
    scaleAnim.current?.setValue(initialScale);
    scaleAnim.current?.setOffset(0); // Reset offset
    setInitialDistance(0); // Reset gesture state
    setInitialAngle(0); // Reset gesture state
  }, [initialScale]);

  useEffect(() => {
    setRotation(initialRotation);
    setLastRotation(initialRotation);
    rotationAnim.current?.setValue(initialRotation);
    rotationAnim.current?.setOffset(0); // Reset offset
  }, [initialRotation]);

  // Remove cleanup - no more debounced updates

  // Remove inline text sync - handled by overlay

  // Calculate resolution scale for consistency
  const resolutionScale = calculateResolutionScale(slideWidth, screenWidth);
  
  const getBackgroundStyle = () => {
    return getReactNativeBackgroundStyle(style, resolutionScale);
  };

  const getTextStyle = () => {
    return getReactNativeTextStyle(style, scale, resolutionScale);
  };

  const handleTap = () => {
    if (isEditing) {
      // Show edit button instead of immediately entering edit mode
      onPress();
    } else if (!isEditing) {
      onPress();
    }
  };

  const enterEditMode = () => {
    if (onStartTextEdit) {
      onStartTextEdit();
    }
  };

  // Remove inline text submit - handled by overlay

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      // Only respond if we're in editing mode
      return isEditing;
    },
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      if (!isEditing) return false;
      // Require a longer drag distance to avoid conflicts with swipe
      return (gestureState.numberActiveTouches === 1 && 
              (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10)) ||
             gestureState.numberActiveTouches === 2;
    },
    
    onPanResponderTerminationRequest: () => false, // Don't allow termination during drag

    onPanResponderGrant: (evt, gestureState) => {
      if (!isEditing) return;
      pan.current?.setOffset({
        x: lastOffset.x,
        y: lastOffset.y,
      });
      pan.current?.setValue({ x: 0, y: 0 });
      
      // Also prepare scale and rotation
      scaleAnim.current?.setOffset(lastScale);
      scaleAnim.current?.setValue(0);
      rotationAnim.current?.setOffset(lastRotation);
      rotationAnim.current?.setValue(0);
      
      // Store initial distance and angle for two-finger gestures
      if (gestureState.numberActiveTouches === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        // Safety check for touch objects
        if (touch1 && touch2 && touch1.pageX !== undefined && touch1.pageY !== undefined && 
            touch2.pageX !== undefined && touch2.pageY !== undefined) {
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + 
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          const angle = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
          ) * (180 / Math.PI);
          
          setInitialDistance(distance);
          setInitialAngle(angle);
        } else {
          console.warn('DraggableText: Touch objects incomplete, skipping two-finger gesture setup');
        }
      }
    },

    onPanResponderMove: (evt, gestureState) => {
      if (!isEditing) return;
      
      if (gestureState.numberActiveTouches === 1) {
        // Single finger - drag with boundary constraints
        const constrainedX = Math.max(0, Math.min(slideWidth - 100, lastOffset.x + gestureState.dx)) - lastOffset.x;
        const constrainedY = Math.max(0, Math.min(slideHeight - 50, lastOffset.y + gestureState.dy)) - lastOffset.y;
        
        pan.current?.setValue({
          x: constrainedX,
          y: constrainedY,
        });
        
        // Don't update anything during drag - let animated values handle it
        // Parent will be notified on release
      } else if (gestureState.numberActiveTouches === 2) {
        // Two fingers - scale and rotate
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        // Safety check for touch objects
        if (touch1 && touch2 && touch1.pageX !== undefined && touch1.pageY !== undefined && 
            touch2.pageX !== undefined && touch2.pageY !== undefined) {
          
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + 
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          const currentAngle = Math.atan2(
            touch2.pageY - touch1.pageY,
            touch2.pageX - touch1.pageX
          ) * (180 / Math.PI);

          // Update scale based on distance ratio (prevents flipping)
          if (initialDistance > 0) {
            const scaleRatio = distance / initialDistance;
            const newScale = Math.max(0.5, Math.min(3, lastScale * scaleRatio));
            scaleAnim.current?.setValue(newScale - lastScale);
            
            // Don't update scale state during drag - let animated values handle it
          }
          
          // Update rotation - use change from initial angle
          if (initialAngle !== 0) {
            const rotationChange = currentAngle - initialAngle;
            rotationAnim.current?.setValue(rotationChange);
          }
          
          // Don't update rotation state during drag - let animated values handle it
          // Parent will be notified on release
        } else {
          console.warn('DraggableText: Touch objects incomplete during move, skipping two-finger gesture');
        }
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      if (!isEditing) return;
      
      let finalPosition = position;
      let finalScale = scale;
      let finalRotation = rotation;
      
      if (gestureState.numberActiveTouches <= 1) {
        // Handle drag release with boundary constraints
        const newOffset = {
          x: Math.max(0, Math.min(slideWidth - 100, lastOffset.x + gestureState.dx)), // Keep within slide bounds
          y: Math.max(0, Math.min(slideHeight - 50, lastOffset.y + gestureState.dy)), // Keep within slide bounds
        };
        
        setLastOffset(newOffset);
        setPosition(newOffset);
        finalPosition = newOffset;
        pan.current?.flattenOffset();
      }
      
      // Handle scale and rotation release (use stored values from last move)
      if (initialDistance > 0) {
        // Use the current animated values to get final scale
        // The scale would have been updated during move
        const currentScaleValue = scaleAnim.current?._value || 1;
        finalScale = Math.max(0.5, Math.min(3, lastScale + currentScaleValue));
        
        setLastScale(finalScale);
        setScale(finalScale);
      }
      
      if (initialAngle !== 0) {
        // Use the current animated values to get final rotation
        // The rotation would have been updated during move
        const currentRotationValue = rotationAnim.current?._value || 0;
        finalRotation = lastRotation + currentRotationValue;
        
        console.log('DraggableText: Two-finger rotation detected - lastRotation:', lastRotation, 'rotationChange:', currentRotationValue, 'finalRotation:', finalRotation);
        
        setLastRotation(finalRotation);
        setRotation(finalRotation);
      }
      
      scaleAnim.current?.flattenOffset();
      rotationAnim.current?.flattenOffset();
      
      // Convert absolute coordinates back to relative coordinates for consistency
      // Need to account for the centering offset we applied earlier
      const resolutionScale = calculateResolutionScale(slideWidth, screenWidth);
      const fontSize = calculateFontSize(
        style?.fontSize || 24,
        finalScale,
        resolutionScale
      );
      
      const textBackground = calculateTextBackground(
        text || '',
        fontSize,
        slideWidth,
        resolutionScale,
        undefined, // No Canvas context on mobile
        3 // maxLines
      );
      
      // Convert top-left position back to center position
      const centerX = finalPosition.x + (textBackground.width / 2);
      const centerY = finalPosition.y + (textBackground.height / 2);
      
      const relativePosition = {
        x: centerX / slideWidth,
        y: centerY / slideHeight
      };
      
      console.log('DraggableText: Converting position - Absolute:', finalPosition, 'Relative:', relativePosition, 'Slide dimensions:', slideWidth, 'x', slideHeight);
      
      // Always notify parent of changes with final values immediately
      console.log('DraggableText: Notifying parent - scale:', finalScale, 'rotation:', finalRotation);
      onTextChange(text, style, relativePosition, finalScale, finalRotation);
    },
  });


  // Always render if we have text or if we're in editing mode
  if (!text && !isEditing) return null;

  // Hide the text if it's being edited in the overlay (TikTok style)
  if (isBeingEdited) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: pan.current?.x || 0,
        top: pan.current?.y || 0,
        transform: [
          { scale: scaleAnim.current || 1 },
          { 
            rotate: rotationAnim.current?.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }) || '0deg'
          }
        ],
        zIndex: isSelected ? 1000 : 100,
      }}
      {...(isEditing ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity
        onPress={handleTap}
        activeOpacity={1}
        style={{
          ...getBackgroundStyle(),
          borderWidth: isEditing && isSelected ? 2 : 0,
          borderColor: colors.primary,
          borderStyle: 'dashed',
          minWidth: 100,
          minHeight: 30,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={getTextStyle()}
        >
          {text || (isEditing ? 'Tap to add text...' : '')}
        </Text>

        {/* Selection handles and edit button */}
        {isEditing && isSelected && (
          <>
            {/* Edit Button */}
            <TouchableOpacity
              onPress={enterEditMode}
              style={{
                position: 'absolute',
                top: Math.max(-40, -position.y + 10), // Ensure button stays within slide bounds
                left: '50%',
                transform: [{ translateX: -25 }],
                width: 50,
                height: 30,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.text,
              }}
            >
              <Ionicons name="create" size={16} color={colors.text} />
            </TouchableOpacity>
            
            {/* Corner resize handle */}
            <View
              style={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                width: 20,
                height: 20,
                backgroundColor: colors.primary,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
            
            {/* Rotation handle */}
            <View
              style={{
                position: 'absolute',
                top: Math.max(-25, -position.y + 5), // Ensure handle stays within slide bounds
                right: -10,
                width: 20,
                height: 20,
                backgroundColor: colors.secondary,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: colors.text,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="refresh" size={12} color={colors.text} />
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}