import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockAudioBase64, mockAiModelsGenerateContent } from '@/test/mocks/gemini';

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

import { generateNarration } from '../tts';

const mockAudioResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            inlineData: {
              data: mockAudioBase64,
              mimeType: 'audio/wav',
            },
          },
        ],
      },
    },
  ],
};

describe('generateNarration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAiModelsGenerateContent.mockResolvedValue(mockAudioResponse);
  });

  it('generates audio narration from text', async () => {
    const result = await generateNarration('Welcome to the adventure!');

    expect(result).toBe(mockAudioBase64);
    expect(mockAiModelsGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('uses default voice when not specified', async () => {
    await generateNarration('Test narration');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore');
  });

  it('uses specified voice', async () => {
    await generateNarration('Test with different voice', 'Puck');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Puck');
  });

  it('uses correct model and config', async () => {
    await generateNarration('Another test');

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.model).toBe('gemini-2.5-flash-preview-tts');
    expect(call.config.responseModalities).toContain('AUDIO');
  });

  it('passes the text content correctly', async () => {
    const testText = 'You enter a dimly lit tavern.';
    await generateNarration(testText);

    const call = mockAiModelsGenerateContent.mock.calls[0][0];
    expect(call.contents).toBe(testText);
  });

  it('throws error when no audio generated', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      candidates: [{ content: { parts: [] } }],
    });

    await expect(generateNarration('Test')).rejects.toThrow('No audio generated');
  });

  it('throws error when response has no inline data', async () => {
    mockAiModelsGenerateContent.mockResolvedValueOnce({
      candidates: [{ content: { parts: [{ text: 'no audio' }] } }],
    });

    await expect(generateNarration('Test')).rejects.toThrow('No audio generated');
  });
});
