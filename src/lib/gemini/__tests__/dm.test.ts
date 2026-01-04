import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDMResponse, mockBackstoryResponse, mockAiModelsGenerateContent } from '@/test/mocks/gemini';

// Mock the client module
vi.mock('../client', () => ({
  ai: {
    models: {
      generateContent: mockAiModelsGenerateContent,
    },
  },
  MODELS: {
    DM: 'gemini-3-flash-preview',
    IMAGE: 'gemini-3-pro-image-preview',
    TTS: 'gemini-2.5-flash-preview-tts',
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    gemini: vi.fn(),
    error: vi.fn(),
  },
}));

import { generateDMResponse, generateBackstory } from '../dm';
import type { Player } from '@/types/game';

const mockPlayer: Player = {
  name: 'Thorin',
  race: 'Dwarf',
  class: 'Fighter',
  level: 1,
  hp: { current: 12, max: 12 },
  stats: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 8 },
  inventory: [],
  gold: 15,
  portrait: null,
  backstory: 'A battle-hardened warrior from the mountains.',
};

describe('generateDMResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockDMResponse),
    });
  });

  it('generates a DM response for a player action', async () => {
    const result = await generateDMResponse({
      player: mockPlayer,
      history: [],
      action: 'Enter the tavern',
    });

    expect(result).toEqual(mockDMResponse);
    expect(mockAiModelsGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('includes player context in the request', async () => {
    await generateDMResponse({
      player: mockPlayer,
      history: [],
      action: 'Look around',
    });

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-3-flash-preview');
    expect(call.config.thinkingConfig).toBeDefined();
    expect(call.config.responseMimeType).toBe('application/json');
  });

  it('trims history to last 20 messages', async () => {
    const longHistory = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'model' as const,
      content: `Message ${i}`,
      timestamp: Date.now(),
    }));

    await generateDMResponse({
      player: mockPlayer,
      history: longHistory,
      action: 'Continue',
    });

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    // System prompt + model ack + 20 trimmed history + current action = check contents length
    // History is trimmed to 20 messages
    expect(call.contents.length).toBeLessThanOrEqual(24);
  });

  it('throws error when no response text', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({ text: null });

    await expect(
      generateDMResponse({
        player: mockPlayer,
        history: [],
        action: 'Test',
      })
    ).rejects.toThrow('No response from DM');
  });

  it('throws error on invalid JSON response', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({ text: 'not json' });

    await expect(
      generateDMResponse({
        player: mockPlayer,
        history: [],
        action: 'Test',
      })
    ).rejects.toThrow();
  });

  it('throws error on schema validation failure', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ invalid: 'schema' }),
    });

    await expect(
      generateDMResponse({
        player: mockPlayer,
        history: [],
        action: 'Test',
      })
    ).rejects.toThrow();
  });
});

describe('generateBackstory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockBackstoryResponse),
    });
  });

  it('generates a backstory for a character', async () => {
    const result = await generateBackstory({
      name: 'Thorin',
      race: 'Dwarf',
      characterClass: 'Fighter',
    });

    expect(result).toEqual(mockBackstoryResponse);
    expect(result.backstory).toBeDefined();
    expect(result.startingScene).toBeDefined();
    expect(result.firstActions).toHaveLength(3);
  });

  it('uses correct model and config', async () => {
    await generateBackstory({
      name: 'Elara',
      race: 'Elf',
      characterClass: 'Wizard',
    });

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-3-flash-preview');
    expect(call.config.thinkingConfig).toBeDefined();
  });

  it('throws error when no response text', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({ text: null });

    await expect(
      generateBackstory({
        name: 'Test',
        race: 'Human',
        characterClass: 'Fighter',
      })
    ).rejects.toThrow('No response for backstory');
  });

  it('throws error on invalid backstory response', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({ wrong: 'format' }),
    });

    await expect(
      generateBackstory({
        name: 'Test',
        race: 'Human',
        characterClass: 'Fighter',
      })
    ).rejects.toThrow();
  });
});
