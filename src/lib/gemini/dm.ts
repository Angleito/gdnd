import { ai, MODELS } from './client';
import { ThinkingLevel } from '@google/genai';
import { DMResponseSchema, BackstoryResponseSchema } from '@/lib/game/schemas';
import { DM_SYSTEM_PROMPT, BACKSTORY_PROMPT, buildPlayerContext } from '@/lib/game/prompts';
import { logger } from '@/lib/logger';
import type { Player, GameMessage } from '@/types/game';
import type { DMResponseType } from '@/lib/game/schemas';

interface GenerateDMResponseParams {
  player: Player;
  history: GameMessage[];
  action: string;
}

export async function generateDMResponse({
  player,
  history,
  action,
}: GenerateDMResponseParams): Promise<DMResponseType> {
  const startTime = Date.now();
  const trimmedHistory = history.slice(-20);

  logger.gemini('generateDMResponse', 'request', {
    model: MODELS.DM,
    thinkingLevel: 'HIGH',
    historyLength: trimmedHistory.length,
    action,
    playerName: player.name,
  });

  const contents = [
    {
      role: 'user' as const,
      parts: [{ text: DM_SYSTEM_PROMPT }],
    },
    {
      role: 'model' as const,
      parts: [{ text: 'Understood. I am your Dungeon Master. I will respond only in the specified JSON format.' }],
    },
    ...trimmedHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [
        {
          text: `${buildPlayerContext(player)}

PLAYER ACTION: ${action}

Respond with the next scene in JSON format.`,
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODELS.DM,
      contents,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            narrative: { type: 'string' },
            actions: { type: 'array', items: { type: 'string' } },
            newCharacter: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
              nullable: true,
            },
            newScene: {
              type: 'object',
              properties: {
                description: { type: 'string' },
              },
              nullable: true,
            },
            stateChanges: {
              type: 'object',
              properties: {
                hpDelta: { type: 'number' },
                goldDelta: { type: 'number' },
                addItems: { type: 'array', items: { type: 'string' } },
                removeItems: { type: 'array', items: { type: 'string' } },
              },
              nullable: true,
            },
            combat: {
              type: 'object',
              properties: {
                inCombat: { type: 'boolean' },
                enemies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      hp: {
                        type: 'object',
                        properties: {
                          current: { type: 'number' },
                          max: { type: 'number' },
                        },
                      },
                    },
                  },
                },
                turnOrder: { type: 'array', items: { type: 'string' } },
                currentTurn: { type: 'string' },
              },
              nullable: true,
            },
          },
          required: ['narrative', 'actions'],
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const text = response.text;
    
    if (!text) {
      logger.gemini('generateDMResponse', 'error', { error: 'No response from DM' }, elapsed);
      throw new Error('No response from DM');
    }

    const parsed = DMResponseSchema.parse(JSON.parse(text));

    logger.gemini('generateDMResponse', 'response', {
      narrative: parsed.narrative,
      actionsCount: parsed.actions.length,
      hasNewCharacter: !!parsed.newCharacter,
      hasNewScene: !!parsed.newScene,
      hasStateChanges: !!parsed.stateChanges,
      hasCombat: !!parsed.combat,
    }, elapsed);

    return parsed;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generateDMResponse', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}

interface GenerateBackstoryParams {
  name: string;
  race: string;
  characterClass: string;
}

export async function generateBackstory({
  name,
  race,
  characterClass,
}: GenerateBackstoryParams) {
  const startTime = Date.now();

  logger.gemini('generateBackstory', 'request', {
    model: MODELS.DM,
    thinkingLevel: 'HIGH',
    name,
    race,
    characterClass,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.DM,
      contents: `${BACKSTORY_PROMPT}

CHARACTER:
- Name: ${name}
- Race: ${race}
- Class: ${characterClass}

Generate their backstory and opening scene.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
      },
    });

    const elapsed = Date.now() - startTime;
    const text = response.text;
    
    if (!text) {
      logger.gemini('generateBackstory', 'error', { error: 'No response for backstory' }, elapsed);
      throw new Error('No response for backstory');
    }

    const parsed = BackstoryResponseSchema.parse(JSON.parse(text));

    logger.gemini('generateBackstory', 'response', {
      backstory: parsed.backstory,
      startingScene: parsed.startingScene,
      firstActionsCount: parsed.firstActions.length,
    }, elapsed);

    return parsed;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generateBackstory', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}
