# Framatic.app - Product Requirements Document v2.0

## Executive Summary

Framatic.app is a mobile-native SaaS application that enables users to create viral TikTok/Instagram slideshows with AI assistance in under 10 seconds. The app emphasizes ultra-fast creation, proven viral formats with authentic user photos, and premium bulk processing capabilities. Initially developed as a personal tool with scalability for public release.

## Product Vision

**Mission**: Transform anyone's authentic photos into viral slideshows instantly using AI that understands what makes content truly engaging.

**Vision**: Become the secret weapon for content creators who want to turn their real, candid photos into millions of views through proven viral formats.

---

## Target Market

### Primary Users
- **TikTok Content Creators**: Individuals posting daily authentic content
- **Small Business Owners**: Using real product/behind-scenes photos
- **Lifestyle Influencers**: Sharing genuine moments and experiences
- **Personal Brand Builders**: Converting authentic moments into engaging content

### Market Validation from Research
TikTok is pushing carousel and slideshow content on the For You page, giving these formats a higher chance of going viral compared to standard videos. Slideshows have higher engagement rates than traditional videos.

### User Personas

#### Primary: "Authentic Creator Alex"
- Age: 18-28  
- Posts 2-5 times daily across TikTok/Instagram
- Has library of 100+ candid, real photos
- Struggles to turn photos into engaging content quickly
- Values authenticity over perfection
- Willing to pay $20-40/month for bulk creation tools

---

## What Makes Viral TikTok Slideshows (Research Findings)

### Key Success Factors

#### 1. **Authentic, Candid Photos**
TikTok users appreciate content that feels genuine and authentic. Candid shots achieve a natural and familiar effect. The less effort you put into the images you take, the more your authentic self will show.

#### 2. **Viral Hook Formulas (First 3 Seconds)**
63% of videos with the highest click-through rate hook viewers in the first 3 seconds. The 3-second rule remains true for TikTok videos.

**Proven Viral Hooks:**
- **Curiosity Gap**: "You won't believe what happened when..." 
- **Controversial Opinion**: "This may be controversial, but..."
- **Direct Callout**: "If you're [target audience], stop scrolling!"
- **Shock Value**: "I can't believe what I just discovered!"
- **Problem/Solution**: "Are you tired of ___? Try this!"
- **Before/After Tease**: "This will change how you see..."

#### 3. **Optimal Slideshow Structure**
Keep it short and sweet - stick to 6–10 slides to maintain viewer interest. Long slideshows can make viewers lose attention.

#### 4. **Caption Psychology**
Catchy captions inspire curiosity, trigger emotions, and invite action. Captions that spark curiosity, humor, or relatability tend to go viral.

**Viral Caption Patterns:**
- Questions that demand answers
- Relatable struggles with solutions  
- Emotional hooks with payoff promises
- Community-building language ("us vs them")
- Call-to-actions that feel natural

#### 5. **Algorithm Optimization**
TikTok's algorithm prioritizes content based on user interactions and preferences. The algorithm rewards genuine engagement over artificial metrics.

---

## Technical Architecture (Updated - Serverless)

### Platform Strategy
- **Frontend**: React Native with Expo for cross-platform App Store deployment
- **Backend**: Next.js API Routes on Vercel for serverless scaling
- **Database**: Supabase (PostgreSQL) with JSONB for real-time features and auth
- **Authentication**: Social login with TikTok and Facebook only
- **File Storage**: Cloudflare R2 for cost-effective image storage
- **AI Services**: OpenRouter.ai for flexible AI model access
  - GPT-4o for viral caption generation
  - Claude 3.5 Sonnet for image analysis and content strategy
  - Whisper for voice-to-text processing
  - GPT-3.5 Turbo for cost-effective hashtag generation
- **Queue System**: Vercel Edge Functions for batch image processing
- **Real-time**: Supabase Realtime subscriptions for analysis updates
- **Deployment**: Vercel (API) + Expo Application Services (App Store)

### OpenRouter.ai Model Strategy
- **Voice-to-text**: `openai/whisper-1` - Cost-effective speech recognition
- **Image Analysis**: `anthropic/claude-3.5-sonnet` - Superior vision capabilities for photo analysis
- **Slideshow Generation**: `openai/gpt-4o` - Proven viral content creation
- **Caption Generation**: `openai/gpt-4o` - High-quality viral hooks and captions
- **Hashtag Generation**: `openai/gpt-3.5-turbo` - Cost-effective for simple tasks
- **Fallback Strategy**: Automatic model switching if primary model is unavailable

