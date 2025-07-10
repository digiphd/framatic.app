import { NextRequest, NextResponse } from 'next/server';
import { openRouter } from '@/lib/openrouter/client';

export async function POST(request: NextRequest) {
  try {
    console.log('Voice-to-text API called');
    
    // Get the uploaded audio file
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('No audio file provided');
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Validate file type and size
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/x-m4a', 'audio/vnd.wave'];
    if (!allowedTypes.includes(audioFile.type)) {
      console.error('Invalid audio format:', audioFile.type);
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid audio format. Supported: ${allowedTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check file size (max 25MB for Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      console.error('Audio file too large:', audioFile.size);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Audio file too large. Max size: 25MB' 
        },
        { status: 400 }
      );
    }

    try {
      // Transcribe using OpenRouter Whisper
      console.log('Starting transcription with OpenRouter Whisper...');
      console.log('Audio file details:', {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      });
      
      const transcription = await openRouter.voiceToText(audioFile);
      
      console.log('Transcription successful:', transcription);

      return NextResponse.json({
        success: true,
        text: transcription,
        metadata: {
          file_size: audioFile.size,
          file_type: audioFile.type,
          duration_estimate: audioFile.size / 16000 // Rough estimate in seconds
        }
      });

    } catch (transcriptionError) {
      console.error('Transcription failed:', transcriptionError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transcription failed',
          details: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown transcription error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Voice-to-text API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Voice-to-text API is ready',
    supported_formats: ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/mpeg'],
    max_file_size: '25MB',
    model: 'openai/whisper-1'
  });
}