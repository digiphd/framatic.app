import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/glass-card';
import { MagicButton } from '../ui/magic-button';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

interface Slideshow {
  id: string;
  title: string;
  template: string;
  slides: any[];
  viralHook: string;
  caption: string;
  hashtags: string[];
  estimatedViralScore: number;
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
  const [isEditingHook, setIsEditingHook] = useState(false);

  const updateCaption = (newCaption: string) => {
    setEditingSlideshow(prev => ({
      ...prev,
      caption: newCaption
    }));
  };

  const updateHook = (newHook: string) => {
    setEditingSlideshow(prev => ({
      ...prev,
      viralHook: newHook
    }));
  };

  const addHashtag = (hashtag: string) => {
    if (!hashtag.startsWith('#')) hashtag = '#' + hashtag;
    setEditingSlideshow(prev => ({
      ...prev,
      hashtags: [...prev.hashtags, hashtag]
    }));
  };

  const removeHashtag = (index: number) => {
    setEditingSlideshow(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(editingSlideshow);
    onBack();
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

        <Text style={{
          color: colors.text,
          fontSize: 20,
          fontWeight: 'bold',
        }}>
          Edit Details
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Viral Score */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <GlassCard style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trending-up" size={20} color={colors.success} style={{ marginRight: spacing.sm }} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              Viral Score: {editingSlideshow.estimatedViralScore}/10
            </Text>
          </GlassCard>
        </View>

        {/* Viral Hook */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <GlassCard style={{ padding: spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm }}>
              Viral Hook
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.md }}>
              The opening line that grabs attention in the first 2 seconds
            </Text>
            {isEditingHook ? (
              <View>
                <TextInput
                  value={editingSlideshow.viralHook}
                  onChangeText={updateHook}
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    padding: spacing.sm,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.input,
                    minHeight: 80,
                  }}
                  multiline
                  autoFocus
                  placeholder="Enter your viral hook..."
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={() => setIsEditingHook(false)}
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: spacing.sm,
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingHook(true)}>
                <View style={{
                  padding: spacing.md,
                  backgroundColor: colors.glass,
                  borderRadius: borderRadius.sm,
                  minHeight: 60,
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {editingSlideshow.viralHook || 'Tap to add viral hook...'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: spacing.xs }}>
                    Tap to edit
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        {/* Caption */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <GlassCard style={{ padding: spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm }}>
              Caption
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.md }}>
              The main description that appears with your post
            </Text>
            {isEditingCaption ? (
              <View>
                <TextInput
                  value={editingSlideshow.caption}
                  onChangeText={updateCaption}
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    padding: spacing.sm,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: borderRadius.sm,
                    backgroundColor: colors.input,
                    minHeight: 120,
                  }}
                  multiline
                  autoFocus
                  placeholder="Write your caption..."
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  onPress={() => setIsEditingCaption(false)}
                  style={{
                    alignSelf: 'flex-end',
                    marginTop: spacing.sm,
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingCaption(true)}>
                <View style={{
                  padding: spacing.md,
                  backgroundColor: colors.glass,
                  borderRadius: borderRadius.sm,
                  minHeight: 80,
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    {editingSlideshow.caption || 'Tap to add caption...'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: spacing.xs }}>
                    Tap to edit
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        {/* Hashtags */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.xl }}>
          <GlassCard style={{ padding: spacing.lg }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm }}>
              Hashtags
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.md }}>
              Help people discover your content
            </Text>
            
            {/* Current Hashtags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm }}>
              {editingSlideshow.hashtags.map((hashtag, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => removeHashtag(index)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: borderRadius.sm,
                    marginRight: spacing.sm,
                    marginBottom: spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 12 }}>{hashtag}</Text>
                  <Ionicons name="close" size={12} color={colors.text} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Add New Hashtag */}
            <TextInput
              placeholder="Add hashtag..."
              placeholderTextColor={colors.textSecondary}
              style={{
                color: colors.text,
                fontSize: 14,
                padding: spacing.sm,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.input,
              }}
              onSubmitEditing={(event) => {
                const hashtag = event.nativeEvent.text.trim();
                if (hashtag) {
                  addHashtag(hashtag);
                  event.target.clear();
                }
              }}
            />

            {/* Suggested Hashtags */}
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: spacing.sm }}>
                Suggested:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {['#viral', '#trending', '#fyp', '#amazing', '#wow', '#mindblown'].map((hashtag) => (
                  <TouchableOpacity
                    key={hashtag}
                    onPress={() => {
                      if (!editingSlideshow.hashtags.includes(hashtag)) {
                        addHashtag(hashtag);
                      }
                    }}
                    style={{
                      backgroundColor: colors.glass,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: borderRadius.sm,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                      opacity: editingSlideshow.hashtags.includes(hashtag) ? 0.5 : 1,
                    }}
                    disabled={editingSlideshow.hashtags.includes(hashtag)}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{hashtag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.md }}>
          <MagicButton onPress={handleExport} style={{ width: '100%' }}>
            🚀 Export Slideshow
          </MagicButton>
          
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: colors.glass,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
              💾 Save Draft
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}