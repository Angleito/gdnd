import { NextResponse } from 'next/server';
import { generateDMResponse, generateBackstory, summarizeHistory } from '@/lib/gemini/dm';
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
      const { player, history, action, skillCheck, historySummary } = body as {
        player: Player;
        history: GameMessage[];
        action: string;
        historySummary?: string | null;
        skillCheck?: {
          type: string;
          skill?: string;
          ability: string;
          roll: number;
          modifier: number;
          total: number;
          isCritical: boolean;
          isFumble: boolean;
          reason: string;
        };
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
        skillCheck,
        historySummary,
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

    if (type === 'summarize') {
      const { messages, existingSummary } = body as {
        messages: GameMessage[];
        existingSummary?: string | null;
      };

      if (!messages || messages.length === 0) {
        logger.api('POST', '/api/dm', 'error', { error: 'Missing messages' });
        return NextResponse.json(
          { error: 'Missing required field: messages' },
          { status: 400 }
        );
      }

      const summary = await summarizeHistory({ messages, existingSummary });
      const elapsed = Date.now() - startTime;

      logger.api('POST', '/api/dm', 'response', {
        type: 'summarize',
        summaryLength: summary.length,
      }, elapsed);

      return NextResponse.json({ summary });
    }

    logger.api('POST', '/api/dm', 'error', { error: 'Invalid type' });
    return NextResponse.json(
      { error: 'Invalid type. Use "backstory", "action", or "summarize"' },
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
