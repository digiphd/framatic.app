import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  StatusBar,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { DraggableText } from '../ui/draggable-text';
import { TikTokTextEditor } from '../ui/tiktok-text-editor';
import { TextEditOverlay } from '../ui/text-edit-overlay';
import { TemplateSelector } from '../ui/template-selector';
import { R2Image } from '../ui/R2Image';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const slideWidth = screenWidth - (spacing.md * 2);
const slideHeight = Math.min(
  slideWidth * (16/9), // TikTok aspect ratio
  screenHeight * 0.7 // Cap at 70% of screen height for better visibility
);

interface Slide {
  id: string;
  imageUrl: string;
  text: string;
  textStyle?: {
    color?: string;
    gradient?: string[];
    fontWeight?: string;
    fontStyle?: string;
    textTransform?: string;
    letterSpacing?: number;
    backgroundMode?: 'none' | 'half' | 'full' | 'white';
  };
  textPosition?: { x: number; y: number };
  textScale?: number;
  textRotation?: number;
  asset_id?: string; // Keep track of the original asset_id for saving
}

interface Slideshow {
  id: string;
  title: string;
  template: string;
  slides: Slide[];
  viralHook: string;
  caption: string;
  hashtags: string[];
  estimatedViralScore: number;
}

interface PreviewScreenProps {
  slideshow: Slideshow;
  onBack: () => void;
  onExport: (slideshow: Slideshow) => void;
  onEditMetadata: (slideshow: Slideshow) => void;
  onSlideshowUpdate?: (slideshow: Slideshow) => void; // New prop to update parent state
}

