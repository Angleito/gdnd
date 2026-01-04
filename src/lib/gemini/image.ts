import { ai, MODELS } from './client';
import { PORTRAIT_STYLE_PROMPT, SCENE_STYLE_PROMPT } from '@/lib/game/prompts';
import { logger } from '@/lib/logger';

export async function generatePortrait(
  race: string,
  characterClass: string,
  name: string
): Promise<string> {
  const startTime = Date.now();
  const prompt = `${PORTRAIT_STYLE_PROMPT}

Subject: A ${race} ${characterClass} named ${name}. Show their face and upper body with class-appropriate gear and attire.`;

  logger.gemini('generatePortrait', 'request', {
    model: MODELS.IMAGE,
    race,
    class: characterClass,
    name,
    promptLength: prompt.length,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K',
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      logger.gemini('generatePortrait', 'error', { error: 'No image generated' }, elapsed);
      throw new Error('No image generated');
    }

    logger.gemini('generatePortrait', 'response', {
      imageSize: imagePart.inlineData.data.length,
      mimeType: imagePart.inlineData.mimeType,
    }, elapsed);

    return imagePart.inlineData.data;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generatePortrait', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}

export async function generateNPCPortrait(
  name: string,
  description: string
): Promise<string> {
  const startTime = Date.now();
  const prompt = `${PORTRAIT_STYLE_PROMPT}

Subject: ${name} - ${description}`;

  logger.gemini('generateNPCPortrait', 'request', {
    model: MODELS.IMAGE,
    name,
    description,
    promptLength: prompt.length,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K',
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      logger.gemini('generateNPCPortrait', 'error', { error: 'No image generated for NPC' }, elapsed);
      throw new Error('No image generated for NPC');
    }

    logger.gemini('generateNPCPortrait', 'response', {
      imageSize: imagePart.inlineData.data.length,
      mimeType: imagePart.inlineData.mimeType,
    }, elapsed);

    return imagePart.inlineData.data;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generateNPCPortrait', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}

export async function generateSceneSprite(description: string): Promise<string> {
  const startTime = Date.now();
  const prompt = `${SCENE_STYLE_PROMPT}

Scene: ${description}`;

  logger.gemini('generateSceneSprite', 'request', {
    model: MODELS.IMAGE,
    description,
    promptLength: prompt.length,
  });

  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: '16:9',
          imageSize: '1K',
        },
      },
    });

    const elapsed = Date.now() - startTime;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      logger.gemini('generateSceneSprite', 'error', { error: 'No scene image generated' }, elapsed);
      throw new Error('No scene image generated');
    }

    logger.gemini('generateSceneSprite', 'response', {
      imageSize: imagePart.inlineData.data.length,
      mimeType: imagePart.inlineData.mimeType,
    }, elapsed);

    return imagePart.inlineData.data;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.gemini('generateSceneSprite', 'error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }, elapsed);
    throw error;
  }
}
