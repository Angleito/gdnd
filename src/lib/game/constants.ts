import type { Race, Class, Stats } from '@/types/game';

export const RACES: { value: Race; label: string; description: string }[] = [
  { value: 'human', label: 'Human', description: 'Versatile and ambitious, humans adapt to any situation.' },
  { value: 'elf', label: 'Elf', description: 'Graceful and long-lived, elves possess keen senses and magic affinity.' },
  { value: 'dwarf', label: 'Dwarf', description: 'Stout and sturdy, dwarves are master craftsmen and fierce warriors.' },
  { value: 'halfling', label: 'Halfling', description: 'Small but brave, halflings are lucky and nimble.' },
  { value: 'dragonborn', label: 'Dragonborn', description: 'Proud dragon descendants with breath weapons and scales.' },
  { value: 'tiefling', label: 'Tiefling', description: 'Infernal heritage grants them resistance and dark powers.' },
];

export const CLASSES: { value: Class; label: string; description: string; primaryStat: keyof Stats }[] = [
  { value: 'fighter', label: 'Fighter', description: 'Masters of martial combat and battlefield tactics.', primaryStat: 'str' },
  { value: 'wizard', label: 'Wizard', description: 'Scholars of arcane magic who bend reality to their will.', primaryStat: 'int' },
  { value: 'rogue', label: 'Rogue', description: 'Cunning tricksters skilled in stealth and precision strikes.', primaryStat: 'dex' },
  { value: 'cleric', label: 'Cleric', description: 'Divine servants who channel the power of their gods.', primaryStat: 'wis' },
  { value: 'ranger', label: 'Ranger', description: 'Wilderness experts and deadly hunters of monsters.', primaryStat: 'dex' },
  { value: 'bard', label: 'Bard', description: 'Charismatic performers who weave magic through music.', primaryStat: 'cha' },
];

export const BASE_STATS: Record<Class, Stats> = {
  fighter: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
  wizard: { str: 8, dex: 12, con: 12, int: 16, wis: 14, cha: 10 },
  rogue: { str: 10, dex: 16, con: 12, int: 12, wis: 10, cha: 14 },
  cleric: { str: 12, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
  ranger: { str: 12, dex: 16, con: 12, int: 10, wis: 14, cha: 8 },
  bard: { str: 8, dex: 14, con: 12, int: 12, wis: 10, cha: 16 },
};

export const BASE_HP: Record<Class, number> = {
  fighter: 12,
  wizard: 6,
  rogue: 8,
  cleric: 8,
  ranger: 10,
  bard: 8,
};

export const STARTING_GOLD: Record<Class, number> = {
  fighter: 50,
  wizard: 30,
  rogue: 40,
  cleric: 35,
  ranger: 40,
  bard: 45,
};

export const TTS_VOICES = [
  'Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede',
  'Leda', 'Orus', 'Zephyr', 'Callisto', 'Helios'
] as const;

export type TTSVoice = typeof TTS_VOICES[number];

export function getVoiceForNPC(name: string): TTSVoice {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TTS_VOICES[hash % TTS_VOICES.length];
}

export const NARRATOR_VOICE: TTSVoice = 'Kore';
