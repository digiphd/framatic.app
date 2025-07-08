import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check environment variables
  const services = {
    database: process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ? 'configured' : 'missing',
    storage: process.env.CLOUDFLARE_R2_ENDPOINT && process.env.CLOUDFLARE_R2_ACCESS_KEY ? 'configured' : 'missing',
    ai: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing'
  };

  const allConfigured = Object.values(services).every(status => status === 'configured');

  return NextResponse.json({
    status: allConfigured ? 'ok' : 'partial',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services,
    message: allConfigured 
      ? 'All services configured' 
      : 'Some services need configuration - check .env.local'
  });
}