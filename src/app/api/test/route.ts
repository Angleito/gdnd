import { ai, MODELS } from '@/lib/gemini/client';
import { ThinkingLevel } from '@google/genai';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.DM,
      contents: 'Say "The dungeon awaits, adventurer!" in a dramatic voice.',
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    return NextResponse.json({
      success: true,
      message: response.text,
      models: MODELS,
    });
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
