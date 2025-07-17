import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import type { Slide } from '../../types/slideshow';
import type { TextStyle } from '../../shared/slideTransforms';

interface TextEditOverlayProps {
  isOpen: boolean;
  slide: Slide;
  onClose: () => void;
  onSave: (updatedSlide: Slide) => void;
}

export function TextEditOverlay({
  isOpen,
  slide,
  onClose,
  onSave
}: TextEditOverlayProps) {
  const [text, setText] = useState(slide.text || '');
  const [textStyle, setTextStyle] = useState<TextStyle>(slide.textStyle || {});
  const [textScale, setTextScale] = useState(slide.textScale || 1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Predefined color palette
  const colorPalette = [
    '#FFFFFF', // White
    '#000000', // Black
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FECA57', // Yellow
    '#FF9FF3', // Pink
    '#54A0FF', // Light Blue
    '#5F27CD', // Purple
    '#00D2D3', // Cyan
    '#FF9F43'  // Orange
  ];

  // Background modes
  const backgroundModes = [
    { id: 'none', label: 'None', preview: 'No background' },
    { id: 'half', label: 'Half', preview: 'Semi-transparent' },
    { id: 'full', label: 'Full', preview: 'Solid background' },
    { id: 'white', label: 'White', preview: 'White background' }
  ];

  // Font sizes
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

  useEffect(() => {
    if (isOpen) {
      setText(slide.text || '');
      setTextStyle(slide.textStyle || {});
      setTextScale(slide.textScale || 1);
      
      // Focus the textarea when opening
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, slide]);

  const handleSave = () => {
    const updatedSlide: Slide = {
      ...slide,
      text: text.trim(),
      textStyle,
      textScale
    };
    onSave(updatedSlide);
    onClose();
  };

  const handleStyleChange = (key: keyof TextStyle, value: any) => {
    setTextStyle(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleBold = () => {
    handleStyleChange('fontWeight', textStyle.fontWeight === 'bold' ? 'normal' : 'bold');
  };

  const toggleItalic = () => {
    handleStyleChange('fontStyle', textStyle.fontStyle === 'italic' ? 'normal' : 'italic');
  };

  const toggleUnderline = () => {
    handleStyleChange('textDecoration', textStyle.textDecoration === 'underline' ? 'none' : 'underline');
  };

  const setAlignment = (align: 'left' | 'center' | 'right') => {
    handleStyleChange('textAlign', align);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard variant="strong" className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Type className="w-6 h-6 mr-2" />
                  Edit Text
                </h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Text Content
                </label>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your text..."
                  className="w-full h-24 p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {text.length}/100 characters
                </div>
              </div>

              {/* Style Controls */}
              <div className="space-y-6">
                {/* Typography Controls */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Typography
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={textStyle.fontWeight === 'bold' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={toggleBold}
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textStyle.fontStyle === 'italic' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={toggleItalic}
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textStyle.textDecoration === 'underline' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={toggleUnderline}
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Alignment Controls */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Text Alignment
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={textStyle.textAlign === 'left' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setAlignment('left')}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textStyle.textAlign === 'center' || !textStyle.textAlign ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setAlignment('center')}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={textStyle.textAlign === 'right' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setAlignment('right')}
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Font Size: {textStyle.fontSize || 24}px
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={textStyle.fontSize || 24}
                      onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                      className="flex-1 p-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {fontSizes.map(size => (
                        <option key={size} value={size}>{size}px</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Text Scale */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Scale: {Math.round(textScale * 100)}%
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTextScale(Math.max(0.5, textScale - 0.1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={textScale}
                      onChange={(e) => setTextScale(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTextScale(Math.min(2, textScale + 0.1))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Text Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorPalette.map(color => (
                      <button
                        key={color}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          textStyle.color === color 
                            ? 'border-white scale-110' 
                            : 'border-white/30 hover:border-white/60'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleStyleChange('color', color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Background
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {backgroundModes.map(mode => (
                      <button
                        key={mode.id}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          (textStyle.backgroundMode || 'none') === mode.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/20 bg-black/20 hover:border-white/40'
                        }`}
                        onClick={() => handleStyleChange('backgroundMode', mode.id)}
                      >
                        <div className="text-white font-medium text-sm">{mode.label}</div>
                        <div className="text-gray-400 text-xs">{mode.preview}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color (if background mode is selected) */}
                {textStyle.backgroundMode && textStyle.backgroundMode !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Background Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.map(color => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            textStyle.backgroundColor === color 
                              ? 'border-white scale-110' 
                              : 'border-white/30 hover:border-white/60'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleStyleChange('backgroundColor', color)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={!text.trim()}>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}