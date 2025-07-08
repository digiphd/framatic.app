# Framatic.app

AI-powered viral TikTok/Instagram slideshow creator that transforms authentic photos into engaging content in under 10 seconds.

## Architecture

This is a monorepo containing:

- **`api/`** - Next.js serverless API on Vercel
- **`mobile/`** - React Native Expo mobile app
- **`shared/`** - Shared TypeScript types and utilities

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL with JSONB)
- **Storage**: Cloudflare R2
- **AI**: OpenRouter.ai (GPT-4o, Claude 3.5, Whisper)
- **Deployment**: Vercel (API) + Expo (Mobile)

## Development

### Prerequisites

- Node.js 18+
- npm
- Expo CLI
- OpenRouter.ai API key
- Supabase account
- Cloudflare R2 account

### Setup

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Copy and configure environment files
cp api/.env.example api/.env.local
cp mobile/.env.example mobile/.env.local
```

3. Start development servers:
```bash
npm run dev
```

This will start both the API server and mobile app concurrently.

### Available Scripts

- `npm run dev` - Start both API and mobile in development
- `npm run build` - Build both projects for production
- `npm run type-check` - Run TypeScript checks
- `npm run lint` - Run ESLint

### Project Structure

```
├── api/                    # Next.js API (Serverless)
│   ├── src/app/api/       # API routes
│   ├── src/lib/           # Utilities and services
│   └── src/types/         # API-specific types
├── mobile/                # React Native Expo app
│   ├── src/              # Mobile app source
│   ├── components/       # React components
│   └── screens/          # App screens
├── shared/               # Shared code
│   ├── src/types/        # Common TypeScript types
│   ├── src/utils/        # Utility functions
│   └── src/constants/    # App constants
└── claude.md             # Product requirements
```

## Features

### MVP Core Features

1. **Async Image Analysis** - Batch processing with OpenRouter.ai
2. **Voice-to-Slideshow** - 10-second AI-powered creation
3. **Viral Templates** - Research-backed formats
4. **Real-time Updates** - Supabase subscriptions
5. **Fast Export** - TikTok-ready video generation

### Architecture Highlights

- **Serverless Scaling**: Vercel Edge Functions handle AI workload
- **Async Processing**: 5-10 images per batch for optimal performance
- **JSONB Querying**: Lightning-fast asset selection
- **Real-time UI**: Live analysis progress updates
- **Cost Optimization**: OpenRouter.ai model switching

## Deployment

### API (Vercel)

```bash
cd api
vercel deploy
```

### Mobile (Expo)

```bash
cd mobile
expo build
```

## Environment Variables

### API (.env.local)
```
OPENROUTER_API_KEY=your_openrouter_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
CLOUDFLARE_R2_ENDPOINT=your_r2_endpoint
CLOUDFLARE_R2_ACCESS_KEY=your_r2_access_key
CLOUDFLARE_R2_SECRET_KEY=your_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
```

### Mobile (.env.local)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Follow the existing code style
2. Update types in `shared/` for API changes
3. Test both API and mobile before committing
4. Use conventional commits

## License

Private - All rights reserved