import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
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

type BackgroundMode = 'none' | 'half' | 'full' | 'white';

interface TextStyleToolbarProps {
  visible: boolean;
  currentStyle: any;
  onStyleChange: (style: any) => void;
  onClose: () => void;
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

export function TextStyleToolbar({ visible, currentStyle, onStyleChange, onClose }: TextStyleToolbarProps) {
  const [selectedStyle, setSelectedStyle] = useState(() => {
    const match = textStyles.find(s => s.fontWeight === currentStyle?.fontWeight);
    return match || textStyles[0];
  });
  
  const [selectedColor, setSelectedColor] = useState(() => {
    const match = textColors.find(c => c.color === currentStyle?.color);
    return match || textColors[0];
  });
  
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(currentStyle?.backgroundMode || 'none');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const cycleBackgroundMode = () => {
    const modes: BackgroundMode[] = ['none', 'half', 'full', 'white'];
    const currentIndex = modes.indexOf(backgroundMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setBackgroundMode(modes[nextIndex]);
    
    // Update style immediately
    const newStyle = {
      ...currentStyle,
      backgroundMode: modes[nextIndex],
    };
    onStyleChange(newStyle);
  };

  const handleStyleSelect = (style: TextStyle) => {
    setSelectedStyle(style);
    const newStyle = {
      ...currentStyle,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      textTransform: style.textTransform,
      letterSpacing: style.letterSpacing,
    };
    onStyleChange(newStyle);
  };

  const handleColorSelect = (color: TextColor) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    const newStyle = {
      ...currentStyle,
      color: color.color,
      gradient: color.gradient,
    };
    onStyleChange(newStyle);
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
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.glass,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
      zIndex: 1000,
    }}>
      {/* Header with close button */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
      }}>
        <Text style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: 'bold',
        }}>
          Text Style
        </Text>
        
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Style Controls */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
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
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons 
            name={backgroundMode === 'none' ? 'text-outline' : 
                 backgroundMode === 'half' ? 'text' : 
                 backgroundMode === 'full' ? 'rectangle' : 'square'} 
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
          backgroundColor: colors.glass,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.md,
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

      {/* Font Style Selector */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: spacing.md,
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
    </View>
  );
}