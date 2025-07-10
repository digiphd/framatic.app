import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { colors, spacing } from '../../styles/theme';
import { SkiaSlideRenderer } from '../ui/SkiaSlideRenderer';
import { SlideRenderer } from '../ui/SlideRenderer';
import { consistencyTester } from '../../utils/consistencyTest';

const { width: screenWidth } = Dimensions.get('window');

interface ConsistencyDebuggerProps {
  slideshow: any;
  onClose: () => void;
}

export function ConsistencyDebugger({ slideshow, onClose }: ConsistencyDebuggerProps) {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(0);

  const runConsistencyTest = async () => {
    setIsRunning(true);
    try {
      const results = await consistencyTester.runTestSuite(slideshow);
      setTestResults(results);
    } catch (error) {
      console.error('Consistency test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const renderSlide = slideshow.slides[selectedSlide];
  const previewWidth = screenWidth * 0.4;
  const previewHeight = previewWidth * (1920 / 1080);

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      zIndex: 10000,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: 'bold',
        }}>
          Consistency Debugger
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: colors.glass,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.text }}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Slide Preview Comparison */}
        <View style={{ padding: spacing.lg }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md,
          }}>
            Preview Comparison
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: spacing.lg,
          }}>
            {/* Skia Preview */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: colors.text,
                fontSize: 14,
                marginBottom: spacing.sm,
              }}>
                Skia Preview
              </Text>
              <View style={{
                width: previewWidth,
                height: previewHeight,
                backgroundColor: colors.glass,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {renderSlide && (
                  <SkiaSlideRenderer
                    slide={renderSlide}
                    width={previewWidth}
                    height={previewHeight}
                  />
                )}
              </View>
            </View>

            {/* Regular Preview */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                color: colors.text,
                fontSize: 14,
                marginBottom: spacing.sm,
              }}>
                Regular Preview
              </Text>
              <View style={{
                width: previewWidth,
                height: previewHeight,
                backgroundColor: colors.glass,
                borderRadius: 8,
                overflow: 'hidden',
              }}>
                {renderSlide && (
                  <SlideRenderer
                    slide={renderSlide}
                    width={previewWidth}
                    height={previewHeight}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Slide Selection */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}>
            {slideshow.slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedSlide(index)}
                style={{
                  backgroundColor: selectedSlide === index ? colors.primary : colors.glass,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 6,
                  marginHorizontal: spacing.xs,
                }}
              >
                <Text style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: selectedSlide === index ? 'bold' : 'normal',
                }}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Controls */}
        <View style={{
          padding: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <TouchableOpacity
            onPress={runConsistencyTest}
            disabled={isRunning}
            style={{
              backgroundColor: isRunning ? colors.muted : colors.primary,
              paddingVertical: spacing.lg,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: 'bold',
            }}>
              {isRunning ? 'Running Tests...' : 'Run Consistency Tests'}
            </Text>
          </TouchableOpacity>

          {/* Test Results */}
          {testResults.length > 0 && (
            <View>
              <Text style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: spacing.md,
              }}>
                Test Results
              </Text>
              
              {testResults.map((result, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.glass,
                    padding: spacing.md,
                    borderRadius: 8,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}>
                    Test {index + 1}
                  </Text>
                  
                  <Text style={{
                    color: result.consistency.overallScore > 80 ? colors.success : colors.error,
                    fontSize: 12,
                    marginTop: spacing.xs,
                  }}>
                    Consistency Score: {result.consistency.overallScore}%
                  </Text>
                  
                  {result.consistency.issues.length > 0 && (
                    <Text style={{
                      color: colors.warning,
                      fontSize: 12,
                      marginTop: spacing.xs,
                    }}>
                      Issues: {result.consistency.issues.join(', ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Debug Information */}
        <View style={{
          padding: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <Text style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: spacing.md,
          }}>
            Debug Information
          </Text>
          
          <View style={{
            backgroundColor: colors.glass,
            padding: spacing.md,
            borderRadius: 8,
          }}>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Slide Text: {renderSlide?.text || 'No text'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Font Size: {renderSlide?.textStyle?.fontSize || 'Default'}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Position: {JSON.stringify(renderSlide?.textPosition || 'Default')}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Canvas Size: {previewWidth}x{previewHeight}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}