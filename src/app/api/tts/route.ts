import { NextResponse } from 'next/server';
import { generateNarration } from '@/lib/gemini/tts';
import { logger } from '@/lib/logger';
import type { TTSVoice } from '@/lib/game/constants';

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { text, voice = 'Kore' } = body as { text: string; voice?: TTSVoice };

    logger.api('POST', '/api/tts', 'request', {
      textLength: text?.length,
      voice,
    });

    if (!text) {
      logger.api('POST', '/api/tts', 'error', { error: 'Missing required field' });
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      logger.api('POST', '/api/tts', 'error', { error: 'Text too long' });
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    const audio = await generateNarration(text, voice);
    const elapsed = Date.now() - startTime;
    
    logger.api('POST', '/api/tts', 'response', {
      audioSize: audio.length,
      voice,
    }, elapsed);

    return NextResponse.json({ audio });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.api('POST', '/api/tts', 'error', {
      error: error instanceof Error ? error.message : 'Internal server error',
    }, elapsed);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
