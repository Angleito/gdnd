import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function base64ToDataUrl(base64: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}

export function base64ToAudioUrl(base64: string): string {
  return `data:audio/wav;base64,${base64}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines if a scene image should be regenerated based on description similarity.
 * Returns true if descriptions are less than 70% similar (should regenerate).
 */
export function shouldRegenerateScene(oldDesc: string | null, newDesc: string): boolean {
  if (!oldDesc) return true;
  
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const oldWords = new Set(normalize(oldDesc).split(/\s+/).filter(Boolean));
  const newWords = new Set(normalize(newDesc).split(/\s+/).filter(Boolean));
  
  if (oldWords.size === 0 || newWords.size === 0) return true;
  
  const intersection = [...newWords].filter(w => oldWords.has(w)).length;
  const similarity = intersection / Math.max(oldWords.size, newWords.size);
  
  return similarity < 0.7;
}
