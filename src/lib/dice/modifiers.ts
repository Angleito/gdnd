import type { AbilityType } from './types';
import type { Stats } from '@/types/game';

export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getAbilityScore(stats: Stats, ability: AbilityType): number {
  return stats[ability];
}

export function getAbilityModifier(stats: Stats, ability: AbilityType): number {
  const score = getAbilityScore(stats, ability);
  return calculateModifier(score);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}
