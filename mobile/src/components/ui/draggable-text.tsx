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
  initialPosition = { x: screenWidth / 2, y: screenHeight * 0.5 },
  initialScale = 1,
  initialRotation = 0,
  slideId = 'default',
}: DraggableTextProps) {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const [rotation, setRotation] = useState(initialRotation);
  const [lastOffset, setLastOffset] = useState(initialPosition);
  const [lastScale, setLastScale] = useState(initialScale);
  const [lastRotation, setLastRotation] = useState(initialRotation);
  const [initialDistance, setInitialDistance] = useState(0);
  
  // Remove debounced update - we'll update only on release

  // Remove inline editing state - we'll use the overlay instead

  // Create new animated values for each slide to ensure complete isolation
  const pan = useRef<Animated.ValueXY | null>(null);
  const scaleAnim = useRef<Animated.Value | null>(null);
  const rotationAnim = useRef<Animated.Value | null>(null);
  
  // Initialize or recreate animated values when slideId changes
  if (!pan.current || !scaleAnim.current || !rotationAnim.current) {
    pan.current = new Animated.ValueXY(initialPosition);
    scaleAnim.current = new Animated.Value(initialScale);
    rotationAnim.current = new Animated.Value(initialRotation);
  }

  // Recreate animated values when slideId changes to ensure complete isolation
  useEffect(() => {
    pan.current = new Animated.ValueXY(initialPosition);
    scaleAnim.current = new Animated.Value(initialScale);
    rotationAnim.current = new Animated.Value(initialRotation);
    
    setPosition(initialPosition);
    setLastOffset(initialPosition);
    setScale(initialScale);
    setLastScale(initialScale);
    setRotation(initialRotation);
    setLastRotation(initialRotation);
    setInitialDistance(0);
  }, [slideId]);

  // Sync internal state with props when they change (e.g., when switching slides)
  useEffect(() => {
    setPosition(initialPosition);
    setLastOffset(initialPosition);
    pan.current?.setOffset({ x: 0, y: 0 }); // Reset offset first
    pan.current?.setValue(initialPosition); // Then set the value
  }, [initialPosition.x, initialPosition.y]);

  useEffect(() => {
    setScale(initialScale);
    setLastScale(initialScale);
    scaleAnim.current?.setValue(initialScale);
    scaleAnim.current?.setOffset(0); // Reset offset
    setInitialDistance(0); // Reset gesture state
  }, [initialScale]);

  useEffect(() => {
    setRotation(initialRotation);
    setLastRotation(initialRotation);
    rotationAnim.current?.setValue(initialRotation);
    rotationAnim.current?.setOffset(0); // Reset offset
  }, [initialRotation]);

  // Remove cleanup - no more debounced updates

  // Remove inline text sync - handled by overlay

  const getBackgroundStyle = () => {
    switch (style?.backgroundMode) {
      case 'full':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
        };
      case 'half':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
          borderRadius: borderRadius.sm,
        };
      case 'white':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    if (style?.backgroundMode === 'white') {
      return '#000000'; // Black text on white background
    }
    return style?.color || colors.text;
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
      
      // Store initial distance for two-finger gestures
      if (gestureState.numberActiveTouches === 2) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        setInitialDistance(distance);
      }
    },

    onPanResponderMove: (evt, gestureState) => {
      if (!isEditing) return;
      
      if (gestureState.numberActiveTouches === 1) {
        // Single finger - drag
        pan.current?.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
        
        // Don't update anything during drag - let animated values handle it
        // Parent will be notified on release
      } else if (gestureState.numberActiveTouches === 2) {
        // Two fingers - scale and rotate
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        const angle = Math.atan2(
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
        
        // Update rotation
        const normalizedRotation = angle - lastRotation;
        rotationAnim.current?.setValue(normalizedRotation);
        
        // Don't update rotation state during drag - let animated values handle it
        // Parent will be notified on release
      }
    },

    onPanResponderRelease: (evt, gestureState) => {
      if (!isEditing) return;
      
      let finalPosition = position;
      let finalScale = scale;
      let finalRotation = rotation;
      
      if (gestureState.numberActiveTouches <= 1) {
        // Handle drag release
        const newOffset = {
          x: lastOffset.x + gestureState.dx,
          y: lastOffset.y + gestureState.dy,
        };
        
        setLastOffset(newOffset);
        setPosition(newOffset);
        finalPosition = newOffset;
        pan.current?.flattenOffset();
      }
      
      // Handle scale and rotation release
      if (gestureState.numberActiveTouches === 2 && initialDistance > 0) {
        const touch1 = evt.nativeEvent.touches[0];
        const touch2 = evt.nativeEvent.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        const scaleRatio = distance / initialDistance;
        finalScale = Math.max(0.5, Math.min(3, lastScale * scaleRatio));
        
        setLastScale(finalScale);
        setScale(finalScale);
        
        // Calculate final rotation
        const angle = Math.atan2(
          touch2.pageY - touch1.pageY,
          touch2.pageX - touch1.pageX
        ) * (180 / Math.PI);
        finalRotation = angle;
        
        setLastRotation(finalRotation);
        setRotation(finalRotation);
      }
      
      scaleAnim.current?.flattenOffset();
      rotationAnim.current?.flattenOffset();
      
      // Always notify parent of changes with final values immediately
      onTextChange(text, style, finalPosition, finalScale, finalRotation);
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
          style={{
            color: getTextColor(),
            fontSize: 24,
            fontWeight: style?.fontWeight || 'bold',
            fontStyle: style?.fontStyle || 'normal',
            textTransform: style?.textTransform || 'none',
            letterSpacing: style?.letterSpacing || 0,
            textAlign: 'center',
            textShadowColor: style?.backgroundMode === 'white' ? 'transparent' : 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: style?.backgroundMode === 'white' ? 0 : 2,
          }}
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
                top: -40,
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
                top: -25,
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