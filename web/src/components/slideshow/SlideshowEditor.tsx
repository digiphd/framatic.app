import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Edit3,
  Type,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { Slideshow, Slide } from '../../types/slideshow';
import { DraggableText } from './DraggableText';
import { TextEditOverlay } from './TextEditOverlay';

interface SlideshowEditorProps {
  slideshow: Slideshow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (slideshow: Slideshow) => void;
  onExport?: (slideshow: Slideshow) => void;
}

export function SlideshowEditor({
  slideshow,
  isOpen,
  onClose,
  onSave,
  onExport
}: SlideshowEditorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(slideshow?.slides || []);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Container dimensions for 9:16 aspect ratio
  const containerSize = { width: 360, height: 640 };

  // Handle slideshow playback
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    } else {
      setIsPlaying(true);
      playbackTimer.current = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % slides.length);
      }, 2000);
    }
  }, [isPlaying, slides.length]);

  React.useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (slideshow) {
      setSlides(slideshow.slides);
      setCurrentSlideIndex(0);
    }
  }, [slideshow]);

  const currentSlide = slides[currentSlideIndex];

  if (!slideshow || !currentSlide) return null;

  const handleSlideChange = (direction: 'prev' | 'next') => {
    if (isPlaying) return; // Don't allow manual navigation during playback
    
    if (direction === 'prev') {
      setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
    } else {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }
  };

  // Text editing handlers
  const handleTextSelect = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  const handleTextEdit = () => {
    if (selectedSlideId) {
      setIsEditingText(true);
      setShowTextEditor(true);
    }
  };

  const handleTextDelete = () => {
    if (selectedSlideId && window.confirm('Are you sure you want to delete this text?')) {
      setSlides(prev => prev.map(slide => 
        slide.id === selectedSlideId 
          ? { ...slide, text: '', textStyle: undefined, textPosition: undefined }
          : slide
      ));
      setSelectedSlideId(null);
    }
  };

  const handleTextPositionChange = (slideId: string, position: { x: number; y: number }) => {
    setSlides(prev => prev.map(slide => 
      slide.id === slideId 
        ? { ...slide, textPosition: position }
        : slide
    ));
  };

  const handleTextRotationChange = (slideId: string, rotation: number) => {
    setSlides(prev => prev.map(slide => 
      slide.id === slideId 
        ? { ...slide, textRotation: rotation }
        : slide
    ));
  };

  const handleSlideUpdate = (updatedSlide: Slide) => {
    setSlides(prev => prev.map(slide => 
      slide.id === updatedSlide.id ? updatedSlide : slide
    ));
    setShowTextEditor(false);
    setIsEditingText(false);
  };

  const handleAddText = () => {
    const newText = 'Double-click to edit';
    setSlides(prev => prev.map(slide => 
      slide.id === currentSlide.id 
        ? { 
            ...slide, 
            text: newText,
            textPosition: { x: 0.5, y: 0.5 },
            textScale: 1,
            textRotation: 0
          }
        : slide
    ));
    setSelectedSlideId(currentSlide.id);
  };

  const handleSave = () => {
    if (onSave && slideshow) {
      onSave({
        ...slideshow,
        slides
      });
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full" 
      className="bg-black"
      showCloseButton={false}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="!bg-black/50 !text-white hover:!bg-black/70"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-white">
            <h1 className="text-xl font-bold">{slideshow.title}</h1>
            <p className="text-sm text-gray-300">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Playback Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="!bg-orange-500 !text-white hover:!bg-orange-600"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          {/* Add Text Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddText}
            className="!bg-blue-500 !text-white hover:!bg-blue-600"
          >
            <Type className="w-5 h-5" />
          </Button>

          {/* Edit Text Button (only when text is selected) */}
          {selectedSlideId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTextEdit}
              className="!bg-purple-500 !text-white hover:!bg-purple-600"
            >
              <Edit3 className="w-5 h-5" />
            </Button>
          )}

          {/* Action Buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="!bg-green-500 !text-white hover:!bg-green-600"
          >
            Save
          </Button>

          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExport(slideshow)}
              className="!bg-purple-500 !text-white hover:!bg-purple-600"
            >
              <Download className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-full pt-20 pb-32">
        {/* Slide Preview */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative">
            {/* 9:16 Aspect Ratio Container */}
            <div 
              ref={slideContainerRef}
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
              style={{ 
                width: containerSize.width, 
                height: containerSize.height,
                aspectRatio: '9/16'
              }}
              onClick={() => setSelectedSlideId(null)} // Deselect when clicking on empty area
            >
              {/* Background Image */}
              <img
                src={currentSlide.r2_url || currentSlide.imageUrl}
                alt={`Slide ${currentSlideIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Draggable Text Overlay */}
              {currentSlide.text && (
                <DraggableText
                  slide={currentSlide}
                  isSelected={selectedSlideId === currentSlide.id}
                  isEditing={isEditingText && selectedSlideId === currentSlide.id}
                  onSelect={() => handleTextSelect(currentSlide.id)}
                  onEdit={handleTextEdit}
                  onDelete={handleTextDelete}
                  onPositionChange={(position) => handleTextPositionChange(currentSlide.id, position)}
                  onRotationChange={(rotation) => handleTextRotationChange(currentSlide.id, rotation)}
                  containerSize={containerSize}
                />
              )}

              {/* Navigation Arrows */}
              {!isPlaying && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    onClick={() => handleSlideChange('prev')}
                    disabled={slides.length <= 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    onClick={() => handleSlideChange('next')}
                    disabled={slides.length <= 1}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slide Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlideIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Slide Thumbnails Panel */}
        <div className="w-80 p-6 border-l border-white/10">
          <GlassCard variant="strong" className="h-full p-4">
            <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
              <Type className="w-5 h-5 mr-2" />
              Slides
            </h3>
            
            <div className="space-y-3 max-h-full overflow-auto">
              {slides.map((slide, index) => (
                <motion.div
                  key={slide.id}
                  className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                    index === currentSlideIndex 
                      ? 'border-orange-500' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => !isPlaying && setCurrentSlideIndex(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[9/16] bg-black">
                    <img
                      src={slide.r2_url || slide.imageUrl}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Text Preview Overlay */}
                    {slide.text && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="text-white text-xs font-bold text-center px-2"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: '4px',
                            maxWidth: '90%'
                          }}
                        >
                          {slide.text.length > 30 
                            ? slide.text.substring(0, 30) + '...' 
                            : slide.text
                          }
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Slide Number */}
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Bottom Stats Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex justify-between items-center text-gray-300 text-sm">
          <div className="flex items-center space-x-6">
            <span>Template: {slideshow.template}</span>
            <span>Viral Score: {slideshow.estimatedViralScore.toFixed(1)}/10</span>
            <span>Duration: {slides.length * 2}s</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>{slides.length} slides</span>
            <span>Last saved: {slideshow.updated_at || 'Never'}</span>
          </div>
        </div>
      </div>

      {/* Text Editor Overlay */}
      {showTextEditor && selectedSlideId && (
        <TextEditOverlay
          isOpen={showTextEditor}
          slide={slides.find(s => s.id === selectedSlideId)!}
          onClose={() => {
            setShowTextEditor(false);
            setIsEditingText(false);
          }}
          onSave={handleSlideUpdate}
        />
      )}
    </Modal>
  );
}