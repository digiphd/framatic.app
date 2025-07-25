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
import { Audio } from 'expo-av';
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
    id: 'minimalist_viral',
    name: 'Minimalist Viral',
    viralRate: 92,
    description: 'Clean white text with shadow - perfect for authentic moments',
    emoji: '🔥',
    gradient: ['#9333EA', '#C084FC'],
    example: 'POV: when life hits different...',
    optimal_for: ['authentic', 'lifestyle', 'photo_dumps', 'candid'],
    emotions: ['authentic', 'relatable', 'curiosity'],
    content_types: ['lifestyle', 'authentic', 'casual'],
    content_progression: ['hook_statement', 'build_context', 'reveal_moment', 'call_to_action'],
    writing_style_prompts: {
      hook: 'Start with a relatable POV or authentic moment',
      build: 'Build context about the situation or feeling',
      reveal: 'Share the genuine insight or realization',
      conclusion: 'Connect with audience through shared experience'
    },
    narrative_structure: {
      slide_1: { role: 'hook', style: 'authentic_moment', viral_pattern: 'relatability' },
      slide_2: { role: 'build', style: 'context_building', viral_pattern: 'connection' },
      slide_3: { role: 'reveal', style: 'insight_sharing', viral_pattern: 'value_delivery' },
      slide_4: { role: 'conclusion', style: 'community_building', viral_pattern: 'engagement' }
    },
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      backgroundMode: 'none',
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    positioning: {
      x: 0.5,
      y: 0.3,
      scale: 1.0,
      rotation: 0
    }
  },
  {
    id: 'story_mode',
    name: 'Story Mode',
    viralRate: 88,
    description: 'Semi-transparent background for perfect readability',
    emoji: '📱',
    gradient: ['#06B6D4', '#67E8F9'],
    example: 'This is your sign to take the leap...',
    optimal_for: ['storytelling', 'testimonials', 'advice', 'inspiration'],
    emotions: ['inspiring', 'community', 'relatability'],
    content_types: ['story', 'testimonial', 'advice'],
    content_progression: ['story_hook', 'build_tension', 'reveal_lesson', 'inspire_action'],
    writing_style_prompts: {
      hook: 'Start with a compelling story setup or life moment',
      build: 'Build the narrative tension or emotional stakes',
      reveal: 'Share the key lesson or transformation',
      conclusion: 'Inspire others to take similar action'
    },
    narrative_structure: {
      slide_1: { role: 'hook', style: 'story_opening', viral_pattern: 'narrative_hook' },
      slide_2: { role: 'build', style: 'tension_building', viral_pattern: 'emotional_investment' },
      slide_3: { role: 'reveal', style: 'lesson_reveal', viral_pattern: 'wisdom_sharing' },
      slide_4: { role: 'conclusion', style: 'inspiration_call', viral_pattern: 'motivation' }
    },
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold', 
      color: '#000000',
      backgroundColor: 'rgba(255, 255, 255, 1.0)',
      backgroundMode: 'per_line',
      letterSpacing: 0.3,
      textTransform: 'none',
    },
    positioning: {
      x: 0.5,
      y: 0.3,
      scale: 1.0,
      rotation: 0
    }
  },
  {
    id: 'pop_off',
    name: 'Pop Off',
    viralRate: 85,
    description: 'Bold white background for maximum impact statements',
    emoji: '⚡',
    gradient: ['#EF4444', '#F87171'],
    example: 'Hot take: this changes everything...',
    optimal_for: ['opinions', 'bold_statements', 'controversial', 'attention_grabbing'],
    emotions: ['bold', 'controversial', 'engaging'],
    content_types: ['opinion', 'debate', 'bold_statement'],
    content_progression: ['bold_statement', 'support_argument', 'challenge_norms', 'defend_position'],
    writing_style_prompts: {
      hook: 'Make a bold, attention-grabbing statement',
      build: 'Provide your reasoning or evidence',
      reveal: 'Challenge conventional thinking',
      conclusion: 'Stand firm in your position and invite response'
    },
    narrative_structure: {
      slide_1: { role: 'hook', style: 'bold_statement', viral_pattern: 'attention_grab' },
      slide_2: { role: 'build', style: 'reasoning_share', viral_pattern: 'justification' },
      slide_3: { role: 'reveal', style: 'norm_challenging', viral_pattern: 'controversy' },
      slide_4: { role: 'conclusion', style: 'position_defense', viral_pattern: 'engagement_bait' }
    },
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 1.0)',
      backgroundMode: 'per_line',
      letterSpacing: 0.3,
      textTransform: 'none',
    },
    positioning: {
      x: 0.5,
      y: 0.3,
      scale: 1.0,
      rotation: 0
    }
  }
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
  const [recording, setRecording] = useState<any>(null);
  const [transcribing, setTranscribing] = useState(false);

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

  // Track voiceInput state changes
  useEffect(() => {
    console.log('VoiceInput state changed to:', JSON.stringify(voiceInput));
  }, [voiceInput]);

  const startRecording = async () => {
    try {
      console.log('Requesting audio permissions...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record your voice.');
        return;
      }

      console.log('Starting audio recording...');
      
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WAVE,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      await newRecording.startAsync();
      
      setRecording(newRecording);
      setIsRecording(true);
      Animated.spring(recordScale, { toValue: 1.1, useNativeDriver: true }).start();
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        console.log('No active recording to stop');
        return;
      }

      console.log('Stopping recording...');
      setIsRecording(false);
      Animated.spring(recordScale, { toValue: 1, useNativeDriver: true }).start();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      console.log('Recording stopped. URI:', uri);

      if (recordingDuration > 0.5 && uri) {
        // Transcribe the actual recording
        await transcribeAudio(uri);
      } else {
        console.log('Recording too short, using fallback');
        // Fallback for very short recordings
        const mockVoiceInput = 'Create an engaging slideshow about my content';
        setVoiceInput(mockVoiceInput);
        getSmartTemplateRecommendations(mockVoiceInput);
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to process recording. Please try again.');
      
      // Fallback to mock input
      const mockVoiceInput = 'Create an engaging slideshow about my content';
      setVoiceInput(mockVoiceInput);
      getSmartTemplateRecommendations(mockVoiceInput);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      setTranscribing(true);
      console.log('Starting transcription for:', audioUri);

      // Create FormData for the audio file
      const formData = new FormData();
      
      // Add the audio file
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);

      console.log('Sending transcription request...');

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.4.115:3001/api'}/ai/voice-to-text`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it automatically for FormData
      });

      console.log('Transcription response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Transcription result:', result);

      if (result.success && result.text) {
        const transcribedText = result.text.trim();
        console.log('Transcribed text:', transcribedText);
        console.log('Setting voiceInput state to:', transcribedText);
        
        setVoiceInput(transcribedText);
        
        // Get smart template recommendations with real transcription
        getSmartTemplateRecommendations(transcribedText);
      } else {
        throw new Error(result.error || 'No transcription text received');
      }

    } catch (error) {
      console.error('Transcription failed:', error);
      
      // Show user-friendly error but continue with fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Transcription error details:', errorMessage);
      
      // Fallback to mock input so user experience isn't broken
      const mockVoiceInput = 'Create an engaging slideshow about my content';
      setVoiceInput(mockVoiceInput);
      getSmartTemplateRecommendations(mockVoiceInput);
      
    } finally {
      setTranscribing(false);
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
          success_probability: rec.success_probability,
          optimal_for: rec.template_details?.optimal_for || [],
          emotions: rec.template_details?.emotions || [],
          content_types: rec.template_details?.content_types || [],
          content_progression: rec.template_details?.content_progression || [],
          writing_style_prompts: rec.template_details?.writing_style_prompts || {},
          narrative_structure: rec.template_details?.narrative_structure || {},
          textStyle: rec.template_details?.textStyle || {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backgroundMode: 'full',
            letterSpacing: 0.2,
          }
        }));
        
        setTemplates(smartTemplates);
        setSelectedTemplate(smartTemplates[0]); // Auto-select best recommendation
        setCurrentTemplateIndex(0);
        setUsingSmartTemplates(true);
        
        console.log('Smart templates loaded, auto-selecting best match:', smartTemplates[0]);
        
        // 🎯 MAGIC MOMENT: Automatically generate slideshow with best theme
        // Capture the current voiceInput to avoid timing issues
        const currentVoiceInput = voiceInput;
        console.log('Capturing voiceInput for delayed generation:', currentVoiceInput);
        
        setTimeout(() => {
          // Use the captured voice input to avoid state timing issues
          if (currentVoiceInput && currentVoiceInput.trim() !== '') {
            console.log('Using captured voiceInput for generation:', currentVoiceInput);
            setVoiceInput(currentVoiceInput); // Ensure state is set
            generateSlideshow(currentVoiceInput); // Pass voice input directly
          } else {
            generateSlideshow();
          }
        }, 1000); // Brief pause to show the recommendation
        
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

  const generateSlideshow = async (overrideVoiceInput?: string) => {
    setStep('generating');
    setProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            // Stop at 90% until API call completes
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      console.log('Generating AI-driven slideshow with theme:', selectedTemplate.id);
      console.log('Voice input state:', voiceInput);
      console.log('Override voice input:', overrideVoiceInput);
      console.log('Voice input length:', voiceInput?.length || 0);
      console.log('Voice input type:', typeof voiceInput);
      console.log('Voice input exact value:', JSON.stringify(voiceInput));

      // Use override voice input if provided, otherwise fall back to state
      const finalVoiceInput = overrideVoiceInput && overrideVoiceInput.trim() !== '' 
        ? overrideVoiceInput
        : voiceInput && voiceInput.trim() !== '' 
        ? voiceInput 
        : 'Create an engaging slideshow about my content';
      
      console.log('Final voice input being sent:', finalVoiceInput);
      console.log('Using fallback?', finalVoiceInput === 'Create an engaging slideshow about my content');
      console.log('Using override voice input?', !!overrideVoiceInput);

      // Call AI content generation API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.4.115:3001/api'}/slideshow/generate-content?userId=${MVP_USER_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_input: finalVoiceInput,
          selected_theme: selectedTemplate,
          slide_count: 4
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Content generation failed');
      }

      console.log('AI-generated slideshow:', result.slideshow);

      // Complete progress and show slideshow
      setProgress(100);
      
      setTimeout(() => {
        onPreview(result.slideshow);
      }, 500);

    } catch (error) {
      console.error('AI slideshow generation error:', error);
      
      // Fallback to template-based generation
      console.log('Using fallback template-based generation');
      
      const fallbackSlideshow = {
        id: 'generated-slideshow',
        title: `${selectedTemplate.name} Magic`,
        template: selectedTemplate.id,
        slides: [
          { 
            id: '1', 
            imageUrl: 'https://picsum.photos/400/600?random=21', 
            text: selectedTemplate.example || 'Start your journey...',
            textStyle: selectedTemplate.textStyle || { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
            textPosition: selectedTemplate.positioning || { x: 0.5, y: 0.25 },
            textScale: 1,
            textRotation: 0,
          },
          { 
            id: '2', 
            imageUrl: 'https://picsum.photos/400/600?random=22', 
            text: 'The transformation begins...',
            textStyle: selectedTemplate.textStyle || { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
            textPosition: selectedTemplate.positioning || { x: 0.5, y: 0.25 },
            textScale: 1,
            textRotation: 0,
          },
          { 
            id: '3', 
            imageUrl: 'https://picsum.photos/400/600?random=23', 
            text: 'Here\'s what changed...',
            textStyle: selectedTemplate.textStyle || { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
            textPosition: selectedTemplate.positioning || { x: 0.5, y: 0.25 },
            textScale: 1,
            textRotation: 0,
          },
          { 
            id: '4', 
            imageUrl: 'https://picsum.photos/400/600?random=24', 
            text: 'What do you think? 🤔',
            textStyle: selectedTemplate.textStyle || { color: colors.text, fontWeight: 'bold', backgroundMode: 'none' },
            textPosition: selectedTemplate.positioning || { x: 0.5, y: 0.25 },
            textScale: 1,
            textRotation: 0,
          },
        ],
        viralHook: selectedTemplate.example || 'You won\'t believe this...',
        caption: `This ${selectedTemplate.name.toLowerCase()} content will change everything! ✨`,
        hashtags: ['#fyp', '#viral', `#${selectedTemplate.id}`, '#trending'],
        estimatedViralScore: selectedTemplate.viralRate / 10,
      };
      
      setProgress(100);
      setTimeout(() => {
        onPreview(fallbackSlideshow);
      }, 500);
    }
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
            Creating...
          </Text>

          <Text style={{
            color: colors.textSecondary,
            fontSize: 18,
            textAlign: 'center',
            marginBottom: spacing.xl,
            lineHeight: 26,
          }}>
            AI is using {selectedTemplate.name.toLowerCase()} psychology to craft content that follows proven viral patterns...
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
            {progress < 30 ? 'Analyzing your voice input...' :
             progress < 60 ? 'Applying theme psychology...' :
             progress < 90 ? 'Generating viral content...' : 'Finalizing your slideshow!'}
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
          Create
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
            {transcribing ? 'Transcribing your voice...' :
             isRecording ? 'Release to finish' : 'Hold to record your idea'}
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
             usingSmartTemplates ? 'Perfect Theme Found!' : 'Choose Your Vibe'}
          </Text>
          
          {smartTemplatesLoading && (
            <Text style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}>
              Analyzing your voice and selecting the ideal viral strategy...
            </Text>
          )}
          
          {usingSmartTemplates && !smartTemplatesLoading && (
            <Text style={{
              color: colors.success,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}>
              🎯 AI selected the best theme for your content - creating slideshow now!
            </Text>
          )}

          {/* Template Swiper - Fixed positioning */}
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <Animated.View 
              style={{ opacity: templateOpacity }} 
              {...(!usingSmartTemplates ? panResponder.panHandlers : {})}
            >
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

            {/* Navigation Controls - Hide when using smart templates */}
            {!usingSmartTemplates && (
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
            )}
            
            {/* Auto-generation indicator for smart templates */}
            {usingSmartTemplates && !smartTemplatesLoading && (
              <View style={{
                alignItems: 'center',
                paddingBottom: 20,
                marginTop: spacing.lg,
              }}>
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  textAlign: 'center',
                }}>
                  ✨ Creating your personalized slideshow...
                </Text>
              </View>
            )}
            
            {/* Manual creation button for default templates */}
            {!usingSmartTemplates && !smartTemplatesLoading && voiceInput && (
              <View style={{
                alignItems: 'center',
                paddingBottom: 20,
                marginTop: spacing.lg,
              }}>
                <TouchableOpacity
                  onPress={generateSlideshow}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.md,
                    borderRadius: borderRadius.full,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <Text style={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}>
                    Create
                  </Text>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}