import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './glass-card';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface SearchFilters {
  emotions?: string[];
  contentType?: string;
  minViralScore?: number;
  maxViralScore?: number;
  analysisStatus?: string;
  sortBy?: 'created_at' | 'viral_score';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFilterBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
}

const EMOTION_OPTIONS = [
  'authentic', 'happy', 'candid', 'inspiring', 'relatable', 
  'shock', 'curiosity', 'nostalgic', 'dramatic', 'peaceful'
];

const CONTENT_TYPE_OPTIONS = [
  'portrait', 'landscape', 'group', 'selfie', 'product', 
  'nature', 'food', 'lifestyle', 'travel', 'fashion'
];

const STATUS_OPTIONS = [
  'pending', 'processing', 'completed', 'failed'
];

export function SearchFilterBar({ onSearch, onClear }: SearchFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch(searchQuery, filters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Auto-search as user types
    onSearch(query, filters);
  };

  const handleClear = () => {
    setSearchQuery('');
    setFilters({
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    onClear();
  };

  const toggleSortByViralScore = () => {
    const newFilters = {
      ...filters,
      sortBy: filters.sortBy === 'viral_score' ? 'created_at' : 'viral_score',
      sortOrder: filters.sortBy === 'viral_score' ? 'desc' : 'desc'
    } as SearchFilters;
    
    setFilters(newFilters);
    onSearch(searchQuery, newFilters);
  };

  const toggleEmotion = (emotion: string) => {
    setFilters(prev => ({
      ...prev,
      emotions: prev.emotions?.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...(prev.emotions || []), emotion]
    }));
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof SearchFilters];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });

  return (
    <View>
      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.glass,
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search by tags, emotions, or content..."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              marginLeft: spacing.sm,
              color: colors.text,
              fontSize: 16,
            }}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          onPress={toggleSortByViralScore}
          style={{
            marginLeft: spacing.sm,
            padding: spacing.sm,
            backgroundColor: filters.sortBy === 'viral_score' ? colors.warning : colors.glass,
            borderRadius: borderRadius.full,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons 
            name={filters.sortBy === 'viral_score' ? 'trophy' : 'trophy-outline'} 
            size={20} 
            color={filters.sortBy === 'viral_score' ? 'white' : colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={{
            marginLeft: spacing.sm,
            padding: spacing.sm,
            backgroundColor: hasActiveFilters ? colors.primary : colors.glass,
            borderRadius: borderRadius.full,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons 
            name="options" 
            size={20} 
            color={hasActiveFilters ? 'white' : colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              paddingTop: 60,
              paddingBottom: spacing.md,
            }}
          >
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: spacing.lg }}>
            {/* Viral Score Range */}
            <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing.sm }}>
                Viral Score Range
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Min</Text>
                  <TextInput
                    value={filters.minViralScore?.toString() || ''}
                    onChangeText={(text) => setFilters(prev => ({ 
                      ...prev, 
                      minViralScore: text ? parseFloat(text) : undefined 
                    }))}
                    placeholder="0"
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.glass,
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      color: colors.text,
                      marginTop: 4,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Max</Text>
                  <TextInput
                    value={filters.maxViralScore?.toString() || ''}
                    onChangeText={(text) => setFilters(prev => ({ 
                      ...prev, 
                      maxViralScore: text ? parseFloat(text) : undefined 
                    }))}
                    placeholder="10"
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.glass,
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      color: colors.text,
                      marginTop: 4,
                    }}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Emotions */}
            <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing.sm }}>
                Emotions
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {EMOTION_OPTIONS.map(emotion => (
                  <TouchableOpacity
                    key={emotion}
                    onPress={() => toggleEmotion(emotion)}
                    style={{
                      backgroundColor: filters.emotions?.includes(emotion) 
                        ? colors.primary 
                        : colors.glass,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                    }}
                  >
                    <Text style={{ 
                      color: filters.emotions?.includes(emotion) ? 'white' : colors.text,
                      fontSize: 14,
                      textTransform: 'capitalize'
                    }}>
                      {emotion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* Content Type */}
            <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing.sm }}>
                Content Type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {CONTENT_TYPE_OPTIONS.map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      contentType: prev.contentType === type ? undefined : type 
                    }))}
                    style={{
                      backgroundColor: filters.contentType === type 
                        ? colors.primary 
                        : colors.glass,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                    }}
                  >
                    <Text style={{ 
                      color: filters.contentType === type ? 'white' : colors.text,
                      fontSize: 14,
                      textTransform: 'capitalize'
                    }}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>

            {/* Analysis Status */}
            <GlassCard style={{ padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: spacing.sm }}>
                Analysis Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {STATUS_OPTIONS.map(status => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      analysisStatus: prev.analysisStatus === status ? undefined : status 
                    }))}
                    style={{
                      backgroundColor: filters.analysisStatus === status 
                        ? colors.primary 
                        : colors.glass,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                    }}
                  >
                    <Text style={{ 
                      color: filters.analysisStatus === status ? 'white' : colors.text,
                      fontSize: 14,
                      textTransform: 'capitalize'
                    }}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}