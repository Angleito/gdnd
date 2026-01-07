import { describe, it, expect } from 'vitest';
import {
  RACES,
  CLASSES,
  BASE_STATS,
  BASE_HP,
  STARTING_GOLD,
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