### Async Image Analysis Architecture
- **Upload Flow**: Photos uploaded to R2 → Queue batch analysis → Immediate response
- **Batch Processing**: 5-10 images per Vercel Edge Function call (under 15s limit)
- **Parallel Processing**: Multiple batch jobs run simultaneously for speed
- **Real-time Updates**: Supabase Realtime subscriptions notify mobile app of analysis progress
- **JSONB Storage**: Rich metadata stored for lightning-fast slideshow generation
- **Analysis Content**: Emotions, quality scores, viral potential, content type, colors, tags, template suitability

### AI Analysis JSONB Structure
```json
{
  "emotions": ["happy", "candid", "lifestyle"],
  "quality_score": 8.5,
  "viral_potential": 7.2,
  "content_type": "portrait",
  "lighting": "natural",
  "composition": "rule_of_thirds",
  "colors": ["warm", "saturated"],
  "tags": ["morning", "coffee", "authentic"],
  "best_for_templates": ["day_in_life", "hidden_gems"],
  "face_count": 1,
  "scene_description": "Person enjoying morning coffee"
}
```

### Performance Requirements (Updated)
- **Sign-up Process**: 10 seconds maximum (not 30)
- **AI Slideshow Creation**: 10 seconds or less from description to output
- **Bulk Processing**: Process 50+ photos in under 60 seconds
- **Magic Factor**: 95% user satisfaction with "it just works" experience

---

## Core Features & User Stories (Updated)

### 1. Lightning-Fast Onboarding (10 Seconds)
**User Story**: "As a new user, I want to start creating viral content within 10 seconds of opening the app."

**Features**:
- TikTok/Facebook one-tap login only
- Skip tutorial by default, show value immediately
- Auto-permissions request for camera/photos
- Instant slideshow creation on first launch

**Acceptance Criteria**:
- Complete signup in under 10 seconds
- First slideshow created within 30 seconds total
- 90% completion rate through onboarding

### 2. Magic AI Creation (10 Second Maximum)
**User Story**: "As a creator, I want to describe what I want and get a perfect viral slideshow in 10 seconds."

**Features**:
- Voice-to-slideshow with instant processing
- AI analyzes user's photo library for best matches
- Automatically applies proven viral templates
- Generates hooks and captions using viral formulas
- One-tap creation with zero manual editing needed

**Acceptance Criteria**:
- Average creation time: 8 seconds
- 85% of outputs rated "would post as-is"
- Voice recognition accuracy: 95%+

### 3. Bulk Library Processing (Premium Feature)
**User Story**: "As a power creator, I want to upload 100 photos and get 20 viral slideshows ready to post."

**Features**:
- Upload up to 100 photos simultaneously
- AI analyzes entire library for viral potential
- Creates multiple slideshows across different viral formats
- Schedules content for optimal posting times
- Integration with TikTok Creator Studio for direct publishing

**Acceptance Criteria**:
- Process 50+ photos in under 60 seconds
- Generate 10+ unique slideshows per batch
- 90% of generated content meets viral criteria

### 4. Proven Viral Templates (Research-Backed)
**User Story**: "As someone who wants viral content, I need templates with documented success rates."

**Templates Based on Research:**

| Template | Success Rate | Avg Views | Best For |
|----------|-------------|-----------|----------|
| "Hidden Gems" | 89% viral rate | 2.3M views | Travel, lifestyle, secrets |
| "Before/After" | 84% viral rate | 1.8M views | Transformations, progress |
| "Things That..." | 82% viral rate | 1.5M views | Lists, countdowns, facts |
| "POV: You're..." | 78% viral rate | 1.2M views | Relatable scenarios |
| "Candid Photo Dump" | 75% viral rate | 900K views | Authentic moments |
| "Controversial Take" | 71% viral rate | 850K views | Opinion content |

**Acceptance Criteria**:
- Each template includes research-backed viral hooks
- Auto-generates captions using proven formulas
- Real-time success rate tracking and optimization

### 5. Authentic Photo Enhancement
**User Story**: "As a user, I want my real photos to look viral-ready without losing authenticity."

**Features**:
- Candid photo optimization (brightness, contrast, cropping)
- Maintains authentic "imperfect" feel
- AI identifies and enhances emotional moments
- Removes need for professional photography
- Optimizes for TikTok's algorithm preferences

**Acceptance Criteria**:
- 90% user satisfaction with enhanced authenticity
- Processing maintains "real" photo quality
- Zero artificial or over-edited appearance

---

## User Experience Design (Glassmorphism + Speed)

