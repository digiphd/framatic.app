import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import { apiService } from '../../services/api';
import { ErrorHandlers } from '../ui/ErrorAlert';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MagicCreateScreenProps {
  onBack: () => void;
  onPreview: (slideshow: any) => void;
}

const defaultTemplates = [
  {
    id: 'hidden_gems',
    name: 'Hidden Gems',
    viralRate: 89,
    description: 'Secret places that blow up',
    emoji: '💎',
    gradient: ['#9333EA', '#C084FC'],
    example: 'Hidden cafe that nobody knows about...',
  },
  {
    id: 'before_after',
    name: 'Before/After',
    viralRate: 84,
    description: 'Transformation stories',
    emoji: '✨',
    gradient: ['#EC4899', '#F472B6'],
    example: 'This changed everything for me...',
  },
  {
    id: 'day_in_life',
    name: 'Day in Life',
    viralRate: 75,
    description: 'Authentic daily routines',
    emoji: '📅',
    gradient: ['#8B5CF6', '#A78BFA'],
    example: 'My 5AM morning routine...',
  },
  {
    id: 'photo_dump',
    name: 'Photo Dump',
    viralRate: 75,
    description: 'Casual authentic moments',
    emoji: '📸',
    gradient: ['#06B6D4', '#67E8F9'],
    example: 'Recent camera roll hits...',
  },
];

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

