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
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
}

export function PreviewScreen({ slideshow, onBack, onExport, onEditMetadata }: PreviewScreenProps) {
  const [editingSlideshow, setEditingSlideshow] = useState<Slideshow>(slideshow);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(true); // Start in edit mode
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showTextEditOverlay, setShowTextEditOverlay] = useState(false);
  const slideListRef = useRef<FlatList>(null);

  // Update slide text function
  const updateSlideText = useCallback((slideId: string, newText: string, style?: any, position?: { x: number; y: number }, scale?: number, rotation?: number) => {
    setEditingSlideshow(prev => ({
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
    }));
  }, []);

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

  const addNewSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      imageUrl: `https://picsum.photos/400/600?random=${Date.now()}`,
      text: '',
      textStyle: {
        color: colors.text,
        fontWeight: 'bold',
        backgroundMode: 'none',
      },
      textPosition: { x: screenWidth / 2, y: screenHeight * 0.5 },
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

  const handleExport = () => {
    Alert.alert(
      'Export Slideshow',
      'Choose your export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'TikTok Video', onPress: () => exportToTikTok() },
        { text: 'Instagram Story', onPress: () => exportToInstagram() },
        { text: 'Individual Slides', onPress: () => exportIndividualSlides() },
      ]
    );
  };

  const exportToTikTok = () => {
    Alert.alert('Success!', 'Your slideshow has been exported for TikTok. Check your camera roll!');
    onExport(editingSlideshow);
  };

  const exportToInstagram = () => {
    Alert.alert('Success!', 'Your slideshow has been exported for Instagram Stories!');
    onExport(editingSlideshow);
  };

  const exportIndividualSlides = () => {
    Alert.alert('Success!', `All ${editingSlideshow.slides.length} slides exported to your camera roll!`);
    onExport(editingSlideshow);
  };

  const openTextEditor = () => {
    setSelectedTextId(currentSlide.id);
    setShowTextEditor(true);
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
      <Image
        source={{ uri: item.imageUrl }}
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <TouchableOpacity
            onPress={() => setIsEditMode(!isEditMode)}
            style={{
              backgroundColor: isEditMode ? colors.primary : colors.glass,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
              {isEditMode ? 'Done' : 'Edit'}
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
      }}>
        <View 
          style={{
            width: screenWidth - (spacing.md * 2),
            height: (screenWidth - (spacing.md * 2)) * 1.6, // TikTok aspect ratio
            borderRadius: borderRadius.xl,
            overflow: 'hidden',
            backgroundColor: colors.glass,
            position: 'relative',
          }}
          {...panResponder.panHandlers}
        >
          {/* Background Image */}
          <Image
            source={{ uri: currentSlide.imageUrl }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode="cover"
          />

          {/* Draggable Text Overlay */}
          {(currentSlide.text || isEditMode) && (
            <DraggableText
              text={currentSlide.text}
              style={currentSlide.textStyle}
              isEditing={isEditMode}
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
              initialPosition={currentSlide.textPosition || { x: 100, y: 200 }}
              initialScale={currentSlide.textScale || 1}
              initialRotation={currentSlide.textRotation || 0}
              slideId={currentSlide.id}
            />
          )}

          {/* Edit Text Button (when not in edit mode) */}
          {!isEditMode && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: spacing.md,
                right: spacing.md,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: spacing.sm,
                borderRadius: borderRadius.lg,
              }}
              onPress={() => setIsEditMode(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </TouchableOpacity>
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

      {/* Export Button */}
      {!isEditMode && (
        <View style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 40, // Account for home indicator
        }}>
          <MagicButton onPress={handleExport} style={{ width: '100%' }}>
            🚀 Export Slideshow
          </MagicButton>
        </View>
      )}

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
    </SafeAreaView>
  );
}