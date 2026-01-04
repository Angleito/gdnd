import { describe, it, expect } from 'vitest';
import { buildPlayerContext, DM_SYSTEM_PROMPT, BACKSTORY_PROMPT } from '../prompts';
import type { Player } from '@/types/game';

const mockPlayer: Player = {
  name: 'Thorin',
  race: 'dwarf',
  class: 'fighter',
  level: 3,
  hp: { current: 25, max: 30 },
  stats: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
  inventory: [
    { id: '1', name: 'Longsword', description: '', quantity: 1 },
    { id: '2', name: 'Health Potion', description: '', quantity: 3 },
  ],
  gold: 50,
  portrait: null,
  backstory: 'Born in the mountain halls.',
};

describe('buildPlayerContext', () => {
  it('includes player name', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('Thorin');
  });

  it('includes race and class', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('dwarf');
    expect(context).toContain('fighter');
  });

  it('includes all stats', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('STR 16');
    expect(context).toContain('DEX 12');
    expect(context).toContain('CON 14');
    expect(context).toContain('INT 10');
    expect(context).toContain('WIS 10');
    expect(context).toContain('CHA 8');
  });

  it('includes HP', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('25/30');
  });

  it('includes gold', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('50');
  });

  it('includes inventory items', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('Longsword');
    expect(context).toContain('Health Potion');
  });

  it('handles empty inventory', () => {
    const playerWithoutItems: Player = {
      ...mockPlayer,
      inventory: [],
    };
    const context = buildPlayerContext(playerWithoutItems);
    expect(context).toContain('Empty');
  });

  it('includes backstory', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('Born in the mountain halls.');
  });

  it('includes level', () => {
    const context = buildPlayerContext(mockPlayer);
    expect(context).toContain('Level: 3');
  });
});

describe('DM_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof DM_SYSTEM_PROMPT).toBe('string');
    expect(DM_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('mentions JSON format', () => {
    expect(DM_SYSTEM_PROMPT.toLowerCase()).toContain('json');
  });

  it('mentions second person narration', () => {
    expect(DM_SYSTEM_PROMPT.toLowerCase()).toContain('second person');
  });
});

describe('BACKSTORY_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof BACKSTORY_PROMPT).toBe('string');
    expect(BACKSTORY_PROMPT.length).toBeGreaterThan(50);
  });

  it('mentions JSON format', () => {
    expect(BACKSTORY_PROMPT.toLowerCase()).toContain('json');
  });

  it('mentions backstory', () => {
    expect(BACKSTORY_PROMPT.toLowerCase()).toContain('backstory');
  });
});
