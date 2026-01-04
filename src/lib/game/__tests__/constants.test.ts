import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  RACES,
  CLASSES,
  BASE_STATS,
  BASE_HP,
  STARTING_GOLD,
  TTS_VOICES,
  getVoiceForNPC,
  NARRATOR_VOICE,
} from '../constants';

describe('RACES', () => {
  it('has 6 entries', () => {
    expect(RACES).toHaveLength(6);
  });

  it('entries have required fields', () => {
    RACES.forEach((race) => {
      expect(race).toHaveProperty('value');
      expect(race).toHaveProperty('label');
      expect(race).toHaveProperty('description');
      expect(typeof race.value).toBe('string');
      expect(typeof race.label).toBe('string');
      expect(typeof race.description).toBe('string');
    });
  });

  it('has unique values', () => {
    const values = RACES.map((r) => r.value);
    expect(new Set(values).size).toBe(RACES.length);
  });
});

describe('CLASSES', () => {
  it('has 6 entries', () => {
    expect(CLASSES).toHaveLength(6);
  });

  it('entries have required fields', () => {
    CLASSES.forEach((cls) => {
      expect(cls).toHaveProperty('value');
      expect(cls).toHaveProperty('label');
      expect(cls).toHaveProperty('description');
      expect(cls).toHaveProperty('primaryStat');
      expect(typeof cls.value).toBe('string');
      expect(typeof cls.label).toBe('string');
      expect(typeof cls.description).toBe('string');
      expect(['str', 'dex', 'con', 'int', 'wis', 'cha']).toContain(cls.primaryStat);
    });
  });

  it('has unique values', () => {
    const values = CLASSES.map((c) => c.value);
    expect(new Set(values).size).toBe(CLASSES.length);
  });
});

describe('BASE_STATS', () => {
  it('has stats for all classes', () => {
    CLASSES.forEach((cls) => {
      expect(BASE_STATS).toHaveProperty(cls.value);
    });
  });

  it('each class has all 6 stats', () => {
    Object.values(BASE_STATS).forEach((stats) => {
      expect(stats).toHaveProperty('str');
      expect(stats).toHaveProperty('dex');
      expect(stats).toHaveProperty('con');
      expect(stats).toHaveProperty('int');
      expect(stats).toHaveProperty('wis');
      expect(stats).toHaveProperty('cha');
    });
  });

  it('stats are valid numbers', () => {
    Object.values(BASE_STATS).forEach((stats) => {
      Object.values(stats).forEach((value) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(3);
        expect(value).toBeLessThanOrEqual(20);
      });
    });
  });
});

describe('BASE_HP', () => {
  it('has HP for all classes', () => {
    CLASSES.forEach((cls) => {
      expect(BASE_HP).toHaveProperty(cls.value);
      expect(typeof BASE_HP[cls.value]).toBe('number');
      expect(BASE_HP[cls.value]).toBeGreaterThan(0);
    });
  });
});

describe('STARTING_GOLD', () => {
  it('has gold for all classes', () => {
    CLASSES.forEach((cls) => {
      expect(STARTING_GOLD).toHaveProperty(cls.value);
      expect(typeof STARTING_GOLD[cls.value]).toBe('number');
      expect(STARTING_GOLD[cls.value]).toBeGreaterThan(0);
    });
  });
});

describe('TTS_VOICES', () => {
  it('has at least 10 voices', () => {
    expect(TTS_VOICES.length).toBeGreaterThanOrEqual(10);
  });

  it('all voices are strings', () => {
    TTS_VOICES.forEach((voice) => {
      expect(typeof voice).toBe('string');
    });
  });

  it('includes narrator voice', () => {
    expect(TTS_VOICES).toContain(NARRATOR_VOICE);
  });
});

describe('getVoiceForNPC', () => {
  it('returns a valid voice', () => {
    const voice = getVoiceForNPC('Test NPC');
    expect(TTS_VOICES).toContain(voice);
  });

  it('is deterministic for same name', () => {
    const voice1 = getVoiceForNPC('Gandalf');
    const voice2 = getVoiceForNPC('Gandalf');
    expect(voice1).toBe(voice2);
  });

  it('returns different voices for different names', () => {
    const voices = new Set<string>();
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    names.forEach((name) => voices.add(getVoiceForNPC(name)));
    // Should have at least 2 different voices (probabilistically)
    expect(voices.size).toBeGreaterThan(1);
  });

  it('handles empty string', () => {
    const voice = getVoiceForNPC('');
    expect(TTS_VOICES).toContain(voice);
  });

  it('property: returns valid voice for any string', () => {
    fc.assert(
      fc.property(fc.string(), (name) => {
        const voice = getVoiceForNPC(name);
        return TTS_VOICES.includes(voice as typeof TTS_VOICES[number]);
      }),
      { numRuns: 100 }
    );
  });
});
