import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { apiService } from '../../services/api';
import { ErrorHandlers } from '../ui/ErrorAlert';

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface UserContextScreenProps {
  onComplete: (context: UserContextData) => void;
  onSkip: () => void;
  isOnboarding?: boolean;
}

interface UserContextData {
  creator_type: 'personal' | 'lifestyle' | 'business' | 'influencer' | 'brand';
  business_category?: string;
  tone_of_voice: 'casual' | 'professional' | 'funny' | 'inspirational' | 'educational' | 'trendy';
  target_audience?: string;
  content_goals: string[];
  posting_frequency: 'daily' | 'weekly' | 'occasional';
  preferred_hashtags?: string[];
  brand_keywords?: string[];
}

const CREATOR_TYPES = [
  { id: 'personal', name: 'Personal', icon: '👤', description: 'Sharing life moments' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '✨', description: 'Daily routines & inspiration' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Professional content' },
  { id: 'influencer', name: 'Influencer', icon: '📱', description: 'Building audience' },
  { id: 'brand', name: 'Brand', icon: '🏢', description: 'Company marketing' },
];

const TONE_OPTIONS = [
  { id: 'casual', name: 'Casual', icon: '😊', description: 'Relaxed and friendly' },
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Polished and credible' },
  { id: 'funny', name: 'Funny', icon: '😄', description: 'Humorous and entertaining' },
  { id: 'inspirational', name: 'Inspirational', icon: '🌟', description: 'Motivating and uplifting' },
  { id: 'educational', name: 'Educational', icon: '📚', description: 'Informative and helpful' },
  { id: 'trendy', name: 'Trendy', icon: '🔥', description: 'Current and viral' },
];

const CONTENT_GOALS = [
  'Go viral', 'Build audience', 'Educate followers', 'Showcase products',
  'Share experiences', 'Build brand', 'Drive traffic', 'Entertain'
];

const POSTING_FREQUENCIES = [
  { id: 'daily', name: 'Daily', description: 'Post every day' },
  { id: 'weekly', name: 'Weekly', description: 'Few times per week' },
  { id: 'occasional', name: 'Occasional', description: 'When inspiration strikes' },
];

export function UserContextScreen({ onComplete, onSkip, isOnboarding = false }: UserContextScreenProps) {
  const [step, setStep] = useState(1);
  const [context, setContext] = useState<UserContextData>({
    creator_type: 'personal',
    tone_of_voice: 'casual',
    content_goals: [],
    posting_frequency: 'weekly',
    preferred_hashtags: [],
    brand_keywords: []
  });
  const [loading, setLoading] = useState(false);
  const [businessCategory, setBusinessCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const toggleContentGoal = (goal: string) => {
    setContext(prev => ({
      ...prev,
      content_goals: prev.content_goals.includes(goal)
        ? prev.content_goals.filter(g => g !== goal)
        : [...prev.content_goals, goal]
    }));
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !context.preferred_hashtags?.includes(hashtagInput.trim())) {
      setContext(prev => ({
        ...prev,
        preferred_hashtags: [...(prev.preferred_hashtags || []), hashtagInput.trim()]
      }));
      setHashtagInput('');
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !context.brand_keywords?.includes(keywordInput.trim())) {
      setContext(prev => ({
        ...prev,
        brand_keywords: [...(prev.brand_keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeHashtag = (hashtag: string) => {
    setContext(prev => ({
      ...prev,
      preferred_hashtags: prev.preferred_hashtags?.filter(h => h !== hashtag)
    }));
  };

  const removeKeyword = (keyword: string) => {
    setContext(prev => ({
      ...prev,
      brand_keywords: prev.brand_keywords?.filter(k => k !== keyword)
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (context.content_goals.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one content goal.');
      return;
    }

    setLoading(true);
    
    try {
      const contextData = {
        ...context,
        business_category: businessCategory || undefined,
        target_audience: targetAudience || undefined,
        preferred_hashtags: context.preferred_hashtags?.length ? context.preferred_hashtags : undefined,
        brand_keywords: context.brand_keywords?.length ? context.brand_keywords : undefined
      };

      const response = await apiService.saveUserContext(MVP_USER_ID, contextData);
      
      if (response.success) {
        onComplete(contextData);
      } else {
        ErrorHandlers.contextSave(response.error || 'Failed to save context', handleComplete);
      }
    } catch (error) {
      console.error('Error saving context:', error);
      ErrorHandlers.contextSave(error, handleComplete);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }}>
        What type of creator are you?
      </Text>
      
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 16, 
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24
      }}>
        This helps us generate content that matches your style and goals
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {CREATOR_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            onPress={() => setContext(prev => ({ ...prev, creator_type: type.id as any }))}
            style={{
              backgroundColor: context.creator_type === type.id ? colors.primary : colors.glass,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, marginRight: spacing.md }}>{type.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: context.creator_type === type.id ? 'white' : colors.text,
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: spacing.xs
              }}>
                {type.name}
              </Text>
              <Text style={{ 
                color: context.creator_type === type.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                fontSize: 14
              }}>
                {type.description}
              </Text>
            </View>
            {context.creator_type === type.id && (
              <Ionicons name="checkmark-circle" size={24} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }}>
        What's your tone?
      </Text>
      
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 16, 
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24
      }}>
        Choose the style that best represents how you want to communicate
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {TONE_OPTIONS.map(tone => (
          <TouchableOpacity
            key={tone.id}
            onPress={() => setContext(prev => ({ ...prev, tone_of_voice: tone.id as any }))}
            style={{
              backgroundColor: context.tone_of_voice === tone.id ? colors.primary : colors.glass,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, marginRight: spacing.md }}>{tone.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                color: context.tone_of_voice === tone.id ? 'white' : colors.text,
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: spacing.xs
              }}>
                {tone.name}
              </Text>
              <Text style={{ 
                color: context.tone_of_voice === tone.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                fontSize: 14
              }}>
                {tone.description}
              </Text>
            </View>
            {context.tone_of_voice === tone.id && (
              <Ionicons name="checkmark-circle" size={24} color="white" />
            )}
          </TouchableOpacity>
        ))}

        {/* Business Category Input */}
        {context.creator_type === 'business' && (
          <GlassCard style={{ padding: spacing.lg, marginTop: spacing.lg }}>
            <Text style={{ 
              color: colors.text, 
              fontSize: 16, 
              fontWeight: '600',
              marginBottom: spacing.sm
            }}>
              Business Category (Optional)
            </Text>
            <TextInput
              value={businessCategory}
              onChangeText={setBusinessCategory}
              placeholder="e.g., Food & Beverage, Tech, Fashion"
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.input,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }}>
        What are your goals?
      </Text>
      
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 16, 
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24
      }}>
        Select all that apply to help us create targeted content
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ 
          flexDirection: 'row', 
          flexWrap: 'wrap', 
          gap: spacing.sm,
          marginBottom: spacing.xl
        }}>
          {CONTENT_GOALS.map(goal => (
            <TouchableOpacity
              key={goal}
              onPress={() => toggleContentGoal(goal)}
              style={{
                backgroundColor: context.content_goals.includes(goal) ? colors.primary : colors.glass,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ 
                color: context.content_goals.includes(goal) ? 'white' : colors.text,
                fontSize: 14,
                fontWeight: '500'
              }}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Target Audience Input */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 16, 
            fontWeight: '600',
            marginBottom: spacing.sm
          }}>
            Target Audience (Optional)
          </Text>
          <TextInput
            value={targetAudience}
            onChangeText={setTargetAudience}
            placeholder="e.g., Young professionals, Parents, Fitness enthusiasts"
            placeholderTextColor={colors.textSecondary}
            style={{
              backgroundColor: colors.input,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              color: colors.text,
              fontSize: 16,
            }}
            multiline
          />
        </GlassCard>

        {/* Posting Frequency */}
        <Text style={{ 
          color: colors.text, 
          fontSize: 18, 
          fontWeight: 'bold',
          marginBottom: spacing.md
        }}>
          How often do you post?
        </Text>
        
        {POSTING_FREQUENCIES.map(freq => (
          <TouchableOpacity
            key={freq.id}
            onPress={() => setContext(prev => ({ ...prev, posting_frequency: freq.id as any }))}
            style={{
              backgroundColor: context.posting_frequency === freq.id ? colors.primary : colors.glass,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text style={{ 
                color: context.posting_frequency === freq.id ? 'white' : colors.text,
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                {freq.name}
              </Text>
              <Text style={{ 
                color: context.posting_frequency === freq.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary,
                fontSize: 14
              }}>
                {freq.description}
              </Text>
            </View>
            {context.posting_frequency === freq.id && (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ 
        color: colors.text, 
        fontSize: 28, 
        fontWeight: 'bold', 
        textAlign: 'center',
        marginBottom: spacing.sm 
      }}>
        Personalize your content
      </Text>
      
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 16, 
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24
      }}>
        Add hashtags and keywords that represent your style (optional)
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Preferred Hashtags */}
        <GlassCard style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 16, 
            fontWeight: '600',
            marginBottom: spacing.sm
          }}>
            Preferred Hashtags
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <TextInput
              value={hashtagInput}
              onChangeText={setHashtagInput}
              placeholder="Add hashtag (without #)"
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                backgroundColor: colors.input,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text,
                fontSize: 16,
                marginRight: spacing.sm,
              }}
              onSubmitEditing={addHashtag}
            />
            <TouchableOpacity onPress={addHashtag} style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {context.preferred_hashtags?.map(hashtag => (
              <View key={hashtag} style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontSize: 12 }}>#{hashtag}</Text>
                <TouchableOpacity onPress={() => removeHashtag(hashtag)} style={{ marginLeft: spacing.xs }}>
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Brand Keywords */}
        <GlassCard style={{ padding: spacing.lg }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 16, 
            fontWeight: '600',
            marginBottom: spacing.sm
          }}>
            Brand Keywords
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <TextInput
              value={keywordInput}
              onChangeText={setKeywordInput}
              placeholder="Add keyword or phrase"
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                backgroundColor: colors.input,
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text,
                fontSize: 16,
                marginRight: spacing.sm,
              }}
              onSubmitEditing={addKeyword}
            />
            <TouchableOpacity onPress={addKeyword} style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {context.brand_keywords?.map(keyword => (
              <View key={keyword} style={{
                backgroundColor: colors.warning,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontSize: 12 }}>{keyword}</Text>
                <TouchableOpacity onPress={() => removeKeyword(keyword)} style={{ marginLeft: spacing.xs }}>
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: spacing.md,
      }}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : onSkip()}>
          <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          {step}/4
        </Text>
        
        {isOnboarding && (
          <TouchableOpacity onPress={onSkip}>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      <View style={{
        height: 4,
        backgroundColor: colors.glass,
        marginHorizontal: spacing.lg,
        borderRadius: 2,
        marginBottom: spacing.xl,
      }}>
        <View style={{
          height: '100%',
          backgroundColor: colors.primary,
          borderRadius: 2,
          width: `${(step / 4) * 100}%`,
        }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 50 }}>
        <MagicButton
          title={step === 4 ? 'Complete Setup' : 'Next'}
          onPress={handleNext}
          loading={loading}
          disabled={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}