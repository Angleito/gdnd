import { ai, MODELS } from './client';
import { ThinkingLevel } from '@google/genai';
import { DMResponseSchema, BackstoryResponseSchema } from '@/lib/game/schemas';
import { DM_SYSTEM_PROMPT, BACKSTORY_PROMPT, buildPlayerContext, buildSkillCheckContext } from '@/lib/game/prompts';
import type { SkillCheckContext } from '@/lib/game/prompts';
import { logger } from '@/lib/logger';
import type { Player, GameMessage } from '@/types/game';
import type { DMResponseType } from '@/lib/game/schemas';

interface GenerateDMResponseParams {
  player: Player;
  history: GameMessage[];
  action: string;
  skillCheck?: SkillCheckContext;
  historySummary?: string | null;
}

export async function generateDMResponse({
  player,
  history,
  action,
  skillCheck,
  historySummary,
}: GenerateDMResponseParams): Promise<DMResponseType> {
  const startTime = Date.now();
  // Use last 10 messages if we have a summary, otherwise last 20
  const trimmedHistory = historySummary ? history.slice(-10) : history.slice(-20);

  logger.gemini('generateDMResponse', 'request', {
    model: MODELS.DM,
    thinkingLevel: 'HIGH',
    historyLength: trimmedHistory.length,
    hasSummary: !!historySummary,
    action,
    playerName: player.name,
    hasSkillCheck: !!skillCheck,
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
    // If we have a summary, include it before recent history
    ...(historySummary ? [{
      role: 'user' as const,
      parts: [{ text: `STORY SO FAR: ${historySummary}` }],
    }, {
      role: 'model' as const,
      parts: [{ text: 'I understand the story context. Continuing the adventure...' }],
    }] : []),
    ...trimmedHistory.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user' as const,
      parts: [
        {
          text: `${buildPlayerContext(player)}
${skillCheck ? `\n${buildSkillCheckContext(skillCheck)}\n` : ''}
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
            combatLog: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  turn: { type: 'number' },
                  type: { type: 'string', enum: ['attack', 'damage', 'miss', 'heal', 'spell', 'status', 'narrative', 'roll', 'critical', 'fumble'] },
                  actor: { type: 'string' },
                  target: { type: 'string' },
                  action: { type: 'string' },
                  diceRoll: {
                    type: 'object',
                    properties: {
                      dice: { type: 'string', enum: ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'] },
                      count: { type: 'number' },
                      rolls: { type: 'array', items: { type: 'number' } },
                      modifier: { type: 'number' },
                      total: { type: 'number' },
                      purpose: { type: 'string' },
                    },
                  },
                  result: { type: 'string', enum: ['hit', 'miss', 'critical', 'fumble', 'success', 'failure'] },
                  value: { type: 'number' },
                  damageType: { type: 'string' },
                },
                required: ['turn', 'type', 'actor', 'action'],
              },
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
      combatLogEntries: parsed.combatLog?.length ?? 0,
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

interface SummarizeHistoryParams {
  messages: GameMessage[];
  existingSummary?: string | null;
}

export async function summarizeHistory({
  messages,
  existingSummary,
}: SummarizeHistoryParams): Promise<string> {
  const startTime = Date.now();

  const recentMessages = messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n');
  const content = existingSummary
    ? `Previous summary:\n${existingSummary}\n\nNew events:\n${recentMessages}`
    : recentMessages;

  logger.gemini('summarizeHistory', 'request', {
    model: MODELS.DM,
    thinkingLevel: 'LOW',
    messageCount: messages.length,
    hasExistingSummary: !!existingSummary,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.DM,
      contents: `You are summarizing a D&D adventure history. Create a concise summary (2-3 sentences) that preserves:
- Key events and plot points
- NPCs met and their relationships
- Items gained or lost
- Current situation and location

${content}

Provide only the summary, no additional commentary.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const elapsed = Date.now() - startTime;
    const text = response.text;

    if (!text) {
      logger.gemini('summarizeHistory', 'error', { error: 'No response for summary' }, elapsed);
      throw new Error('No response for summary');
    }

    logger.gemini('summarizeHistory', 'response', {
      summaryLength: text.length,
    }, elapsed);

    return text;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('summarizeHistory', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}
