import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TextStyle {
  id: string;
  name: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: number;
  preview: string;
}

interface TextColor {
  id: string;
  name: string;
  color: string;
  gradient?: string[];
}

type BackgroundMode = 'none' | 'half' | 'full' | 'white';

interface TextEditOverlayProps {
  visible: boolean;
  initialText?: string;
  initialStyle?: any;
  onTextChange: (text: string) => void;
  onStyleChange: (style: any) => void;
  onDone: () => void;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

const textStyles: TextStyle[] = [
  { id: 'classic', name: 'Classic', fontWeight: '600', preview: 'Aa' },
  { id: 'elegant', name: 'Elegant', fontWeight: '300', fontStyle: 'italic', preview: 'Aa' },
  { id: 'retro', name: 'Retro', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, preview: 'AA' },
  { id: 'vintage', name: 'Vintage', fontWeight: '400', fontStyle: 'italic', preview: 'Aa' },
  { id: 'typewriter', name: 'Typewriter', fontWeight: '400', preview: 'Aa' },
  { id: 'comic', name: 'Comic Sans', fontWeight: '400', preview: 'Aa' },
  { id: 'bold', name: 'Bold', fontWeight: 'bold', preview: 'Aa' },
  { id: 'neon', name: 'Neon', fontWeight: 'bold', textTransform: 'uppercase', preview: 'AA' },
  { id: 'handwriting', name: 'Handwriting', fontStyle: 'italic', fontWeight: '300', preview: 'Aa' },
  { id: 'freehand', name: 'Freehand', fontWeight: '400', fontStyle: 'italic', preview: 'Aa' },
];

const textColors: TextColor[] = [
  { id: 'white', name: 'White', color: '#FFFFFF' },
  { id: 'black', name: 'Black', color: '#000000' },
  { id: 'red', name: 'Red', color: '#FF0000' },
  { id: 'blue', name: 'Blue', color: '#0066FF' },
  { id: 'yellow', name: 'Yellow', color: '#FFFF00' },
  { id: 'green', name: 'Green', color: '#00FF00' },
  { id: 'purple', name: 'Purple', color: '#9333EA' },
  { id: 'pink', name: 'Pink', color: '#FF69B4' },
  { id: 'orange', name: 'Orange', color: '#FFA500' },
  { id: 'gradient1', name: 'Sunset', color: '#FF6B6B', gradient: ['#FF6B6B', '#FFE66D'] },
  { id: 'gradient2', name: 'Ocean', color: '#4ECDC4', gradient: ['#4ECDC4', '#44A08D'] },
  { id: 'gradient3', name: 'Purple', color: '#9333EA', gradient: ['#9333EA', '#C084FC'] },
];

export function TextEditOverlay({
  visible,
  initialText = '',
  initialStyle,
  onTextChange,
  onStyleChange,
  onDone,
  position,
  scale,
  rotation,
}: TextEditOverlayProps) {
  const [text, setText] = useState(initialText);
  const [selectedStyle, setSelectedStyle] = useState(() => {
    const match = textStyles.find(s => s.fontWeight === initialStyle?.fontWeight);
    return match || textStyles[0];
  });
  const [selectedColor, setSelectedColor] = useState(() => {
    const match = textColors.find(c => c.color === initialStyle?.color);
    return match || textColors[0];
  });
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(initialStyle?.backgroundMode || 'none');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for TikTok-style text editing
  const textInputOpacity = useRef(new Animated.Value(0)).current;
  const textInputScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Only set text if it's different from current state
      if (text !== initialText) {
        setText(initialText);
      }
      
      // Reset animation values
      textInputOpacity.setValue(0);
      textInputScale.setValue(0.8);
      
      // Animate overlay fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Animate text input with TikTok-style entrance
      Animated.parallel([
        Animated.timing(textInputOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textInputScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Focus text input after animation
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 400);
    } else {
      // Animate text input out
      Animated.parallel([
        Animated.timing(textInputOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textInputScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialText]);

  // Handle text changes - don't call onTextChange on every keystroke
  const handleTextInputChange = (newText: string) => {
    setText(newText);
  };

  // Only call onTextChange when user finishes editing (on done)
  const handleDone = () => {
    onTextChange(text);
    onDone();
  };

  const cycleBackgroundMode = () => {
    const modes: BackgroundMode[] = ['none', 'half', 'full', 'white'];
    const currentIndex = modes.indexOf(backgroundMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setBackgroundMode(modes[nextIndex]);
    updateStyle({ backgroundMode: modes[nextIndex] });
    
    // Refocus the text input to keep keyboard open
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const updateStyle = useCallback((updates: any) => {
    const newStyle = {
      ...initialStyle,
      ...updates,
    };
    onStyleChange(newStyle);
  }, [initialStyle, onStyleChange]);

  const handleStyleSelect = (style: TextStyle) => {
    setSelectedStyle(style);
    updateStyle({
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textTransform: style.textTransform,
      letterSpacing: style.letterSpacing,
    });
    
    // Refocus the text input to keep keyboard open - try multiple times to ensure it works
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 10);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 100);
  };

  const handleColorSelect = (color: TextColor) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    updateStyle({
      color: color.color,
      gradient: color.gradient,
    });
    
    // Refocus the text input to keep keyboard open
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const getBackgroundStyle = () => {
    switch (backgroundMode) {
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

  const getTextStyle = () => {
    const textColor = backgroundMode === 'white' ? '#000000' : selectedColor.color;
    
    return {
      color: textColor,
      fontSize: 24,
      fontWeight: selectedStyle.fontWeight || 'normal',
      fontStyle: selectedStyle.fontStyle || 'normal',
      textTransform: selectedStyle.textTransform || 'none',
      letterSpacing: selectedStyle.letterSpacing || 0,
      textAlign: 'center' as const,
      minWidth: 100,
      minHeight: 40,
      textShadowColor: backgroundMode === 'white' ? 'transparent' : 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: backgroundMode === 'white' ? 0 : 2,
      ...getBackgroundStyle(),
    };
  };

  const renderStyleButton = (style: TextStyle) => (
    <TouchableOpacity
      key={style.id}
      onPress={() => handleStyleSelect(style)}
      style={{
        marginRight: spacing.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: selectedStyle.id === style.id ? colors.primary : colors.glass,
        borderRadius: borderRadius.lg,
        minWidth: 80,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: style.fontWeight || 'normal',
          fontStyle: style.fontStyle || 'normal',
          textTransform: style.textTransform || 'none',
          letterSpacing: style.letterSpacing || 0,
          marginBottom: 2,
        }}
      >
        {style.preview}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        {style.name}
      </Text>
    </TouchableOpacity>
  );

  const renderColorButton = (color: TextColor) => (
    <TouchableOpacity
      key={color.id}
      onPress={() => handleColorSelect(color)}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.sm,
        borderWidth: selectedColor.id === color.id ? 3 : 1,
        borderColor: selectedColor.id === color.id ? colors.text : colors.border,
        overflow: 'hidden',
      }}
    >
      {color.gradient ? (
        <LinearGradient
          colors={color.gradient}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <View style={{ width: '100%', height: '100%', backgroundColor: color.color }} />
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      keyboardShouldPersistTaps="always"
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Top Controls */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: 60,
          paddingBottom: spacing.md,
        }}>
          {/* Color Picker Toggle */}
          <TouchableOpacity
            onPress={() => {
              setShowColorPicker(!showColorPicker);
              // Keep keyboard open when toggling color picker
              setTimeout(() => {
                textInputRef.current?.focus();
              }, 50);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.glass,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                marginRight: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              {selectedColor.gradient ? (
                <LinearGradient
                  colors={selectedColor.gradient}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={{ width: '100%', height: '100%', backgroundColor: selectedColor.color }} />
              )}
            </View>
            <Text style={{ color: colors.text, fontSize: 14 }}>Color</Text>
          </TouchableOpacity>

          {/* Background Toggle */}
          <TouchableOpacity
            onPress={cycleBackgroundMode}
            style={{
              backgroundColor: colors.glass,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons 
              name={backgroundMode === 'none' ? 'text-outline' : 
                   backgroundMode === 'half' ? 'text' : 
                   backgroundMode === 'full' ? 'square' : 'square-outline'} 
              size={20} 
              color={colors.text} 
            />
            <Text style={{
              color: colors.text,
              fontSize: 14,
              marginLeft: spacing.xs,
              textTransform: 'capitalize',
            }}>
              {backgroundMode}
            </Text>
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity
            onPress={handleDone}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
            }}
          >
            <Text style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View style={{
            backgroundColor: colors.glass,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingVertical: spacing.md,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
              }}>
                {textColors.map(renderColorButton)}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Text Input Area - Animated TikTok Style */}
        <View style={{ 
          flex: 1, 
          justifyContent: 'flex-start', // Start from top instead of center
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl * 2, // Add top padding to position in upper area
        }}>
          <Animated.View style={{
            opacity: textInputOpacity,
            transform: [
              { scale: textInputScale },
            ],
          }}>
            <TextInput
              ref={textInputRef}
              value={text}
              onChangeText={handleTextInputChange}
              placeholder="Enter text..."
              placeholderTextColor={colors.textSecondary}
              style={{
                ...getTextStyle(),
                width: screenWidth * 0.8, // Use most of screen width for editing
                textAlign: 'center',
                // Add subtle border for better visibility during editing
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
              multiline
              textAlign="center"
              autoFocus
              blurOnSubmit={false}
              keyboardShouldPersistTaps="always"
            />
          </Animated.View>
        </View>

        {/* Font Style Selector */}
        <View style={{
          backgroundColor: colors.glass,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.md,
          paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
            }}
          >
            {textStyles.map(renderStyleButton)}
          </ScrollView>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}