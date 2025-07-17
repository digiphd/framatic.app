import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Info, 
  Trash2, 
  Download, 
  Star, 
  ZoomIn, 
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import type { Photo } from '../../types/photo';

interface PhotoDetailModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
  onDownload?: (photo: Photo) => void;
}

export function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
  onDelete,
  onToggleFavorite,
  onDownload
}: PhotoDetailModalProps) {
  const { theme } = useTheme();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setShowAnalysis(false);
    }
  }, [isOpen, photo?.id]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'i':
        case 'I':
          setShowAnalysis(!showAnalysis);
          break;
        case 'f':
        case 'F':
          if (onToggleFavorite && photo) {
            onToggleFavorite(photo.id);
          }
          break;
        case '+':
        case '=':
          setZoom(prev => Math.min(prev * 1.2, 3));
          break;
        case '-':
          setZoom(prev => Math.max(prev / 1.2, 0.5));
          break;
        case '0':
          setZoom(1);
          setImagePosition({ x: 0, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showAnalysis, onToggleFavorite, photo]);

  if (!photo) return null;

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this image?')) {
      onDelete(photo.id);
      onClose();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const formatAnalysisData = (analysis: any) => {
    if (!analysis) return 'No analysis data available';
    
    const sections = [];
    
    if (analysis.emotions) {
      sections.push(`Emotions: ${Array.isArray(analysis.emotions) ? analysis.emotions.join(', ') : analysis.emotions}`);
    }
    
    if (analysis.tags) {
      sections.push(`Tags: ${Array.isArray(analysis.tags) ? analysis.tags.join(', ') : analysis.tags}`);
    }
    
    if (analysis.content_type) {
      sections.push(`Content Type: ${analysis.content_type}`);
    }
    
    if (analysis.lighting) {
      sections.push(`Lighting: ${analysis.lighting}`);
    }
    
    if (analysis.composition) {
      sections.push(`Composition: ${analysis.composition}`);
    }
    
    if (analysis.scene_description) {
      sections.push(`Scene: ${analysis.scene_description}`);
    }
    
    if (analysis.best_for_templates) {
      sections.push(`Best Templates: ${Array.isArray(analysis.best_for_templates) ? analysis.best_for_templates.join(', ') : analysis.best_for_templates}`);
    }
    
    return sections.join('\n\n');
  };

  const imageUrl = photo.r2_url || photo.url;
  const viralScore = photo.viral_potential_score || photo.viralScore || 0;
  const qualityScore = photo.quality_score || photo.qualityScore || 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full" 
      className="bg-black"
      showCloseButton={false}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="!bg-black/50 !text-white hover:!bg-black/70"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          {/* Analysis Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className={`!text-white ${showAnalysis ? '!bg-orange-500' : '!bg-black/50 hover:!bg-black/70'}`}
          >
            <Info className="w-5 h-5" />
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.5))}
              className="!bg-transparent !text-white hover:!bg-white/10 !p-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm px-2 min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
              className="!bg-transparent !text-white hover:!bg-white/10 !p-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoom(1);
                setImagePosition({ x: 0, y: 0 });
              }}
              className="!bg-transparent !text-white hover:!bg-white/10 !p-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(photo.id)}
              className={`!text-white ${photo.isFavorite ? '!bg-yellow-500/50' : '!bg-black/50 hover:!bg-black/70'}`}
            >
              <Star className={`w-5 h-5 ${photo.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}

          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(photo)}
              className="!bg-black/50 !text-white hover:!bg-black/70"
            >
              <Download className="w-5 h-5" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="!bg-red-500/50 !text-white hover:!bg-red-600/70"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div className="flex items-center justify-center w-full h-full p-6 pt-20 pb-32">
        <motion.div
          className="relative"
          style={{
            transform: `scale(${zoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
          }}
          drag={zoom > 1}
          dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
          onDrag={(_, info) => {
            if (zoom > 1) {
              setImagePosition({ x: info.offset.x, y: info.offset.y });
            }
          }}
        >
          <img
            src={imageUrl}
            alt={photo.filename}
            className="max-w-[80vw] max-h-[70vh] object-contain rounded-lg shadow-2xl"
            onLoad={() => setImageLoaded(true)}
            style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
          />
        </motion.div>
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        {/* Viral Score */}
        {viralScore > 0 && (
          <div className="flex justify-center mb-4">
            <GlassCard className="px-4 py-2">
              <div className="text-center">
                <div className="text-white text-sm mb-1">Viral Score</div>
                <div className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(viralScore)}`}>
                  {viralScore.toFixed(1)}/10
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* File Info */}
        <div className="flex justify-between items-center text-gray-300 text-sm">
          <span>{photo.original_filename || photo.filename}</span>
          <span>{photo.fileSize || (photo.file_size ? `${(photo.file_size / 1024 / 1024).toFixed(1)}MB` : '')}</span>
        </div>
      </div>

      {/* Analysis Panel */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-20 right-6 bottom-32 w-96 z-30"
          >
            <GlassCard variant="strong" className="h-full p-6 overflow-auto">
              <div className="text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  AI Analysis
                </h3>
                
                <div className="space-y-4">
                  {qualityScore > 0 && (
                    <div>
                      <div className="text-sm text-gray-300 mb-1">Quality Score</div>
                      <div className={`text-sm px-3 py-1 rounded-full inline-block ${getScoreColor(qualityScore)}`}>
                        {qualityScore.toFixed(1)}/10
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {formatAnalysisData(photo.ai_analysis || {
                      emotions: photo.emotions,
                      tags: photo.tags,
                      content_type: 'Photo',
                      scene_description: 'User uploaded image'
                    })}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-lg">Loading...</div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-6 left-6 text-gray-400 text-xs">
        <div>ESC: Close • I: Toggle Info • F: Favorite • +/-: Zoom • 0: Reset</div>
      </div>
    </Modal>
  );
}