### Design Philosophy: "Invisible Interface, Maximum Speed"
- **Visual Style**: Glassmorphism with depth and reflection
- **Color Palette**: Deep blacks, electric purples, holographic accents
- **Speed Focus**: Every animation under 200ms
- **Magic Moments**: Celebrate successful creations with satisfying animations
- **Accessibility**: High contrast mode, voice navigation

### Glassmorphism Implementation
- Translucent cards with backdrop blur
- Subtle reflections and depth shadows
- Gradient borders with color shifts
- Floating action buttons with glass effects
- Smooth, fluid transitions between states

---

## Database Schema (Updated with R2 Storage)

### Core Tables

#### Users
```sql
users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tiktok_id TEXT UNIQUE,
  facebook_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  library_photo_count INTEGER DEFAULT 0,
  total_slideshows_created INTEGER DEFAULT 0,
  viral_success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Slideshows
```sql
slideshows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  template_used TEXT NOT NULL,
  generation_prompt TEXT,
  slides JSONB NOT NULL, -- Array of slide objects with R2 URLs
  viral_hook TEXT,
  generated_caption TEXT,
  hashtags TEXT[],
  estimated_viral_score FLOAT,
  actual_performance JSONB, -- Views, likes, shares if shared
  creation_time_seconds FLOAT,
  is_bulk_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Asset Library (Updated for Async Processing)
```sql
asset_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  r2_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image', -- 'image', 'video' for future
  original_filename TEXT,
  file_size INTEGER,
  ai_analysis JSONB, -- Rich metadata for fast querying
  analysis_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  viral_potential_score FLOAT, -- Extracted for fast sorting
  quality_score FLOAT, -- Extracted for fast filtering
  times_used INTEGER DEFAULT 0,
  viral_success_rate FLOAT DEFAULT 0,
  upload_method TEXT, -- 'single', 'bulk', 'camera'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_asset_analysis_status ON asset_library(analysis_status);
CREATE INDEX idx_asset_viral_score ON asset_library(viral_potential_score DESC);
CREATE INDEX idx_asset_ai_analysis ON asset_library USING GIN(ai_analysis);
```

