#!/bin/bash

echo "🚀 Setting up Famatic.app environment files..."

# Create API environment file
if [ ! -f "api/.env.local" ]; then
    cp api/.env.example api/.env.local
    echo "✅ Created api/.env.local"
else
    echo "⚠️  api/.env.local already exists"
fi

# Create Mobile environment file
if [ ! -f "mobile/.env.local" ]; then
    cp mobile/.env.example mobile/.env.local
    echo "✅ Created mobile/.env.local"
else
    echo "⚠️  mobile/.env.local already exists"
fi

# Create Root environment file
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local"
else
    echo "⚠️  .env.local already exists"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Edit api/.env.local with your OpenRouter, Supabase, and Cloudflare R2 credentials"
echo "2. Edit mobile/.env.local with your Supabase public URL and anon key"
echo "3. Run 'npm run dev' to start both API and mobile apps"
echo ""
echo "📖 See README.md for detailed setup instructions"