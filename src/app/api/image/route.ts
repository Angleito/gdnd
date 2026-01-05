import { NextResponse } from 'next/server';
import { generatePortrait, generateNPCPortrait, generateSceneSprite } from '@/lib/gemini/image';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { type } = body;

    logger.api('POST', '/api/image', 'request', { type, ...body });

    if (type === 'player') {
      const { race, characterClass, name } = body;
      
      if (!race || !characterClass || !name) {
        logger.api('POST', '/api/image', 'error', { error: 'Missing required fields' });
        return NextResponse.json(
          { error: 'Missing required fields: race, characterClass, name' },
          { status: 400 }
        );
      }

      const image = await generatePortrait(race, characterClass, name);
      const elapsed = Date.now() - startTime;
      
      logger.api('POST', '/api/image', 'response', {
        type: 'player',
        imageSize: image.length,
      }, elapsed);

      return NextResponse.json({ image });
    }

    if (type === 'npc') {
      const { name, description } = body;
      
      if (!name || !description) {
        logger.api('POST', '/api/image', 'error', { error: 'Missing required fields' });
        return NextResponse.json(
          { error: 'Missing required fields: name, description' },
          { status: 400 }
        );
      }

      const image = await generateNPCPortrait(name, description);
      const elapsed = Date.now() - startTime;
      
      logger.api('POST', '/api/image', 'response', {
        type: 'npc',
        imageSize: image.length,
      }, elapsed);

      return NextResponse.json({ image });
    }

    if (type === 'scene') {
      const { description } = body;
      
      if (!description) {
        logger.api('POST', '/api/image', 'error', { error: 'Missing required field' });
        return NextResponse.json(
          { error: 'Missing required field: description' },
          { status: 400 }
        );
      }

      const image = await generateSceneSprite(description);
      const elapsed = Date.now() - startTime;
      
      logger.api('POST', '/api/image', 'response', {
        type: 'scene',
        imageSize: image.length,
      }, elapsed);

      return NextResponse.json({ image });
    }

    logger.api('POST', '/api/image', 'error', { error: 'Invalid type' });
    return NextResponse.json(
      { error: 'Invalid type. Use "player", "npc", or "scene"' },
      { status: 400 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorDetails = error instanceof Error && 'cause' in error ? error.cause : undefined;
    
    logger.api('POST', '/api/image', 'error', {
      error: errorMessage,
      details: errorDetails,
      stack: error instanceof Error ? error.stack : undefined,
    }, elapsed);
    
    // Check for quota/rate limit errors
    const isQuotaError = errorMessage.includes('quota') || 
                         errorMessage.includes('429') || 
                         errorMessage.includes('RESOURCE_EXHAUSTED');
    
    return NextResponse.json(
      { 
        error: isQuotaError ? 'API quota exceeded. Please try again later.' : errorMessage,
        retryable: isQuotaError,
      },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}
