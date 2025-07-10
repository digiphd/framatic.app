import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './glass-card';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface Template {
  id: string;
  name: string;
  viralRate: number;
  description: string;
  emoji: string;
  gradient: string[];
  example: string;
  textStyle?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    backgroundMode?: 'none' | 'half' | 'full' | 'white';
    letterSpacing?: number;
  };
}

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplate: Template;
  onTemplateChange: (template: Template) => void;
  onClose: () => void;
}

export function TemplateSelector({
  templates,
  selectedTemplate,
  onTemplateChange,
  onClose,
}: TemplateSelectorProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  // Debug logging - avoid logging in useEffect to prevent update scheduling
  const templateCount = templates?.length || 0;
  const selectedTemplateId = selectedTemplate?.id;
  
  // Log outside of useEffect to avoid scheduling updates
  if (__DEV__) {
    console.log('TemplateSelector received templates:', templateCount);
    console.log('TemplateSelector selected template:', selectedTemplateId);
  }

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleTemplateSelect = (template: Template) => {
    onTemplateChange(template);
    handleClose();
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        opacity: fadeAnim,
        zIndex: 1000,
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.md }}>
        <View
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 16,
            padding: spacing.lg,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}>
            <Text style={[typography.h2, { color: colors.text }]}>
              Choose Template
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.glassDark,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
            Templates found: {templates?.length || 0}
          </Text>
          
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.md }}
            style={{ maxHeight: 400 }}
          >
            {templates && Array.isArray(templates) && templates.length > 0 ? (
              templates.map((template) => {
                const isSelected = template.id === selectedTemplate.id;
                
                return (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleTemplateSelect(template)}
                    style={{ marginBottom: spacing.md }}
                  >
                    <LinearGradient
                      colors={isSelected 
                        ? [...template.gradient, template.gradient[1]] 
                        : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                      }
                      style={{
                        borderRadius: borderRadius.lg,
                        padding: spacing.md,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? colors.primary : colors.glass,
                      }}
                    >
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <View style={{ flex: 1 }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: spacing.xs,
                          }}>
                            <Text style={{ fontSize: 24, marginRight: spacing.sm }}>
                              {template.emoji}
                            </Text>
                            <Text style={[
                              typography.h3,
                              { color: colors.text, flex: 1 }
                            ]}>
                              {template.name}
                            </Text>
                            <View style={{
                              backgroundColor: colors.primary,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 2,
                              borderRadius: borderRadius.sm,
                            }}>
                              <Text style={[
                                typography.caption,
                                { color: colors.text, fontWeight: 'bold' }
                              ]}>
                                {template.viralRate}% viral
                              </Text>
                            </View>
                          </View>
                          
                          <Text style={[
                            typography.body,
                            { 
                              color: colors.textSecondary,
                              marginBottom: spacing.xs,
                            }
                          ]}>
                            {template.description}
                          </Text>
                          
                          <Text style={[
                            typography.caption,
                            { 
                              color: colors.muted,
                              fontStyle: 'italic',
                            }
                          ]}>
                            "{template.example}"
                          </Text>
                        </View>
                        
                        {isSelected && (
                          <View style={{
                            marginLeft: spacing.sm,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: colors.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <Ionicons name="checkmark" size={16} color={colors.text} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[typography.body, { color: colors.text, textAlign: 'center', padding: spacing.lg }]}>
                No templates available
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Animated.View>
  );
}