export function PreviewScreen({ slideshow, onBack, onExport, onEditMetadata, onSlideshowUpdate }: PreviewScreenProps) {
  console.log('PreviewScreen received slideshow:', slideshow);
  
  const [editingSlideshow, setEditingSlideshow] = useState<Slideshow>(slideshow);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  // Always in edit mode - no preview mode needed
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showTextEditOverlay, setShowTextEditOverlay] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const slideListRef = useRef<FlatList>(null);

  // Default templates (could come from props or API)
  const defaultTemplates = [
    {
      id: 'question_hook',
      name: 'Question Hook',
      viralRate: 92,
      description: 'Provocative questions that demand answers',
      emoji: '❓',
      gradient: ['#EF4444', '#F87171'],
      example: 'Why this advice is actually terrible...',
      textStyle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backgroundMode: 'full',
        letterSpacing: 0.5,
      },
    },
    {
      id: 'controversial_take',
      name: 'Controversial',
      viralRate: 88,
      description: 'Bold statements that spark debate',
      emoji: '🔥',
      gradient: ['#DC2626', '#EF4444'],
      example: 'This might be controversial but...',
      textStyle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        backgroundMode: 'full',
        letterSpacing: 0.3,
      },
    },
    {
      id: 'reaction_hook',
      name: 'Reaction Hook',
      viralRate: 85,
      description: 'Shock value that stops the scroll',
      emoji: '😱',
      gradient: ['#7C3AED', '#A855F7'],
      example: 'how did she do that?! 👀',
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(124, 58, 237, 0.85)',
        backgroundMode: 'full',
        letterSpacing: 0.2,
      },
    },
    {
      id: 'story_reveal',
      name: 'Story Reveal',
      viralRate: 82,
      description: 'Behind-the-scenes secrets exposed',
      emoji: '🎭',
      gradient: ['#059669', '#10B981'],
      example: 'CEO reveals the real reason...',
      textStyle: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(5, 150, 105, 0.9)',
        backgroundMode: 'full',
        letterSpacing: 0.4,
      },
    },
    {
      id: 'money_success',
      name: 'Money/Success',
      viralRate: 79,
      description: 'Financial wisdom and success stories',
      emoji: '💰',
      gradient: ['#D97706', '#F59E0B'],
      example: 'Your money will work harder...',
      textStyle: {
        fontSize: 23,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(217, 119, 6, 0.85)',
        backgroundMode: 'full',
        letterSpacing: 0.1,
      },
    },
    {
      id: 'photo_dump',
      name: 'Photo Dump',
      viralRate: 75,
      description: 'Casual authentic moments',
      emoji: '📸',
      gradient: ['#06B6D4', '#67E8F9'],
      example: 'Recent camera roll hits...',
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backgroundMode: 'full',
        letterSpacing: 0.1,
      },
    },
  ];

  const currentTemplate = defaultTemplates.find(t => t.id === editingSlideshow.template) || defaultTemplates[0];

  // Debug logging - avoid logging in useEffect to prevent update scheduling
  if (__DEV__) {
    console.log('Current slideshow template:', editingSlideshow.template);
    console.log('Found matching template:', currentTemplate?.id);
    console.log('Available templates:', defaultTemplates.map(t => t.id));
  }

  // Apply template to all slides
  const applyTemplateToAllSlides = useCallback((template: any) => {
    setEditingSlideshow(prev => ({
      ...prev,
      template: template.id,
      slides: prev.slides.map(slide => ({
        ...slide,
        textStyle: {
          ...slide.textStyle,
          ...template.textStyle,
        }
      }))
    }));
  }, []);

  // Save slideshow changes to database
  const saveSlideshowChanges = useCallback(async (slideshow: any) => {
    try {
      console.log('🔄 Saving slideshow changes to database:', slideshow.id);
      console.log('📝 Slide data being saved:', JSON.stringify(slideshow.slides, null, 2));
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      console.log('🌐 API URL:', apiUrl);
      
      if (!apiUrl) {
        console.error('❌ EXPO_PUBLIC_API_URL environment variable is not set');
        return;
      }
      
      // Convert slides back to database format with asset_id
      const dbSlides = slideshow.slides.map((slide: Slide, index: number) => ({
        asset_id: slide.asset_id || `slide_${index}_${slide.id}`, // Use asset_id if available, fallback to slide identifier
        text: slide.text,
        position: index + 1,
        style: slide.textStyle || {},
        textPosition: slide.textPosition,
        textScale: slide.textScale,
        textRotation: slide.textRotation,
      }));

      const requestBody = {
        slideshowId: slideshow.id,
        slides: dbSlides,
        title: slideshow.title,
        caption: slideshow.caption,
        hashtags: slideshow.hashtags,
        viralHook: slideshow.viralHook,
        viralScore: slideshow.viralScore,
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${apiUrl}/api/slideshow/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // Handle HTML error responses (like 500 errors)
          const errorText = await response.text();
          console.error('❌ Server error (HTML response):', errorText.substring(0, 200));
          console.error('❌ Response status:', response.status, response.statusText);
          return;
        }
        console.error('❌ Failed to save slideshow changes:', errorData);
        return;
      }

      const result = await response.json();
      console.log('✅ Successfully saved slideshow changes:', result.message);
      console.log('📊 Database response:', result.slideshow);
      
      // Update parent component's slideshow state so it reflects the changes
      if (onSlideshowUpdate && result.slideshow) {
        onSlideshowUpdate(result.slideshow);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Request timeout - slideshow save took too long');
      } else if (error.message === 'Network request failed') {
        console.error('🌐 Network error - check API server and connection');
        console.error('API URL being used:', process.env.EXPO_PUBLIC_API_URL);
      } else {
        console.error('💥 Error saving slideshow changes:', error);
      }
    }
  }, [onSlideshowUpdate]);

  // Update slide text function
  const updateSlideText = useCallback((slideId: string, newText: string, style?: any, position?: { x: number; y: number }, scale?: number, rotation?: number) => {
    if (position) {
      console.log('PreviewScreen: updateSlideText called with position:', position, 'for slide:', slideId);
    }
    
    setEditingSlideshow(prev => {
      const updatedSlideshow = {
        ...prev,
        slides: prev.slides.map(slide =>
          slide.id === slideId ? { 
            ...slide, 
            text: newText,
            textStyle: style ? { ...slide.textStyle, ...style } : slide.textStyle,
            textPosition: position || slide.textPosition,
            textScale: scale !== undefined ? scale : slide.textScale,
            textRotation: rotation !== undefined ? rotation : slide.textRotation,
          } : slide
        )
      };
      
      // Save changes to database immediately
      saveSlideshowChanges(updatedSlideshow);
      
      return updatedSlideshow;
    });
  }, [saveSlideshowChanges]);

  // Memoize callback functions to prevent re-renders
  const handleTextChangeForOverlay = useCallback((text: string) => {
    if (selectedTextId) {
      const slideToUpdate = editingSlideshow.slides.find(s => s.id === selectedTextId);
      if (slideToUpdate) {
        updateSlideText(
          selectedTextId,
          text,
          slideToUpdate.textStyle,
          slideToUpdate.textPosition,
          slideToUpdate.textScale,
          slideToUpdate.textRotation
        );
      }
    }
  }, [selectedTextId, editingSlideshow.slides, updateSlideText]);

  const handleStyleChangeForOverlay = useCallback((style: any) => {
    if (selectedTextId) {
      const slideToUpdate = editingSlideshow.slides.find(s => s.id === selectedTextId);
      if (slideToUpdate) {
        updateSlideText(
          selectedTextId,
          slideToUpdate.text,
          style,
          slideToUpdate.textPosition,
          slideToUpdate.textScale,
          slideToUpdate.textRotation
        );
      }
    }
  }, [selectedTextId, editingSlideshow.slides, updateSlideText]);

  const handleTextEditOverlayDone = useCallback(() => {
    setShowTextEditOverlay(false);
    setSelectedTextId(null);
  }, []);

  // Swipe gesture handler for main slide
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes, not when in text editing mode
      return !showTextEditOverlay &&
             Math.abs(gestureState.dx) > 50 && 
             Math.abs(gestureState.dy) < 100 &&
             Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2; // Ensure horizontal swipe
    },
    
    onPanResponderTerminationRequest: () => {
      // Allow text dragging to take priority
      return false;
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50 && currentSlideIndex > 0) {
        // Swipe right - go to previous slide
        setCurrentSlideIndex(currentSlideIndex - 1);
      } else if (gestureState.dx < -50 && currentSlideIndex < editingSlideshow.slides.length - 1) {
        // Swipe left - go to next slide
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    },
  });

  const currentSlide = editingSlideshow.slides[currentSlideIndex];
  console.log('Current slide:', currentSlide);

  const addNewSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      imageUrl: '', // Empty for now - user will need to select an image
      text: 'Tap to add text',
      textStyle: {
        color: colors.text,
        fontWeight: 'bold',
        backgroundMode: 'none',
      },
      textPosition: { x: 0.5, y: 0.25 }, // Use relative positioning
      textScale: 1,
      textRotation: 0,
    };

    setEditingSlideshow(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
  };

  const deleteSlide = (slideId: string) => {
    if (editingSlideshow.slides.length <= 1) {
      Alert.alert('Cannot Delete', 'You need at least one slide in your slideshow.');
      return;
    }

    Alert.alert(
      'Delete Slide',
      'Are you sure you want to delete this slide?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setEditingSlideshow(prev => ({
              ...prev,
              slides: prev.slides.filter(slide => slide.id !== slideId)
            }));
            
            // Adjust current slide index if needed
            if (currentSlideIndex >= editingSlideshow.slides.length - 1) {
              setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
            }
          }
        },
      ]
    );
  };

  const handleTextSave = (text: string, style: any) => {
    if (selectedTextId) {
      updateSlideText(selectedTextId, text, style);
      setSelectedTextId(null);
    }
  };

  const renderSlidePreview = ({ item, index }: { item: Slide; index: number }) => (
    <TouchableOpacity
      style={{
        marginRight: spacing.sm,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: index === currentSlideIndex ? 3 : 1,
        borderColor: index === currentSlideIndex ? colors.primary : colors.border,
      }}
      onPress={() => {
        setCurrentSlideIndex(index);
        slideListRef.current?.scrollToIndex({ index, animated: true });
      }}
      onLongPress={() => deleteSlide(item.id)}
    >
      <R2Image
        r2Url={item.imageUrl}
        style={{
          width: 60,
          height: 80,
        }}
        resizeMode="cover"
      />
      {item.text && (
        <View style={{
          position: 'absolute',
          bottom: 2,
          left: 2,
          right: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 2,
          padding: 1,
        }}>
          <Text style={{
            color: colors.text,
            fontSize: 8,
            textAlign: 'center',
          }} numberOfLines={1}>
            {item.text}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddSlideButton = () => (
    <TouchableOpacity
      style={{
        width: 60,
        height: 80,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.glass,
      }}
      onPress={addNewSlide}
    >
      <Ionicons name="add" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setShowTemplateSelector(true)}
            style={{
              backgroundColor: colors.glass,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Text style={{ fontSize: 16 }}>{currentTemplate.emoji}</Text>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
              Template
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onEditMetadata(editingSlideshow)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold', marginRight: spacing.xs }}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Slide View */}
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.lg, // Add top padding to prevent overlap with header buttons
      }}>
        <View 
          style={{
            width: slideWidth,
            height: slideHeight,
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
            backgroundColor: colors.glass,
            position: 'relative',
          }}
          {...panResponder.panHandlers}
        >
          {/* Background Image */}
          <R2Image
            r2Url={currentSlide.imageUrl}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />

          {/* Draggable Text Overlay */}
          {(currentSlide.text || true) && (
            <DraggableText
              text={currentSlide.text}
              style={currentSlide.textStyle}
              isEditing={true}
              isSelected={true}
              isBeingEdited={showTextEditOverlay && selectedTextId === currentSlide.id}
              onPress={() => {
                // Don't automatically open text editor - let the edit button handle it
                // This allows users to browse slides without accidentally editing text
              }}
              onTextChange={(text, style, position, scale, rotation) => {
                updateSlideText(currentSlide.id, text, style, position, scale, rotation);
              }}
              onStartTextEdit={() => {
                setSelectedTextId(currentSlide.id);
                setShowTextEditOverlay(true);
              }}
              initialPosition={currentSlide.textPosition || { x: 0.5, y: 0.25 }}
              initialScale={currentSlide.textScale || 1}
              initialRotation={currentSlide.textRotation || 0}
              slideId={currentSlide.id}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
            />
          )}

        </View>
      </View>

      {/* Slide Thumbnails */}
      <View style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}>
        <FlatList
          ref={slideListRef}
          data={editingSlideshow.slides}
          renderItem={renderSlidePreview}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'center',
            gap: spacing.sm,
          }}
          ListFooterComponent={renderAddSlideButton}
          ListFooterComponentStyle={{ marginLeft: spacing.sm }}
        />
      </View>


      {/* TikTok-Style Text Editor */}
      <TikTokTextEditor
        visible={showTextEditor}
        initialText={selectedTextId ? editingSlideshow.slides.find(s => s.id === selectedTextId)?.text || '' : ''}
        onSave={handleTextSave}
        onClose={() => {
          setShowTextEditor(false);
          setSelectedTextId(null);
        }}
      />


      {/* Text Edit Overlay */}
      {selectedTextId && (
        <TextEditOverlay
          visible={showTextEditOverlay}
          initialText={editingSlideshow.slides.find(s => s.id === selectedTextId)?.text || ''}
          initialStyle={editingSlideshow.slides.find(s => s.id === selectedTextId)?.textStyle || {}}
          onTextChange={handleTextChangeForOverlay}
          onStyleChange={handleStyleChangeForOverlay}
          onDone={handleTextEditOverlayDone}
          position={editingSlideshow.slides.find(s => s.id === selectedTextId)?.textPosition || { x: 100, y: 200 }}
          scale={editingSlideshow.slides.find(s => s.id === selectedTextId)?.textScale || 1}
          rotation={editingSlideshow.slides.find(s => s.id === selectedTextId)?.textRotation || 0}
        />
      )}

      {/* Template Selector */}
      {showTemplateSelector && (
        <TemplateSelector
          templates={defaultTemplates}
          selectedTemplate={currentTemplate}
          onTemplateChange={(template) => {
            applyTemplateToAllSlides(template);
            setShowTemplateSelector(false);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </SafeAreaView>
  );
}