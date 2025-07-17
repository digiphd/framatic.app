import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'strong' | 'subtle';
}

export function GlassCard({ 
  children, 
  className = '', 
  hover = false, 
  onClick,
  variant = 'default'
}: GlassCardProps) {
  const { theme } = useTheme();

  const variants = {
    default: theme === 'dark' 
      ? 'bg-black/10 border border-white/10 backdrop-blur-md' 
      : 'bg-white/10 border border-black/10 backdrop-blur-md',
    strong: theme === 'dark'
      ? 'bg-black/20 border border-white/20 backdrop-blur-lg'
      : 'bg-white/20 border border-black/20 backdrop-blur-lg',
    subtle: theme === 'dark'
      ? 'bg-black/5 border border-white/5 backdrop-blur-sm'
      : 'bg-white/5 border border-black/5 backdrop-blur-sm'
  };

  const hoverEffects = hover ? {
    whileHover: { 
      scale: 1.02,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    },
    whileTap: { scale: 0.98 }
  } : {};

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`rounded-xl transition-all duration-200 ${variants[variant]} ${hover ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...hoverEffects}
    >
      {children}
    </Component>
  );
}