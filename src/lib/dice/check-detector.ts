import type { SkillCheck, SkillType, AbilityType } from './types';

interface CheckTrigger {
  keywords: string[];
  skill?: SkillType;
  ability: AbilityType;
}

const CHECK_TRIGGERS: CheckTrigger[] = [
  // INT-based skills
  {
    keywords: ['read', 'rune', 'magical', 'spell', 'enchant', 'arcane', 'decipher', 'magic'],
    skill: 'arcana',
    ability: 'int',
  },
  {
    keywords: ['examine', 'investigate', 'inspect', 'analyze', 'search for clues', 'look for'],
    skill: 'investigation',
    ability: 'int',
  },
  {
    keywords: ['recall', 'remember', 'history', 'ancient', 'lore', 'knowledge'],
    skill: 'history',
    ability: 'int',
  },
  {
    keywords: ['nature', 'plant', 'animal', 'weather', 'track animal', 'identify creature'],
    skill: 'nature',
    ability: 'int',
  },
  {
    keywords: ['pray', 'religious', 'holy', 'divine', 'god', 'deity', 'undead lore'],
    skill: 'religion',
    ability: 'int',
  },

  // WIS-based skills
  {
    keywords: ['look around', 'observe', 'notice', 'spot', 'watch', 'listen', 'hear'],
    skill: 'perception',
    ability: 'wis',
  },
  {
    keywords: ['sense motive', 'detect lie', 'read emotion', 'tell if', 'lying', 'trust'],
    skill: 'insight',
    ability: 'wis',
  },
  {
    keywords: ['heal', 'treat wound', 'medicine', 'stabilize', 'diagnose', 'cure'],
    skill: 'medicine',
    ability: 'wis',
  },
  {
    keywords: ['track', 'forage', 'survive', 'navigate', 'find food', 'wilderness'],
    skill: 'survival',
    ability: 'wis',
  },
  {
    keywords: ['calm animal', 'tame', 'train', 'ride', 'handle animal'],
    skill: 'animal_handling',
    ability: 'wis',
  },

  // DEX-based skills
  {
    keywords: ['sneak', 'hide', 'quietly', 'unnoticed', 'stealth', 'creep', 'silently'],
    skill: 'stealth',
    ability: 'dex',
  },
  {
    keywords: ['balance', 'tumble', 'flip', 'dodge', 'acrobatic', 'jump over'],
    skill: 'acrobatics',
    ability: 'dex',
  },
  {
    keywords: ['pickpocket', 'sleight', 'palm', 'pick lock', 'disarm trap', 'lockpick'],
    skill: 'sleight_of_hand',
    ability: 'dex',
  },

  // STR-based skills
  {
    keywords: ['climb', 'jump', 'swim', 'push', 'lift', 'break down', 'force open', 'grapple'],
    skill: 'athletics',
    ability: 'str',
  },

  // CHA-based skills
  {
    keywords: ['convince', 'persuade', 'negotiate', 'charm', 'flatter', 'ask nicely'],
    skill: 'persuasion',
    ability: 'cha',
  },
  {
    keywords: ['threaten', 'scare', 'intimidate', 'frighten', 'menace', 'demand'],
    skill: 'intimidation',
    ability: 'cha',
  },
  {
    keywords: ['lie', 'deceive', 'bluff', 'mislead', 'disguise', 'pretend'],
    skill: 'deception',
    ability: 'cha',
  },
  {
    keywords: ['perform', 'sing', 'dance', 'play music', 'entertain', 'act'],
    skill: 'performance',
    ability: 'cha',
  },
];

export function detectSkillCheck(action: string): SkillCheck | null {
  const lowerAction = action.toLowerCase();

  for (const trigger of CHECK_TRIGGERS) {
    for (const keyword of trigger.keywords) {
      if (lowerAction.includes(keyword)) {
        return {
          type: 'skill',
          skill: trigger.skill,
          ability: trigger.ability,
        };
      }
    }
  }

  return null;
}

export function getCheckReason(action: string, check: SkillCheck): string {
  const actionLower = action.toLowerCase();
  
  if (check.skill === 'arcana' && actionLower.includes('rune')) {
    return 'Deciphering the ancient runes';
  }
  if (check.skill === 'arcana' && actionLower.includes('magic')) {
    return 'Identifying magical properties';
  }
  if (check.skill === 'perception') {
    return 'Observing your surroundings';
  }
  if (check.skill === 'stealth') {
    return 'Moving silently';
  }
  if (check.skill === 'investigation') {
    return 'Searching for clues';
  }
  if (check.skill === 'athletics' && actionLower.includes('climb')) {
    return 'Climbing the surface';
  }
  if (check.skill === 'athletics' && actionLower.includes('jump')) {
    return 'Making the leap';
  }
  if (check.skill === 'persuasion') {
    return 'Convincing them';
  }
  if (check.skill === 'intimidation') {
    return 'Intimidating them';
  }
  if (check.skill === 'deception') {
    return 'Deceiving them';
  }
  if (check.skill === 'insight') {
    return 'Reading their intentions';
  }
  if (check.skill === 'history') {
    return 'Recalling ancient knowledge';
  }

  return action;
}
