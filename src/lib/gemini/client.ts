import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const MODELS = {
  DM: 'gemini-3-flash-preview',
  IMAGE: 'gemini-3-pro-image-preview',
  TTS: 'gemini-2.5-flash-preview-tts',
} as const;

export type ModelType = keyof typeof MODELS;
