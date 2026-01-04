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
    logger.api('POST', '/api/image', 'error', {
      error: error instanceof Error ? error.message : 'Internal server error',
    }, elapsed);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
