import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/glass-card';
import { colors, spacing } from '../../styles/theme';
import { debugApi } from '../../services/debug-api';

interface DebugScreenProps {
  onBack: () => void;
}

export function DebugScreen({ onBack }: DebugScreenProps) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev]);
  };

  const testConnection = async () => {
    setLoading(true);
    addResult('Testing API connection...');
    
    try {
      const result = await debugApi.testConnection();
      addResult(`Connection test: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
      addResult(`❌ Connection failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testLibrary = async () => {
    setLoading(true);
    addResult('Testing asset library...');
    
    try {
      const result = await debugApi.testAssetLibrary();
      addResult(`Library test: ${result.success ? '✅' : '❌'} ${result.message}`);
      
      if (result.assets && result.assets.length > 0) {
        addResult(`Found assets: ${result.assets.map(a => a.original_filename).join(', ')}`);
      }
    } catch (error) {
      addResult(`❌ Library test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
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
        
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text,
          }}
        >
          Debug Console
        </Text>
        
        <TouchableOpacity
          onPress={clearResults}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trash" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Test Buttons */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <TouchableOpacity
            onPress={testConnection}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: 10,
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Test API
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={testLibrary}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: colors.success,
              paddingVertical: spacing.md,
              borderRadius: 10,
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Test Library
            </Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={{ padding: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: 14, marginBottom: spacing.sm }}>
            API Endpoint: http://10.0.4.115:3000/api
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Network Status: {loading ? 'Testing...' : 'Ready'}
          </Text>
        </GlassCard>
      </View>

      {/* Results */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: spacing.sm,
          }}
        >
          Test Results ({results.length})
        </Text>
        
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: colors.glass,
            borderRadius: 10,
            padding: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
        >
          {results.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
              No tests run yet. Tap a button above to start testing.
            </Text>
          ) : (
            results.map((result, index) => (
              <View
                key={index}
                style={{
                  marginBottom: spacing.sm,
                  paddingBottom: spacing.sm,
                  borderBottomWidth: index < results.length - 1 ? 1 : 0,
                  borderBottomColor: colors.glass,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {result}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}