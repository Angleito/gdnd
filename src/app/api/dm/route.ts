import { NextResponse } from 'next/server';
import { generateDMResponse, generateBackstory } from '@/lib/gemini/dm';
import { logger } from '@/lib/logger';
import type { Player, GameMessage } from '@/types/game';

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { type } = body;

    logger.api('POST', '/api/dm', 'request', { type, ...body });

    if (type === 'backstory') {
      const { name, race, characterClass } = body;
      
      if (!name || !race || !characterClass) {
        logger.api('POST', '/api/dm', 'error', { error: 'Missing required fields' });
        return NextResponse.json(
          { error: 'Missing required fields: name, race, characterClass' },
          { status: 400 }
        );
      }

      const result = await generateBackstory({ name, race, characterClass });
      const elapsed = Date.now() - startTime;
      
      logger.api('POST', '/api/dm', 'response', {
        type: 'backstory',
        backstoryLength: result.backstory.length,
        startingSceneLength: result.startingScene.length,
        actionsCount: result.firstActions.length,
      }, elapsed);

      return NextResponse.json(result);
    }

    if (type === 'action') {
      const { player, history, action } = body as {
        player: Player;
        history: GameMessage[];
        action: string;
      };

      if (!player || !action) {
        logger.api('POST', '/api/dm', 'error', { error: 'Missing required fields' });
        return NextResponse.json(
          { error: 'Missing required fields: player, action' },
          { status: 400 }
        );
      }

      const result = await generateDMResponse({
        player,
        history: history || [],
        action,
      });

      const elapsed = Date.now() - startTime;
      
      logger.api('POST', '/api/dm', 'response', {
        type: 'action',
        narrativeLength: result.narrative.length,
        actionsCount: result.actions.length,
        hasNewCharacter: !!result.newCharacter,
        hasNewScene: !!result.newScene,
        hasCombat: !!result.combat,
      }, elapsed);

      return NextResponse.json(result);
    }

    logger.api('POST', '/api/dm', 'error', { error: 'Invalid type' });
    return NextResponse.json(
      { error: 'Invalid type. Use "backstory" or "action"' },
      { status: 400 }
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.api('POST', '/api/dm', 'error', {
      error: error instanceof Error ? error.message : 'Internal server error',
    }, elapsed);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
