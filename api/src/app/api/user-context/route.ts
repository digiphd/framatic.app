import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase/client';
import { UserContextInput } from '@/types/user-context';

const MVP_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const userContext = await db.getUserContext(userId);

    if (!userContext) {
      return NextResponse.json({
        success: false,
        message: 'User context not found',
        context: null
      });
    }

    return NextResponse.json({
      success: true,
      context: userContext
    });

  } catch (error) {
    console.error('Error fetching user context:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const contextInput: UserContextInput = await request.json();

    // Validate required fields
    if (!contextInput.creator_type || !contextInput.tone_of_voice || !contextInput.content_goals) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: creator_type, tone_of_voice, content_goals'
        },
        { status: 400 }
      );
    }

    // Prepare context data for database
    const contextData = {
      user_id: userId,
      creator_type: contextInput.creator_type,
      business_category: contextInput.business_category || null,
      tone_of_voice: contextInput.tone_of_voice,
      target_audience: contextInput.target_audience || null,
      content_goals: contextInput.content_goals,
      posting_frequency: contextInput.posting_frequency || 'weekly',
      preferred_hashtags: contextInput.preferred_hashtags || [],
      brand_keywords: contextInput.brand_keywords || [],
      content_style_preferences: contextInput.content_style_preferences || null,
      viral_content_examples: contextInput.viral_content_examples || null,
      context_learning_data: null // Will be populated as user creates content
    };

    // Upsert context (create or update)
    const savedContext = await db.upsertUserContext(userId, contextData);

    return NextResponse.json({
      success: true,
      message: 'User context saved successfully',
      context: savedContext
    });

  } catch (error) {
    console.error('Error saving user context:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save user context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || MVP_USER_ID;

    const updates = await request.json();

    // Check if user context exists
    const existingContext = await db.getUserContext(userId);
    if (!existingContext) {
      return NextResponse.json(
        {
          success: false,
          error: 'User context not found. Please create context first.'
        },
        { status: 404 }
      );
    }

    // Update context
    const updatedContext = await db.updateUserContext(userId, updates);

    return NextResponse.json({
      success: true,
      message: 'User context updated successfully',
      context: updatedContext
    });

  } catch (error) {
    console.error('Error updating user context:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user context',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}