#### Viral Templates
```sql
viral_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hook_formula TEXT NOT NULL,
  caption_template TEXT NOT NULL,
  slide_count_range JSONB, -- {min: 6, max: 10}
  success_metrics JSONB, -- Research-backed performance data
  target_emotions TEXT[], -- ['curiosity', 'shock', 'relatability']
  optimal_photo_types TEXT[], -- ['candid', 'before_after', 'lifestyle']
  premium_only BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## API Endpoints (Updated for Async Processing)

### Authentication (Social Only)
- `POST /api/auth/tiktok` - TikTok OAuth login
- `POST /api/auth/facebook` - Facebook OAuth login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Async Asset Management
- `POST /api/assets/upload` - Upload photos to R2 + queue analysis
- `POST /api/assets/analyze-batch` - Process 5-10 images per serverless call
- `GET /api/assets/status/:userId` - Check analysis progress
- `GET /api/assets/library` - Get analyzed assets with JSONB queries

### Lightning Creation (Using Pre-analyzed Assets)
- `POST /api/ai/voice-to-text` - OpenRouter → Whisper for voice processing
- `POST /api/ai/generate-slideshow` - Fast creation from analyzed assets
- `POST /api/ai/magic-create` - One-tap creation with pre-computed analysis
- `GET /api/ai/viral-score` - Real-time viral potential scoring

### Bulk Processing (Premium)
- `POST /api/assets/bulk-upload` - Upload up to 100 photos with batch analysis
- `POST /api/ai/bulk-generate` - Create multiple slideshows from library
- `POST /api/ai/schedule-content` - Auto-schedule for optimal posting
- `GET /api/bulk/status/:jobId` - Check bulk processing status

### Export & Performance
- `POST /api/slideshow/export` - Export TikTok-ready video
- `GET /api/analytics/viral-performance` - Track viral success rates
- `GET /api/analytics/template-effectiveness` - Real template performance
- `POST /api/slideshows/:id/performance` - Update with actual social metrics

---

## Pricing Strategy (Updated for Bulk Features)

### Free Tier (Proof of Concept)
- 3 slideshows per month
- Basic viral templates (3 formats)
- 10 photos in library max
- Watermarked exports

### Creator Pro ($19.99/month)
- Unlimited slideshows
- All viral templates (10+ formats)
- 500 photos in library
- HD exports, no watermark
- Voice creation
- Advanced analytics

### Viral Studio ($39.99/month) - The Bulk Power Tier
- Everything in Creator Pro
- **Bulk processing up to 100 photos**
- **AI auto-scheduling with TikTok Studio integration**
- **Custom viral template creation**
- **A/B testing for captions and hooks**
- **Priority 5-second processing**
- **Viral success guarantee (refund if <10% go viral)**

### Revenue Projections (12 months)
- **Month 1-2**: $0 (Personal use and testing)
- **Month 3-4**: $5,000/month (250 early adopters, mostly Viral Studio)
- **Month 5-8**: $25,000/month (800 active users, 60% premium)
- **Month 9-12**: $75,000/month (2,000 active users, proven viral success)

---

## Success Metrics (Updated)

### Magic Experience Metrics
- **Creation Speed**: Average 8 seconds from idea to viral slideshow
- **First Slideshow Time**: 90% of users create within 2 minutes
- **"Would Post As-Is" Rate**: 85% satisfaction with zero editing
- **Viral Success Rate**: 25% of slideshows achieve >100K views

### Business Metrics
- **Free-to-Paid Conversion**: 20% (driven by bulk feature desire)
- **Viral Studio Adoption**: 40% of paid users upgrade for bulk
- **User Retention**: 70% Day 7 (driven by viral success)
- **Net Promoter Score**: >60 (word-of-mouth growth)

---

## MVP Definition: The Magic Core

### **MVP Vision Statement**
Build the single most valuable feature first: AI-powered voice-to-viral-slideshow creation in under 10 seconds. This MVP proves the core value proposition and can be used personally before any business features are added.

### **MVP Core Feature: "Magic Create"**
The entire MVP centers around one magical user flow that delivers immediate value:

**Input**: Voice/text description of desired slideshow
**Processing**: AI analyzes photo library and applies viral templates  
**Output**: Ready-to-post viral slideshow with hooks, captions, and hashtags
**Time**: Under 10 seconds total

### **MVP Feature Specification**

#### **Essential MVP Features (Week 1-2 Build)**

##### 1. **Simple Photo Library Management**
- Upload photos via mobile camera or gallery selection
- Store up to 50 photos in Cloudflare R2
- Basic grid view of uploaded photos
- Delete/replace photos functionality
- **Acceptance Criteria**: User can build library of 20+ authentic photos

##### 2. **Voice-to-Slideshow AI Core**
- Voice recording with speech-to-text conversion
- Text input as fallback option
- AI processing that:
  - Analyzes voice input for topic, mood, and style
  - Selects 6-8 optimal photos from library
  - Applies appropriate viral template
  - Generates viral hook and caption
  - Creates hashtag suggestions
- **Acceptance Criteria**: 95% successful voice recognition, <10 second processing

##### 3. **Viral Template Engine (3 Core Templates)**
- **"Day in My Life"**: For routine/lifestyle content
- **"Hidden Gems"**: For travel/discovery content  
- **"Before/After"**: For transformation content
- Each template includes:
  - Proven viral hook formulas
  - Caption structure templates
  - Optimal photo sequencing logic
- **Acceptance Criteria**: Templates generate captions that feel authentic and viral-ready

##### 4. **Slideshow Preview & Export**
- Native slideshow preview with transitions
- Text overlay positioning and styling
- TikTok-ready video export (9:16 ratio, MP4)
- Simple edit options (reorder slides, edit text)
- **Acceptance Criteria**: Exported content matches TikTok quality standards

##### 5. **Minimal Authentication**
- Simple email/password signup for personal use
- Basic user profile storage
- Session management
- **Acceptance Criteria**: Single user can access their content securely

#### **MVP Technical Architecture (Serverless)**

```
Frontend: React Native Expo (iOS/Android)
Backend: Next.js API Routes on Vercel (serverless)
Database: Supabase (PostgreSQL with JSONB)
Storage: Cloudflare R2 (single bucket)
AI: OpenRouter.ai (GPT-4o, Claude 3.5, Whisper)
Queue: Vercel Edge Functions (batch processing)
Real-time: Supabase Realtime subscriptions
Deployment: Vercel (API) + Expo Go (mobile)
```

#### **MVP Database Schema (Async-Ready)**

```sql
-- Asset library with async analysis support
asset_library (
  id UUID PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  r2_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  original_filename TEXT,
  ai_analysis JSONB, -- Rich metadata for fast querying
  analysis_status TEXT DEFAULT 'pending',
  viral_potential_score FLOAT,
  quality_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

slideshows (
  id UUID PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  title TEXT,
  template_used TEXT,
  voice_input TEXT,
  selected_assets JSONB, -- References to asset_library
  generated_caption TEXT,
  export_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_asset_analysis_status ON asset_library(analysis_status);
CREATE INDEX idx_asset_viral_score ON asset_library(viral_potential_score DESC);
```

#### **MVP User Flow (60 Second End-to-End)**

1. **Setup (One-time)**: Upload 20+ authentic photos to library (5 minutes)
2. **Create**: Tap "Magic Create" button
3. **Input**: Record 5-second voice description: "Create a morning routine slideshow with motivational vibes"
4. **AI Processing**: 8 seconds of AI magic
5. **Preview**: See completed slideshow with viral caption
6. **Export**: One-tap export to camera roll
7. **Post**: Share to TikTok manually

#### **MVP Success Metrics**
- **Speed**: 95% of creations complete in <10 seconds
- **Quality**: 80% of outputs rated "would post as-is"
- **Viral Potential**: AI-generated captions score >7/10 on viral potential
- **User Satisfaction**: Personal use validates the core magic

#### **MVP Scope Exclusions (Save for Later)**
- ❌ Payment/subscription system
- ❌ Multi-user support
- ❌ Bulk processing
- ❌ Advanced editing tools
- ❌ Social media integrations
- ❌ Analytics dashboard
- ❌ Community features
- ❌ App Store deployment
- ❌ Multiple template categories

#### **MVP Development Timeline**

**Week 1**: Serverless Foundation + Async System
- Next.js API Routes setup on Vercel
- OpenRouter.ai integration
- Async photo upload to R2 + queue analysis
- Batch analysis edge functions (5-10 images per call)
- Basic React Native UI with real-time updates

**Week 2**: Fast Slideshow Generation
- Pre-computed asset analysis for lightning-fast creation
- Voice-to-slideshow using OpenRouter → Whisper
- JSONB queries for optimal photo selection
- Viral template implementation with analyzed metadata
- TikTok video export functionality

**Week 3**: Personal Testing & Optimization
- Load 100+ personal photos for batch analysis testing
- Test various voice inputs with OpenRouter models
- Validate <10 second slideshow generation using pre-analyzed assets
- Real-time UI updates during async processing
- Performance optimization and error handling

#### **MVP Validation Criteria**
The MVP is successful if:
1. **Personal Value**: You personally use it to create slideshows you actually post
2. **Speed Achievement**: Consistently creates slideshows in under 10 seconds
3. **Quality Output**: 8/10 generated slideshows feel viral-ready without editing
4. **Magic Factor**: The experience feels genuinely magical and time-saving

#### **Post-MVP Expansion Path**
Once the core magic is validated:
1. **Business Layer**: Add authentication, payments, multi-user
2. **Scaling Features**: Bulk processing, advanced templates
3. **Distribution**: App Store deployment, marketing
4. **Optimization**: Analytics, A/B testing, performance tracking

---

## Technical Implementation Priorities

### Phase 1: Magic MVP (Weeks 1-3)
- Focus entirely on the core "Magic Create" feature
- Single-user personal use validation
- Prove AI can consistently create viral-ready content
- Achieve <10 second processing speed

### Phase 2: Business Foundation (Months 1-2)
- Multi-user authentication and data isolation
- Payment system and subscription tiers
- App Store deployment preparation
- Basic analytics and usage tracking

### Phase 3: Scale & Advanced Features (Months 2-4)
- Bulk processing capabilities
- Social media integrations
- Advanced editing tools
- Community features and sharing

---

## Risk Mitigation

### Technical Risks
- **10-Second Processing Requirement**: Pre-process common templates, edge computing
- **Bulk Upload Performance**: Parallel processing, progressive enhancement
- **AI Accuracy**: Multiple model ensemble, human feedback loop

### Market Risks
- **Algorithm Changes**: Multi-platform approach, format agnostic
- **Competition**: Focus on speed + authenticity as core differentiator
- **Viral Formula Changes**: Continuous research and template updates

---

## Conclusion

Famatic.app positions itself as the fastest, most effective way to turn authentic photos into viral TikTok content. By focusing on research-backed viral formulas, 10-second creation speed, and powerful bulk processing for serious creators, the app solves the real problem: turning genuine moments into engaging content that actually performs.

The premium Viral Studio tier targeting power creators with bulk features and TikTok integration provides a clear path to significant revenue while the core magic experience ensures viral word-of-mouth growth.

Success depends on delivering the "magic" experience - where users genuinely feel their authentic content can compete with professional creators through AI assistance and proven viral science.