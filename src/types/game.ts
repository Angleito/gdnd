export type Race = 'human' | 'elf' | 'dwarf' | 'halfling' | 'dragonborn' | 'tiefling';
export type Class = 'fighter' | 'wizard' | 'rogue' | 'cleric' | 'ranger' | 'bard';

export interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
}

export interface Player {
  name: string;
  race: Race;
  class: Class;
  level: number;
  hp: { current: number; max: number };
  stats: Stats;
  inventory: Item[];
  gold: number;
  portrait: string | null;
  backstory: string;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  portrait: string | null;
  disposition: 'friendly' | 'neutral' | 'hostile';
}

export interface Scene {
  description: string;
  sprite: string | null;
}

// Enemy as returned from the DM (no portrait yet)
export interface DMEnemy {
  id: string;
  name: string;
  description: string;
  hp: { current: number; max: number };
}

// Enemy with portrait (after image generation)
export interface Enemy extends DMEnemy {
  portrait: string | null;
}

// Combat state as returned from DM
export interface DMCombatState {
  inCombat: boolean;
  enemies: DMEnemy[];
  turnOrder: string[];
  currentTurn: string;
}

// Combat state with portraits
export interface CombatState {
  inCombat: boolean;
  enemies: Enemy[];
  turnOrder: string[];
  currentTurn: string;
}

export interface StateChanges {
  hpDelta?: number;
  goldDelta?: number;
  addItems?: string[];
  removeItems?: string[];
}

// Raw response from DM API
export interface DMResponse {
  narrative: string;
  actions: string[];
  newCharacter: { name: string; description: string } | null;
  newScene: { description: string } | null;
  stateChanges: StateChanges | null;
  combat: DMCombatState | null;
}

export interface GameMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  thoughtSignature?: string;
}

export interface DiceSettings {
  color: string;
  numberColor: string;
  criticalColor: string;
  fumbleColor: string;
}

export interface GameSettings {
  dice: DiceSettings;
}

// D&D Dice Roll
export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export interface DiceRoll {
  dice: DiceType;
  count: number;          // Number of dice rolled (e.g., 2 for 2D6)
  rolls: number[];        // Individual roll results [3, 5]
  modifier: number;       // +3 or -1
  total: number;          // Final total
  purpose?: string;       // "attack", "damage", "saving throw"
}

// Combat Log Entry Types
export type CombatLogEntryType = 
  | 'attack'      // Attack roll
  | 'damage'      // Damage dealt
  | 'miss'        // Attack missed
  | 'heal'        // Healing received
  | 'spell'       // Spell cast
  | 'status'      // Status change (defeated, stunned, etc.)
  | 'narrative'   // DM flavor text
  | 'roll'        // Generic dice roll (skill check, saving throw)
  | 'critical'    // Critical hit
  | 'fumble';     // Critical miss

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  turn: number;
  type: CombatLogEntryType;
  actor: string;          // "You" or "Goblin Scout"
  target?: string;        // Target of the action
  action: string;         // Description: "attack with Longsword"
  diceRoll?: DiceRoll;
  result?: 'hit' | 'miss' | 'critical' | 'fumble' | 'success' | 'failure';
  value?: number;         // Damage/healing amount
  damageType?: string;    // "fire", "slashing", "piercing", etc.
}

// DM Combat Log Entry (from API, before adding id/timestamp)
export interface DMCombatLogEntry {
  turn: number;
  type: CombatLogEntryType;
  actor: string;
  target?: string;
  action: string;
  diceRoll?: DiceRoll;
  result?: 'hit' | 'miss' | 'critical' | 'fumble' | 'success' | 'failure';
  value?: number;
  damageType?: string;
}