export function MagicCreateScreen({ onBack, onPreview }: MagicCreateScreenProps) {
  const [step, setStep] = useState<'record-and-template' | 'generating'>('record-and-template');
  const [isRecording, setIsRecording] = useState(false);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0]);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceInput, setVoiceInput] = useState('');
  const [smartTemplatesLoading, setSmartTemplatesLoading] = useState(false);
  const [usingSmartTemplates, setUsingSmartTemplates] = useState(false);

  // Animation values
  const recordScale = new Animated.Value(1);
  const templateOpacity = new Animated.Value(1);
  const pulseAnim = new Animated.Value(1);

  // Swipe gesture handler
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderGrant: () => {
      // Gesture has started
    },
    onPanResponderMove: () => {
      // During gesture
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe right - go to previous template
        swipeToPrevTemplate();
      } else if (gestureState.dx < -50) {
        // Swipe left - go to next template
        swipeToNextTemplate();
      }
    },
  });

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);

      return () => {
        pulse.stop();
        clearInterval(timer);
      };
    } else {
      pulseAnim.setValue(1);
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    Animated.spring(recordScale, { toValue: 1.1, useNativeDriver: true }).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    Animated.spring(recordScale, { toValue: 1, useNativeDriver: true }).start();
    
    if (recordingDuration > 0.5) {
      // Mock voice input for demo - in real app, this would be processed from audio
      const mockVoiceInput = 'Create a fun and engaging slideshow about my latest adventures';
      setVoiceInput(mockVoiceInput);
      
      // Get smart template recommendations
      setTimeout(() => {
        getSmartTemplateRecommendations(mockVoiceInput);
      }, 500);
    }
  };

  const getSmartTemplateRecommendations = async (voiceInput: string) => {
    try {
      setSmartTemplatesLoading(true);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.4.115:3001/api'}/templates/smart-select?userId=${MVP_USER_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_input: voiceInput,
          user_prompt: 'Create engaging content that matches my style',
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get smart recommendations');
      }

      const result = await response.json();
      
      if (result.success && result.recommendations) {
        // Transform recommendations into template format
        const smartTemplates = result.recommendations.map((rec: any) => ({
          id: rec.template_id,
          name: rec.template_name,
          viralRate: Math.round(rec.viral_potential * 10),
          description: rec.reasoning,
          emoji: rec.emoji,
          gradient: rec.gradient,
          example: rec.hook_suggestion,
          relevance_score: rec.relevance_score,
          success_probability: rec.success_probability
        }));
        
        setTemplates(smartTemplates);
        setSelectedTemplate(smartTemplates[0]);
        setCurrentTemplateIndex(0);
        setUsingSmartTemplates(true);
        
        console.log('Smart templates loaded:', smartTemplates);
      } else {
        console.log('Using default templates');
        generateSlideshow();
      }
    } catch (error) {
      console.error('Smart template error:', error);
      ErrorHandlers.smartTemplates(error, () => getSmartTemplateRecommendations(voiceInput));
      // Fallback to default behavior
      generateSlideshow();
    } finally {
      setSmartTemplatesLoading(false);
    }
  };

  const swipeToNextTemplate = () => {
    if (currentTemplateIndex < templates.length - 1) {
      Animated.sequence([
        Animated.timing(templateOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(templateOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      
      const nextIndex = currentTemplateIndex + 1;
      setCurrentTemplateIndex(nextIndex);
      setSelectedTemplate(templates[nextIndex]);
    }
  };

  const swipeToPrevTemplate = () => {
    if (currentTemplateIndex > 0) {
      Animated.sequence([
        Animated.timing(templateOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(templateOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      
      const prevIndex = currentTemplateIndex - 1;
      setCurrentTemplateIndex(prevIndex);
      setSelectedTemplate(templates[prevIndex]);
    }
  };

  const generateSlideshow = () => {
    setStep('generating');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const slideshow = {
            id: 'generated-slideshow',
            title: `${selectedTemplate.name} Magic`,
            template: selectedTemplate.id,
            slides: [
              { 
                id: '1', 
                imageUrl: 'https://picsum.photos/400/600?random=21', 
                text: selectedTemplate.example,
                textStyle: { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
                textPosition: { x: screenWidth / 2, y: screenHeight * 0.5 },
                textScale: 1,
                textRotation: 0,
              },
              { 
                id: '2', 
                imageUrl: 'https://picsum.photos/400/600?random=22', 
                text: 'The transformation begins...',
                textStyle: { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
                textPosition: { x: screenWidth / 2, y: screenHeight * 0.55 },
                textScale: 1,
                textRotation: 0,
              },
              { 
                id: '3', 
                imageUrl: 'https://picsum.photos/400/600?random=23', 
                text: 'This is where it gets crazy...',
                textStyle: { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
                textPosition: { x: screenWidth / 2, y: screenHeight * 0.45 },
                textScale: 1,
                textRotation: 0,
              },
              { 
                id: '4', 
                imageUrl: 'https://picsum.photos/400/600?random=24', 
                text: 'Mind = blown 🤯',
                textStyle: { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
                textPosition: { x: screenWidth / 2, y: screenHeight * 0.5 },
                textScale: 1,
                textRotation: 0,
              },
            ],
            viralHook: selectedTemplate.example,
            caption: `This ${selectedTemplate.name.toLowerCase()} content is about to change everything! ✨`,
            hashtags: ['#fyp', '#viral', `#${selectedTemplate.id}`, '#mindblown'],
            estimatedViralScore: selectedTemplate.viralRate / 10,
          };
          // Use setTimeout to ensure onPreview happens outside render cycle
          setTimeout(() => {
            onPreview(slideshow);
          }, 100);
          return 100;
        }
        return prev + 8;
      });
    }, 100);
  };

  if (step === 'generating') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: 60,
          paddingBottom: spacing.xl,
        }}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Generating Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl }}>
          <LinearGradient
            colors={selectedTemplate.gradient}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.xl,
            }}
          >
            <Text style={{ fontSize: 48 }}>{selectedTemplate.emoji}</Text>
          </LinearGradient>

          <Text style={{
            color: colors.text,
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}>
            Creating Magic
          </Text>

          <Text style={{
            color: colors.textSecondary,
            fontSize: 18,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: 26,
          }}>
            AI is analyzing your voice and crafting your viral {selectedTemplate.name.toLowerCase()} slideshow...
          </Text>

          {/* Progress Bar */}
          <View style={{
            width: '80%',
            height: 6,
            backgroundColor: colors.glass,
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: spacing.lg,
          }}>
            <LinearGradient
              colors={selectedTemplate.gradient}
              style={{
                width: `${progress}%`,
                height: '100%',
              }}
            />
          </View>

          <Text style={{
            color: colors.textSecondary,
            fontSize: 16,
            textAlign: 'center',
          }}>
            {progress < 30 ? 'Transcribing voice...' :
             progress < 60 ? 'Analyzing content...' :
             progress < 90 ? 'Generating captions...' : 'Almost ready!'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: spacing.md,
      }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{
          color: colors.text,
          fontSize: 20,
          fontWeight: 'bold',
        }}>
          Magic Create
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        
        {/* Title */}
        <Text style={{
          color: colors.text,
          fontSize: 32,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}>
          Tell Your Story
        </Text>

        <Text style={{
          color: colors.textSecondary,
          fontSize: 18,
          textAlign: 'center',
          marginBottom: spacing.xl * 1.5,
          lineHeight: 26,
        }}>
          Record your idea, pick a viral template, and watch AI create your perfect slideshow
        </Text>

        {/* Record Button - Center Stage */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl * 2 }}>
          <Animated.View style={{ transform: [{ scale: recordScale }] }}>
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <LinearGradient
                  colors={isRecording ? ['#EF4444', '#F87171'] : ['#9333EA', '#C084FC']}
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isRecording ? '#EF4444' : '#9333EA',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 20,
                  }}
                >
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={60} 
                    color={colors.text} 
                  />
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {/* Recording Duration */}
          {isRecording && (
            <View style={{
              marginTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              backgroundColor: colors.input,
              borderRadius: borderRadius.full,
            }}>
              <Text style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: 'bold',
              }}>
                {recordingDuration.toFixed(1)}s
              </Text>
            </View>
          )}

          <Text style={{
            color: colors.textSecondary,
            fontSize: 16,
            textAlign: 'center',
            marginTop: spacing.lg,
          }}>
            {isRecording ? 'Release to finish' : 'Hold to record your idea'}
          </Text>
        </View>

        {/* Template Selection */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color: colors.text,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}>
            {smartTemplatesLoading ? 'Finding Perfect Match...' : 
             usingSmartTemplates ? 'AI-Recommended Templates' : 'Choose Your Vibe'}
          </Text>
          
          {smartTemplatesLoading && (
            <Text style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}>
              Analyzing your style and goals...
            </Text>
          )}
          
          {usingSmartTemplates && !smartTemplatesLoading && (
            <Text style={{
              color: colors.success,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}>
              ✨ Personalized recommendations based on your input
            </Text>
          )}

          {/* Template Swiper - Fixed positioning */}
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <Animated.View style={{ opacity: templateOpacity }} {...panResponder.panHandlers}>
              <LinearGradient
                colors={selectedTemplate.gradient}
                style={{
                  borderRadius: borderRadius.xl,
                  padding: spacing.xl,
                  marginHorizontal: spacing.md,
                  minHeight: 240,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 64, marginBottom: spacing.md }}>
                    {selectedTemplate.emoji}
                  </Text>
                  
                  <Text style={{
                    color: colors.text,
                    fontSize: 28,
                    fontWeight: 'bold',
                    marginBottom: spacing.sm,
                  }}>
                    {selectedTemplate.name}
                  </Text>

                  <View style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    marginBottom: spacing.md,
                  }}>
                    <Text style={{
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: 'bold',
                    }}>
                      {selectedTemplate.viralRate}% viral rate
                      {usingSmartTemplates && selectedTemplate.relevance_score && (
                        <Text style={{ fontSize: 12, opacity: 0.8 }}>
                          {' '}• {(selectedTemplate.relevance_score * 100).toFixed(0)}% match
                        </Text>
                      )}
                    </Text>
                  </View>

                  <Text style={{
                    color: colors.text,
                    fontSize: 16,
                    textAlign: 'center',
                    marginBottom: spacing.lg,
                    opacity: 0.9,
                  }}>
                    {selectedTemplate.description}
                  </Text>

                  <Text style={{
                    color: colors.text,
                    fontSize: 14,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    opacity: 0.8,
                  }}>
                    "{selectedTemplate.example}"
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Navigation Controls - Made more prominent */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              paddingBottom: 20,
              marginTop: spacing.lg,
            }}>
              <TouchableOpacity
                onPress={swipeToPrevTemplate}
                style={{
                  backgroundColor: currentTemplateIndex > 0 ? colors.glass : 'transparent',
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                  opacity: currentTemplateIndex > 0 ? 1 : 0.3,
                }}
                disabled={currentTemplateIndex === 0}
              >
                <Ionicons name="chevron-back" size={32} color={colors.text} />
              </TouchableOpacity>

              {/* Template indicator dots */}
              <View style={{ 
                flexDirection: 'row', 
                gap: spacing.sm,
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
              }}>
                {templates.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setCurrentTemplateIndex(index);
                      setSelectedTemplate(templates[index]);
                      Animated.sequence([
                        Animated.timing(templateOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                        Animated.timing(templateOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                      ]).start();
                    }}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: index === currentTemplateIndex ? colors.text : colors.textSecondary,
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={swipeToNextTemplate}
                style={{
                  backgroundColor: currentTemplateIndex < templates.length - 1 ? colors.glass : 'transparent',
                  borderRadius: borderRadius.full,
                  padding: spacing.md,
                  opacity: currentTemplateIndex < templates.length - 1 ? 1 : 0.3,
                }}
                disabled={currentTemplateIndex === templates.length - 1}
              >
                <Ionicons name="chevron-forward" size={32} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}