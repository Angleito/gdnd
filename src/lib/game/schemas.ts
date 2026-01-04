import { z } from 'zod';

export const StateChangesSchema = z.object({
  hpDelta: z.number().optional(),
  goldDelta: z.number().optional(),
  addItems: z.array(z.string()).optional(),
  removeItems: z.array(z.string()).optional(),
});

export const EnemySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hp: z.object({
    current: z.number(),
    max: z.number(),
  }),
});

export const CombatStateSchema = z.object({
  inCombat: z.boolean(),
  enemies: z.array(EnemySchema),
  turnOrder: z.array(z.string()),
  currentTurn: z.string(),
});

export const DMResponseSchema = z.object({
  narrative: z.string(),
  actions: z.array(z.string()).min(2).max(4),
  newCharacter: z.object({
    name: z.string(),
    description: z.string(),
  }).nullable(),
  newScene: z.object({
    description: z.string(),
  }).nullable(),
  stateChanges: StateChangesSchema.nullable(),
  combat: CombatStateSchema.nullable(),
});

export const BackstoryResponseSchema = z.object({
  backstory: z.string(),
  startingScene: z.string(),
  firstActions: z.array(z.string()).min(2).max(4),
});

export type DMResponseType = z.infer<typeof DMResponseSchema>;
export type BackstoryResponseType = z.infer<typeof BackstoryResponseSchema>;
