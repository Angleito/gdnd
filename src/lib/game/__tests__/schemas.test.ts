import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  DMResponseSchema,
  BackstoryResponseSchema,
  StateChangesSchema,
  EnemySchema,
  CombatStateSchema,
} from '../schemas';

describe('DMResponseSchema', () => {
  const validResponse = {
    narrative: 'You enter a dark cave.',
    actions: ['Look around', 'Light a torch'],
    newCharacter: null,
    newScene: null,
    stateChanges: null,
    combat: null,
  };

  it('validates correct data', () => {
    const result = DMResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('requires narrative', () => {
    const { narrative, ...withoutNarrative } = validResponse;
    const result = DMResponseSchema.safeParse(withoutNarrative);
    expect(result.success).toBe(false);
  });

  it('requires actions', () => {
    const { actions, ...withoutActions } = validResponse;
    const result = DMResponseSchema.safeParse(withoutActions);
    expect(result.success).toBe(false);
  });

  it('enforces actions min 2', () => {
    const result = DMResponseSchema.safeParse({
      ...validResponse,
      actions: ['Only one action'],
    });
    expect(result.success).toBe(false);
  });

  it('enforces actions max 4', () => {
    const result = DMResponseSchema.safeParse({
      ...validResponse,
      actions: ['A', 'B', 'C', 'D', 'E'],
    });
    expect(result.success).toBe(false);
  });

  it('allows null optionals', () => {
    const result = DMResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.newCharacter).toBeNull();
      expect(result.data.newScene).toBeNull();
      expect(result.data.stateChanges).toBeNull();
      expect(result.data.combat).toBeNull();
    }
  });

  it('validates newCharacter when present', () => {
    const result = DMResponseSchema.safeParse({
      ...validResponse,
      newCharacter: {
        name: 'Gandalf',
        description: 'An old wizard',
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates newScene when present', () => {
    const result = DMResponseSchema.safeParse({
      ...validResponse,
      newScene: {
        description: 'A dark forest',
      },
    });
    expect(result.success).toBe(true);
  });

  it('validates combat when present', () => {
    const result = DMResponseSchema.safeParse({
      ...validResponse,
      combat: {
        inCombat: true,
        enemies: [
          {
            id: 'goblin-1',
            name: 'Goblin',
            description: 'A small creature',
            hp: { current: 7, max: 7 },
          },
        ],
        turnOrder: ['Player', 'Goblin'],
        currentTurn: 'Player',
      },
    });
    expect(result.success).toBe(true);
  });

  it('property: valid responses always parse', () => {
    fc.assert(
      fc.property(
        fc.record({
          narrative: fc.string({ minLength: 1 }),
          actions: fc.array(fc.string(), { minLength: 2, maxLength: 4 }),
          newCharacter: fc.constant(null),
          newScene: fc.constant(null),
          stateChanges: fc.constant(null),
          combat: fc.constant(null),
        }),
        (data) => {
          const result = DMResponseSchema.safeParse(data);
          return result.success;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('BackstoryResponseSchema', () => {
  const validBackstory = {
    backstory: 'Born in the mountains.',
    startingScene: 'You stand at a crossroads.',
    firstActions: ['Go left', 'Go right'],
  };

  it('validates correct data', () => {
    const result = BackstoryResponseSchema.safeParse(validBackstory);
    expect(result.success).toBe(true);
  });

  it('requires all fields', () => {
    const { backstory, ...withoutBackstory } = validBackstory;
    expect(BackstoryResponseSchema.safeParse(withoutBackstory).success).toBe(false);

    const { startingScene, ...withoutScene } = validBackstory;
    expect(BackstoryResponseSchema.safeParse(withoutScene).success).toBe(false);

    const { firstActions, ...withoutActions } = validBackstory;
    expect(BackstoryResponseSchema.safeParse(withoutActions).success).toBe(false);
  });

  it('enforces firstActions min 2', () => {
    const result = BackstoryResponseSchema.safeParse({
      ...validBackstory,
      firstActions: ['Only one'],
    });
    expect(result.success).toBe(false);
  });

  it('enforces firstActions max 4', () => {
    const result = BackstoryResponseSchema.safeParse({
      ...validBackstory,
      firstActions: ['A', 'B', 'C', 'D', 'E'],
    });
    expect(result.success).toBe(false);
  });
});

describe('StateChangesSchema', () => {
  it('allows partial data', () => {
    const result = StateChangesSchema.safeParse({ hpDelta: -5 });
    expect(result.success).toBe(true);
  });

  it('validates number types', () => {
    const result = StateChangesSchema.safeParse({
      hpDelta: 'not a number',
    });
    expect(result.success).toBe(false);
  });

  it('allows empty object', () => {
    const result = StateChangesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates addItems as string array', () => {
    const result = StateChangesSchema.safeParse({
      addItems: ['Sword', 'Shield'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-string items', () => {
    const result = StateChangesSchema.safeParse({
      addItems: [123, 456],
    });
    expect(result.success).toBe(false);
  });
});

describe('EnemySchema', () => {
  const validEnemy = {
    id: 'goblin-1',
    name: 'Goblin',
    description: 'A small green creature',
    hp: { current: 7, max: 7 },
  };

  it('validates correct data', () => {
    const result = EnemySchema.safeParse(validEnemy);
    expect(result.success).toBe(true);
  });

  it('requires HP structure', () => {
    const { hp, ...withoutHP } = validEnemy;
    expect(EnemySchema.safeParse(withoutHP).success).toBe(false);
  });

  it('requires current and max in HP', () => {
    expect(EnemySchema.safeParse({ ...validEnemy, hp: { current: 7 } }).success).toBe(false);
    expect(EnemySchema.safeParse({ ...validEnemy, hp: { max: 7 } }).success).toBe(false);
  });
});

describe('CombatStateSchema', () => {
  const validCombat = {
    inCombat: true,
    enemies: [],
    turnOrder: ['Player'],
    currentTurn: 'Player',
  };

  it('validates empty enemies array', () => {
    const result = CombatStateSchema.safeParse(validCombat);
    expect(result.success).toBe(true);
  });

  it('validates with enemies', () => {
    const result = CombatStateSchema.safeParse({
      ...validCombat,
      enemies: [
        {
          id: 'goblin-1',
          name: 'Goblin',
          description: 'Small creature',
          hp: { current: 7, max: 7 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires inCombat boolean', () => {
    const { inCombat, ...withoutInCombat } = validCombat;
    expect(CombatStateSchema.safeParse(withoutInCombat).success).toBe(false);
  });
});
