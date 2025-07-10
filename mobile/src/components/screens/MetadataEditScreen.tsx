import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { exportService } from '../../services/export';
import { SlideRenderer, SlideRendererRef } from '../ui/SlideRenderer';
import { SkiaSlideRenderer, SkiaSlideRendererRef } from '../ui/SkiaSlideRenderer';
import { ConsistencyDebugger } from '../debug/ConsistencyDebugger';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Slideshow {
  id: string;
  title: string;
  template: string;
  slides: any[];
  viralHook: string;
  caption: string;
  hashtags: string[];
  viralScore: number; // Changed from estimatedViralScore to match data
}

interface MetadataEditScreenProps {
  slideshow: Slideshow;
  onSave: (slideshow: Slideshow) => void;
  onBack: () => void;
  onExport: (slideshow: Slideshow) => void;
}

export function MetadataEditScreen({ slideshow, onSave, onBack, onExport }: MetadataEditScreenProps) {
  const [editingSlideshow, setEditingSlideshow] = useState<Slideshow>(slideshow);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [newHashtag, setNewHashtag] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentExportSlide, setCurrentExportSlide] = useState<number | null>(null);
  const [useSkiaRenderer, setUseSkiaRenderer] = useState(true); // Enable Skia for pixel-perfect consistency
  const [showDebugger, setShowDebugger] = useState(false);
  const slideRenderersRef = useRef<{ [key: string]: SlideRendererRef }>({});
  const skiaSlideRenderersRef = useRef<{ [key: string]: SkiaSlideRendererRef }>({});
  const visibleSlideRendererRef = useRef<SlideRendererRef | null>(null);
  const visibleSkiaSlideRendererRef = useRef<SkiaSlideRendererRef | null>(null);

  const updateCaption = (newCaption: string) => {
    const updated = {
      ...editingSlideshow,
      caption: newCaption
    };
    setEditingSlideshow(updated);
    // Auto-save on change
    onSave(updated);
  };

  const addHashtag = (hashtag: string) => {
    if (!hashtag.trim()) return;
    if (!hashtag.startsWith('#')) hashtag = '#' + hashtag;
    const updated = {
      ...editingSlideshow,
      hashtags: [...editingSlideshow.hashtags, hashtag]
    };
    setEditingSlideshow(updated);
    onSave(updated);
    setNewHashtag('');
    setShowHashtagInput(false);
  };

  const removeHashtag = (index: number) => {
    const updated = {
      ...editingSlideshow,
      hashtags: editingSlideshow.hashtags.filter((_, i) => i !== index)
    };
    setEditingSlideshow(updated);
    onSave(updated);
  };

  const handleShare = async () => {
    try {
      await exportService.shareSlideshow(editingSlideshow);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const exportWithVisibleCapture = async (): Promise<boolean> => {
    try {
      console.log('Starting visible capture export...');
      
      // Request permissions first
      const hasPermission = await exportService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow access to Photos to save your slideshow.',
          [{ text: 'OK' }]
        );
        return false;
      }

      let savedCount = 0;
      const totalSlides = editingSlideshow.slides.length;

      // Capture each slide by showing it temporarily
      for (let i = 0; i < totalSlides; i++) {
        const slide = editingSlideshow.slides[i];
        console.log(`Capturing slide ${i + 1}/${totalSlides}: ${slide.id}`);
        
        // Show the current slide
        setCurrentExportSlide(i);
        
        // Wait for the slide to render
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          if (visibleSlideRendererRef.current) {
            const renderedImageUri = await visibleSlideRendererRef.current.capture();
            const success = await exportService.saveRenderedImageToPhotos(renderedImageUri, editingSlideshow);
            if (success) {
              savedCount++;
              console.log(`Successfully saved slide ${i + 1}`);
            }
          }
        } catch (error) {
          console.error(`Failed to capture slide ${i + 1}:`, error);
        }
      }

      // Hide the export overlay
      setCurrentExportSlide(null);

      if (savedCount > 0) {
        Alert.alert(
          'Export Successful! 🎨',
          `${savedCount} of ${totalSlides} slides with text overlays saved to your Camera Roll!`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert(
          'Export Failed',
          'Unable to save slides with text overlays. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Visible capture export failed:', error);
      return false;
    }
  };

  const handleExport = async () => {
    Alert.alert(
      'Export Slideshow',
      'Choose how you want to export your slideshow:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save Images Only', 
          onPress: async () => {
            setIsExporting(true);
            try {
              const success = await exportService.exportSlideshowToPhotos(editingSlideshow);
              if (success) {
                onExport(editingSlideshow);
              }
            } catch (error) {
              console.error('Export failed:', error);
              Alert.alert('Export Error', 'Failed to export slideshow. Please try again.');
            } finally {
              setIsExporting(false);
            }
          }
        },
        { 
          text: 'Save with Text Overlays (Skia)', 
          onPress: async () => {
            setIsExporting(true);
            try {
              // Use Skia server-side rendering for pixel-perfect consistency
              const success = await exportService.exportSlideshowWithSkiaRendering(editingSlideshow);
              if (success) {
                onExport(editingSlideshow);
              }
            } catch (error) {
              console.error('Skia export failed:', error);
              Alert.alert('Export Error', 'Failed to export slideshow with Skia. Please try again.');
            } finally {
              setIsExporting(false);
            }
          }
        },
        { 
          text: 'Save with Text Overlays (Canvas)', 
          onPress: async () => {
            setIsExporting(true);
            try {
              // Use Canvas server-side rendering as fallback
              const success = await exportService.exportSlideshowWithServerRendering(editingSlideshow);
              if (success) {
                onExport(editingSlideshow);
              }
            } catch (error) {
              console.error('Canvas export failed:', error);
              Alert.alert('Export Error', 'Failed to export slideshow with Canvas. Please try again.');
            } finally {
              setIsExporting(false);
            }
          }
        },
        { text: 'Share Content', onPress: handleShare },
      ]
    );
  };

  const getViralScoreColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 6) return colors.warning;
    return colors.error;
  };

  const viralScore = editingSlideshow.viralScore || 7.5;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
      }}>
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          Ready to Share
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setShowDebugger(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.glass,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="bug-outline" size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content - No ScrollView */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        
        {/* Viral Score Display */}
        <View style={{
          alignItems: 'center',
          marginBottom: spacing.xl,
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.glass,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <Text style={{
              color: getViralScoreColor(viralScore),
              fontSize: 32,
              fontWeight: 'bold',
            }}>
              {viralScore}
            </Text>
            <Text style={{
              color: colors.muted,
              fontSize: 14,
              fontWeight: 'medium',
            }}>
              Viral Score
            </Text>
          </View>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.glass,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
          }}>
            <Ionicons name="flame" size={16} color={getViralScoreColor(viralScore)} />
            <Text style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: 'medium',
              marginLeft: spacing.xs,
            }}>
              Ready to go viral!
            </Text>
          </View>
        </View>

        {/* Caption Section */}
        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md,
          }}>
            Caption
          </Text>
          
          <TouchableOpacity
            onPress={() => setIsEditingCaption(true)}
            style={{
              minHeight: 100,
              backgroundColor: colors.glass,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: isEditingCaption ? 2 : 1,
              borderColor: isEditingCaption ? colors.primary : colors.border,
            }}
          >
            {isEditingCaption ? (
              <TextInput
                value={editingSlideshow.caption}
                onChangeText={updateCaption}
                style={{
                  color: colors.text,
                  fontSize: 16,
                  lineHeight: 24,
                  flex: 1,
                }}
                multiline
                autoFocus
                placeholder="Write your caption..."
                placeholderTextColor={colors.muted}
                onBlur={() => setIsEditingCaption(false)}
              />
            ) : (
              <Text style={{
                color: editingSlideshow.caption ? colors.text : colors.muted,
                fontSize: 16,
                lineHeight: 24,
              }}>
                {editingSlideshow.caption || 'Tap to add caption...'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hashtags Section */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md,
          }}>
            Hashtags
          </Text>
          
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}>
            {editingSlideshow.hashtags.map((hashtag, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => removeHashtag(index)}
                style={{
                  backgroundColor: colors.primaryGlass,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{
                  color: colors.primary,
                  fontSize: 14,
                  fontWeight: 'medium',
                }}>
                  {hashtag}
                </Text>
              </TouchableOpacity>
            ))}
            
            {showHashtagInput ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.glass,
                borderRadius: borderRadius.full,
                borderWidth: 1,
                borderColor: colors.primary,
                paddingHorizontal: spacing.md,
              }}>
                <Text style={{ color: colors.primary, fontSize: 14 }}>#</Text>
                <TextInput
                  value={newHashtag}
                  onChangeText={setNewHashtag}
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontSize: 14,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.xs,
                  }}
                  placeholder="hashtag"
                  placeholderTextColor={colors.muted}
                  autoFocus
                  onSubmitEditing={() => addHashtag(newHashtag)}
                  onBlur={() => {
                    if (newHashtag.trim()) {
                      addHashtag(newHashtag);
                    } else {
                      setShowHashtagInput(false);
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowHashtagInput(true)}
                style={{
                  backgroundColor: colors.glass,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                }}
              >
                <Text style={{
                  color: colors.muted,
                  fontSize: 14,
                  fontWeight: 'medium',
                }}>
                  + Add hashtag
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom Export Button */}
        <View style={{
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
        }}>
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: isExporting ? colors.muted : colors.primary,
              paddingVertical: spacing.lg,
              borderRadius: borderRadius.xl,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons 
                name={isExporting ? "hourglass-outline" : "download-outline"} 
                size={20} 
                color={colors.text} 
              />
              <Text style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: 'bold',
                marginLeft: spacing.sm,
              }}>
                {isExporting ? 'Exporting...' : 'Export Video'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visible SlideRenderer for export */}
      {currentExportSlide !== null && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            width: screenWidth * 0.8,
            height: (screenWidth * 0.8) * (16/9), // TikTok aspect ratio 9:16 (height = width * 16/9)
            backgroundColor: colors.background,
          }}>
            {useSkiaRenderer ? (
              <SkiaSlideRenderer
                ref={visibleSkiaSlideRendererRef}
                slide={editingSlideshow.slides[currentExportSlide]}
                width={screenWidth * 0.8}
                height={(screenWidth * 0.8) * (16/9)}
              />
            ) : (
              <SlideRenderer
                ref={visibleSlideRendererRef}
                slide={editingSlideshow.slides[currentExportSlide]}
                width={screenWidth * 0.8}
                height={(screenWidth * 0.8) * (16/9)}
              />
            )}
          </View>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            marginTop: spacing.lg,
            textAlign: 'center',
          }}>
            Exporting slide {currentExportSlide + 1} of {editingSlideshow.slides.length}...
            {useSkiaRenderer && (
              <Text style={{ color: colors.primary, fontSize: 14 }}>
                {'\n'}Using Skia for pixel-perfect quality
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* Hidden SlideRenderer components for rendering */}
      <View style={{ 
        position: 'absolute', 
        left: -10000, 
        top: -10000,
        width: 1080, 
        height: 1920
      }}>
        {editingSlideshow.slides.map((slide) => (
          <View key={slide.id}>
            {/* Regular SlideRenderer */}
            <SlideRenderer
              ref={(ref) => {
                if (ref) {
                  slideRenderersRef.current[slide.id] = ref;
                }
              }}
              slide={slide}
              width={1080}
              height={1920}
            />
            {/* Skia SlideRenderer */}
            <SkiaSlideRenderer
              ref={(ref) => {
                if (ref) {
                  skiaSlideRenderersRef.current[slide.id] = ref;
                }
              }}
              slide={slide}
              width={1080}
              height={1920}
            />
          </View>
        ))}
      </View>

      {/* Consistency Debugger */}
      {showDebugger && (
        <ConsistencyDebugger
          slideshow={editingSlideshow}
          onClose={() => setShowDebugger(false)}
        />
      )}
    </SafeAreaView>
  );
}