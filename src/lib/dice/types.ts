export type AbilityType = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type SkillType =
  | 'acrobatics'
  | 'animal_handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight_of_hand'
  | 'stealth'
  | 'survival';

export type CheckType = 'skill' | 'ability' | 'attack' | 'saving_throw';

export interface SkillCheck {
  type: CheckType;
  skill?: SkillType;
  ability: AbilityType;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface SkillCheckRequest {
  check: SkillCheck;
  reason: string;
}

export interface SkillCheckResult {
  check: SkillCheck;
  reason: string;
  roll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
}

export const ABILITY_NAMES: Record<AbilityType, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const SKILL_NAMES: Record<SkillType, string> = {
  acrobatics: 'Acrobatics',
  animal_handling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleight_of_hand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};
