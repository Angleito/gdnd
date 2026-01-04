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
  voice: string;
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

export interface GameSettings {
  ttsEnabled: boolean;
  volume: number;
}
