import type { SkillCheck, SkillCheckResult } from './types';
import type { Stats } from '@/types/game';
import { getAbilityModifier } from './modifiers';
import { getSkillAbility } from './skills';

export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollWithAdvantage(): { roll: number; rolls: [number, number] } {
  const roll1 = rollD20();
  const roll2 = rollD20();
  return {
    roll: Math.max(roll1, roll2),
    rolls: [roll1, roll2],
  };
}

export function rollWithDisadvantage(): { roll: number; rolls: [number, number] } {
  const roll1 = rollD20();
  const roll2 = rollD20();
  return {
    roll: Math.min(roll1, roll2),
    rolls: [roll1, roll2],
  };
}

export function performSkillCheck(
  check: SkillCheck,
  stats: Stats,
  reason: string
): SkillCheckResult {
  let roll: number;

  if (check.advantage && !check.disadvantage) {
    roll = rollWithAdvantage().roll;
  } else if (check.disadvantage && !check.advantage) {
    roll = rollWithDisadvantage().roll;
  } else {
    roll = rollD20();
  }

  const ability = check.skill ? getSkillAbility(check.skill) : check.ability;
  const modifier = getAbilityModifier(stats, ability);
  const total = roll + modifier;

  return {
    check,
    reason,
    roll,
    modifier,
    total,
    isCritical: roll === 20,
    isFumble: roll === 1,
  };
}
