import React, { useState, useRef, useEffect } from 'react';
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

const { width: screenWidth } = Dimensions.get('window');

interface TextStyle {
  id: string;
  name: string;
  fontFamily?: string;
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

type BackgroundMode = 'none' | 'half' | 'full';

interface InlineTextEditorProps {
  visible: boolean;
  initialText?: string;
  initialStyle?: any;
  onSave: (text: string, style: any) => void;
  onClose: () => void;
  slideImageUrl: string;
}

const textStyles: TextStyle[] = [
  { id: 'classic', name: 'Classic', fontWeight: '600', preview: 'Aa' },
  { id: 'elegant', name: 'Elegant', fontWeight: '300', fontStyle: 'italic', preview: 'Aa' },
  { id: 'retro', name: 'Retro', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, preview: 'AA' },
  { id: 'vintage', name: 'Vintage', fontWeight: '400', fontStyle: 'italic', preview: 'Aa' },
  { id: 'typewriter', name: 'Typewriter', fontFamily: 'Courier', fontWeight: '400', preview: 'Aa' },
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

export function InlineTextEditor({ 
  visible, 
  initialText = '', 
  initialStyle,
  onSave, 
  onClose,
  slideImageUrl 
}: InlineTextEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedStyle, setSelectedStyle] = useState(textStyles[0]);
  const [selectedColor, setSelectedColor] = useState(textColors[0]);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(initialStyle?.backgroundMode || 'none');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const textInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Initialize with existing style if provided
      if (initialStyle) {
        const styleMatch = textStyles.find(s => s.fontWeight === initialStyle.fontWeight);
        const colorMatch = textColors.find(c => c.color === initialStyle.color);
        if (styleMatch) setSelectedStyle(styleMatch);
        if (colorMatch) setSelectedColor(colorMatch);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const cycleBackgroundMode = () => {
    const modes: BackgroundMode[] = ['none', 'half', 'full'];
    const currentIndex = modes.indexOf(backgroundMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setBackgroundMode(modes[nextIndex]);
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
      default:
        return {};
    }
  };

  const getTextStyle = () => {
    return {
      color: selectedColor.color,
      fontSize: 24,
      fontWeight: selectedStyle.fontWeight || 'normal',
      fontStyle: selectedStyle.fontStyle || 'normal',
      textTransform: selectedStyle.textTransform || 'none',
      letterSpacing: selectedStyle.letterSpacing || 0,
      textAlign: 'center' as const,
      minWidth: 100,
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      ...getBackgroundStyle(),
    };
  };

  const handleSave = () => {
    const finalStyle = {
      color: selectedColor.color,
      gradient: selectedColor.gradient,
      fontWeight: selectedStyle.fontWeight,
      fontStyle: selectedStyle.fontStyle,
      textTransform: selectedStyle.textTransform,
      letterSpacing: selectedStyle.letterSpacing,
      backgroundMode,
    };
    onSave(text, finalStyle);
    onClose();
  };

  const renderStyleButton = (style: TextStyle) => (
    <TouchableOpacity
      key={style.id}
      onPress={() => setSelectedStyle(style)}
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
      onPress={() => {
        setSelectedColor(color);
        setShowColorPicker(false);
      }}
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
      }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: 60,
          paddingBottom: spacing.md,
        }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: 'bold',
          }}>
            Edit Text
          </Text>
          
          <TouchableOpacity onPress={handleSave}>
            <Text style={{
              color: colors.primary,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Background Image Preview */}
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          position: 'relative',
        }}>
          {/* Slide Preview with Text Overlay */}
          <View style={{
            width: screenWidth * 0.8,
            height: screenWidth * 0.8 * (16/9), // TikTok aspect ratio 9:16 (height = width * 16/9)
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
            backgroundColor: colors.glass,
            position: 'relative',
          }}>
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#333', // Placeholder for image
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                Photo Preview
              </Text>
            </View>

            {/* Editable Text Overlay */}
            <View style={{
              position: 'absolute',
              bottom: screenWidth * 0.1,
              left: spacing.md,
              right: spacing.md,
              alignItems: 'center',
            }}>
              <TextInput
                ref={textInputRef}
                value={text}
                onChangeText={setText}
                placeholder="Tap to add text..."
                placeholderTextColor={colors.textSecondary}
                style={getTextStyle()}
                multiline
                textAlign="center"
                autoFocus
              />
            </View>
          </View>

          {/* Text Styling Controls */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing.xl,
            gap: spacing.lg,
          }}>
            {/* Color Picker */}
            <TouchableOpacity
              onPress={() => setShowColorPicker(!showColorPicker)}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: colors.text,
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
              }}
            >
              <Ionicons 
                name={backgroundMode === 'none' ? 'text-outline' : 
                     backgroundMode === 'half' ? 'text' : 'rectangle'} 
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
          </View>

          {/* Color Picker Popup */}
          {showColorPicker && (
            <View style={{
              position: 'absolute',
              bottom: 100,
              left: spacing.lg,
              right: spacing.lg,
              backgroundColor: colors.glass,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {textColors.map(renderColorButton)}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Font Style Selector (Attached to Keyboard) */}
        <View style={{
          backgroundColor: colors.glass,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.md,
          paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md, // Account for home indicator
        }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
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