// Famatic.app Glassmorphism Theme
// Based on design system in claude.md

export const colors = {
  // Core glassmorphism colors from claude.md
  background: '#000000', // Deep black
  foreground: '#FFFFFF',
  
  // Electric purple palette
  primary: '#9333EA', // Electric purple
  primaryForeground: '#FFFFFF',
  primaryGlass: 'rgba(147, 51, 234, 0.1)',
  
  secondary: '#A855F7', // Holographic accent
  secondaryForeground: '#FFFFFF',
  secondaryGlass: 'rgba(168, 85, 247, 0.1)',
  
  // Glass overlay system
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassHover: 'rgba(255, 255, 255, 0.15)',
  glassPressed: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.2)', // General border color
  
  // Status colors with glass variants
  success: '#10B981',
  successGlass: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningGlass: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorGlass: 'rgba(239, 68, 68, 0.1)',
  
  // Content colors
  text: '#FFFFFF', // Primary text - bright white
  textSecondary: 'rgba(255, 255, 255, 0.7)', // Secondary text - semi-transparent white
  input: 'rgba(0, 0, 0, 0.4)', // Input background - dark for contrast
  muted: 'rgba(255, 255, 255, 0.6)',
  mutedForeground: 'rgba(255, 255, 255, 0.4)',
  accent: '#C084FC', // Lighter purple for accents
  accentForeground: '#000000',
} as const;

export const glassMorphism = {
  // Card styles
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backdropFilter: 'blur(20px)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  
  // Button styles
  button: {
    backgroundColor: colors.primaryGlass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backdropFilter: 'blur(10px)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Magic button (special highlighting)
  magicButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.secondary,
    backdropFilter: 'blur(10px)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backdropFilter: 'blur(15px)',
  },
} as const;

export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const animations = {
  // Per claude.md: All animations under 200ms
  fast: 100,
  normal: 150,
  slow: 200,
  
  // Easing curves for glassmorphism
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// Predefined gradients for glassmorphism effects
export const gradients = {
  primary: ['#9333EA', '#A855F7'],
  glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  border: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)'],
  magic: ['#9333EA', '#C084FC', '#A855F7'], // For special effects
} as const;