import { ai, MODELS } from './client';
import { logger } from '@/lib/logger';
import type { TTSVoice } from '@/lib/game/constants';

export async function generateNarration(
  text: string,
  voice: TTSVoice = 'Kore'
): Promise<string> {
  const startTime = Date.now();

  logger.gemini('generateNarration', 'request', {
    model: MODELS.TTS,
    voice,
    textLength: text.length,
    text: text.substring(0, 100),
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const audioPart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!audioPart?.inlineData?.data) {
      logger.gemini('generateNarration', 'error', { error: 'No audio generated' }, elapsed);
      throw new Error('No audio generated');
    }

    logger.gemini('generateNarration', 'response', {
      audioSize: audioPart.inlineData.data.length,
      mimeType: audioPart.inlineData.mimeType,
    }, elapsed);

    return audioPart.inlineData.data;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generateNarration', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}
