import type { TextStyle } from '../shared/slideTransforms';

interface Slide {
  id: string;
  imageUrl: string;
  r2_url?: string;
  text: string;
  textStyle?: TextStyle;
  textPosition?: { x: number; y: number };
  textScale?: number;
  textRotation?: number;
}

interface Slideshow {
  id: string;
  title: string;
  template: string;
  slides: Slide[];
  viralHook: string;
  caption: string;
  hashtags: string[];
  estimatedViralScore: number;
  created_at?: string;
  updated_at?: string;
  status?: 'draft' | 'published';
  platforms?: string[];
}

interface Template {
  id: string;
  name: string;
  viralRate: number;
  description: string;
  emoji: string;
  gradient: string[];
  example: string;
  textStyle: {
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor?: string;
    backgroundMode: 'none' | 'half' | 'full' | 'white';
    letterSpacing: number;
  };
}

export type { Slide, Slideshow, Template };