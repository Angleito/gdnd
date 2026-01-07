import { z } from 'zod';

export const StateChangesSchema = z.object({
  hpDelta: z.number().optional(),
  goldDelta: z.number().optional(),
  addItems: z.array(z.string()).optional(),
  removeItems: z.array(z.string()).optional(),
});

// Dice Roll Schema
export const DiceTypeSchema = z.enum(['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100']);

export const DiceRollSchema = z.object({
  dice: DiceTypeSchema,
  count: z.number().min(1).default(1),
  rolls: z.array(z.number()),
  modifier: z.number().default(0),
  total: z.number(),
  purpose: z.string().optional(),
});

// Combat Log Entry Schema
export const CombatLogEntryTypeSchema = z.enum([
  'attack', 'damage', 'miss', 'heal', 'spell', 
  'status', 'narrative', 'roll', 'critical', 'fumble'
]);

export const CombatLogEntryResultSchema = z.enum([
  'hit', 'miss', 'critical', 'fumble', 'success', 'failure'
]);

export const DMCombatLogEntrySchema = z.object({
  turn: z.number(),
  type: CombatLogEntryTypeSchema,
  actor: z.string(),
  target: z.string().optional(),
  action: z.string(),
  diceRoll: DiceRollSchema.optional(),
  result: CombatLogEntryResultSchema.optional(),
  value: z.number().optional(),
  damageType: z.string().optional(),
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
  }).nullable().optional(),
  newScene: z.object({
    description: z.string(),
  }).nullable().optional(),
  stateChanges: StateChangesSchema.nullable().optional(),
  combat: CombatStateSchema.nullable().optional(),
  combatLog: z.array(DMCombatLogEntrySchema).optional(),
});

export const BackstoryResponseSchema = z.object({
  backstory: z.string(),
  startingScene: z.string(),
  firstActions: z.array(z.string()).min(2).max(4),
});

export type DMResponseType = z.infer<typeof DMResponseSchema>;
export type BackstoryResponseType = z.infer<typeof BackstoryResponseSchema>;
export type DMCombatLogEntryType = z.infer<typeof DMCombatLogEntrySchema>;
