import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockImageBase64, mockAiModelsGenerateContent } from '@/test/mocks/gemini';

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

import { generatePortrait, generateNPCPortrait, generateSceneSprite } from '../image';

const mockImageResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            inlineData: {
              data: mockImageBase64,
              mimeType: 'image/png',
            },
          },
        ],
      },
    },
  ],
};

describe('generatePortrait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue(mockImageResponse);
  });

  it('generates a portrait for a character', async () => {
    const result = await generatePortrait('Dwarf', 'Fighter', 'Thorin');

    expect(result).toBe(mockImageBase64);
    expect(mockAiModelsGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('uses correct model and image config', async () => {
    await generatePortrait('Elf', 'Wizard', 'Elara');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-3-pro-image-preview');
    expect(call.config.responseModalities).toContain('IMAGE');
    expect(call.config.imageConfig.aspectRatio).toBe('1:1');
  });

  it('includes character details in prompt', async () => {
    await generatePortrait('Human', 'Rogue', 'Shadow');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('Human');
    expect(call.contents).toContain('Rogue');
    expect(call.contents).toContain('Shadow');
  });

  it('throws error when no image generated', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      candidates: [{ content: { parts: [] } }],
    });

    await expect(generatePortrait('Human', 'Fighter', 'Test')).rejects.toThrow(
      'No image generated'
    );
  });
});

describe('generateNPCPortrait', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue(mockImageResponse);
  });

  it('generates a portrait for an NPC', async () => {
    const result = await generateNPCPortrait(
      'Mysterious Stranger',
      'A cloaked figure with piercing eyes'
    );

    expect(result).toBe(mockImageBase64);
  });

  it('uses 1:1 aspect ratio for NPC portraits', async () => {
    await generateNPCPortrait('Bartender', 'A burly man with a friendly smile');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.config.imageConfig.aspectRatio).toBe('1:1');
  });

  it('throws error when no NPC image generated', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      candidates: [{ content: { parts: [{ text: 'no image' }] } }],
    });

    await expect(
      generateNPCPortrait('Test NPC', 'Test description')
    ).rejects.toThrow('No image generated for NPC');
  });
});

describe('generateSceneSprite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue(mockImageResponse);
  });

  it('generates a scene sprite', async () => {
    const result = await generateSceneSprite('A dark and mysterious tavern');

    expect(result).toBe(mockImageBase64);
  });

  it('uses 16:9 aspect ratio for scenes', async () => {
    await generateSceneSprite('A forest clearing at dawn');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.config.imageConfig.aspectRatio).toBe('16:9');
  });

  it('includes scene description in prompt', async () => {
    await generateSceneSprite('An ancient dungeon entrance');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.contents).toContain('ancient dungeon entrance');
  });

  it('throws error when no scene image generated', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      candidates: [],
    });

    await expect(generateSceneSprite('Test scene')).rejects.toThrow(
      'No scene image generated'
    );
  });
});
