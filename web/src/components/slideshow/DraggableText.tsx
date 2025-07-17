import React, { useState, useRef, useCallback } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Edit3, RotateCw, Move, Trash2 } from 'lucide-react';
import type { Slide } from '../../types/slideshow';
import { getCSSTextStyle } from '../../shared/slideTransforms';

interface DraggableTextProps {
  slide: Slide;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onRotationChange: (rotation: number) => void;
  containerSize: { width: number; height: number };
}

export function DraggableText({
  slide,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
  onPositionChange,
  onRotationChange,
  containerSize
}: DraggableTextProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const dragControls = useDragControls();
  const rotationRef = useRef(slide.textRotation || 0);

  // Convert relative position (0-1) to absolute pixels
  const absolutePosition = {
    x: (slide.textPosition?.x || 0.5) * containerSize.width,
    y: (slide.textPosition?.y || 0.5) * containerSize.height
  };

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    onSelect();
  }, [onSelect]);

  const handleDragEnd = useCallback(
    (_: any, info: any) => {
      setIsDragging(false);
      
      // Calculate new relative position
      const newX = Math.max(0, Math.min(1, info.point.x / containerSize.width));
      const newY = Math.max(0, Math.min(1, info.point.y / containerSize.height));
      
      onPositionChange({ x: newX, y: newY });
    },
    [containerSize, onPositionChange]
  );

  const handleRotationStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    
    const handleRotationMove = (moveEvent: MouseEvent) => {
      const centerX = absolutePosition.x;
      const centerY = absolutePosition.y;
      
      const angle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX
      ) * 180 / Math.PI;
      
      rotationRef.current = angle;
      onRotationChange(angle);
    };

    const handleRotationEnd = () => {
      setIsRotating(false);
      document.removeEventListener('mousemove', handleRotationMove);
      document.removeEventListener('mouseup', handleRotationEnd);
    };

    document.addEventListener('mousemove', handleRotationMove);
    document.addEventListener('mouseup', handleRotationEnd);
  }, [absolutePosition, onRotationChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging && !isRotating) {
      onSelect();
    }
  }, [isDragging, isRotating, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  }, [onEdit]);

  if (!slide.text) return null;

  return (
    <motion.div
      className={`absolute cursor-move select-none group ${
        isSelected ? 'z-30' : 'z-20'
      }`}
      style={{
        left: absolutePosition.x,
        top: absolutePosition.y,
        transform: 'translate(-50%, -50%)',
      }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      animate={{
        scale: isSelected ? 1.05 : 1,
        rotate: slide.textRotation || 0
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Text Content */}
      <div
        className={`text-white font-bold select-none transition-all duration-200 ${
          isEditing ? 'opacity-75' : 'opacity-100'
        }`}
        style={{
          ...getCSSTextStyle(
            slide.textStyle,
            slide.textScale || 1,
            1
          ),
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        {slide.text}
      </div>

      {/* Selection Indicators */}
      {isSelected && !isEditing && (
        <>
          {/* Selection Border */}
          <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none animate-pulse" 
               style={{ transform: 'translate(-2px, -2px) scale(1.1)' }} />
          
          {/* Control Handles */}
          <div className="absolute -top-8 -right-8 flex space-x-1">
            {/* Edit Button */}
            <button
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit text"
            >
              <Edit3 className="w-3 h-3" />
            </button>

            {/* Rotation Handle */}
            <button
              className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-grab active:cursor-grabbing"
              onMouseDown={handleRotationStart}
              title="Rotate text"
            >
              <RotateCw className="w-3 h-3" />
            </button>

            {/* Delete Button */}
            <button
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete text"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Drag Handle */}
          <div 
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors cursor-move"
            onPointerDown={(e) => dragControls.start(e)}
            title="Drag to move"
          >
            <Move className="w-3 h-3" />
          </div>
        </>
      )}

      {/* Editing Indicator */}
      {isEditing && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            Editing...
          </div>
        </div>
      )}

      {/* Hover Indicator (when not selected) */}
      {!isSelected && (
        <div className="absolute inset-0 border border-white/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </motion.div>
  );
}