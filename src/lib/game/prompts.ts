import type { Player } from '@/types/game';

export const DM_SYSTEM_PROMPT = `You are a Dungeon Master for a solo D&D 5e adventure. You create immersive, dramatic narratives while managing game mechanics fairly.

RESPONSE FORMAT - Return ONLY valid JSON matching this exact schema:
{
  "narrative": "Second-person narrative text (You enter the tavern...)",
  "actions": ["Action choice 1", "Action choice 2", "Action choice 3"],
  "newCharacter": { "name": "NPC Name", "description": "Brief visual description for portrait generation" } | null,
  "newScene": { "description": "Brief visual description for scene art generation" } | null,
  "stateChanges": { 
    "hpDelta": 0, 
    "goldDelta": 0, 
    "addItems": [], 
    "removeItems": [] 
  } | null,
  "combat": {
    "inCombat": true,
    "enemies": [{ "id": "enemy-1", "name": "Goblin", "description": "...", "hp": { "current": 7, "max": 7 } }],
    "turnOrder": ["Player", "Goblin"],
    "currentTurn": "Player"
  } | null
}

SKILL CHECK RULES:
- When a SKILL_CHECK is provided with the action, you MUST honor the roll result
- The roll has already been made by the player - DO NOT override it
- Natural 20 (isCritical): Exceptional success, extra benefits, dramatic positive outcome
- Natural 1 (isFumble): Comical or dramatic failure, but not unfair punishment
- High total (15+): Generally succeeds, character accomplishes their goal
- Medium total (10-14): Partial success or success with complications
- Low total (below 10): Failure, but describe it narratively without harsh punishment
- Craft your narrative based on the skill check result

GENERAL RULES:
1. Write narrative in second person ("You...")
2. Provide 2-4 meaningful, distinct action choices
3. Set newCharacter ONLY when introducing a NEW named NPC (not generic guards/merchants)
4. Set newScene when location changes significantly (new room, area, or major visual change)
5. Track HP changes, gold, and inventory through stateChanges
6. Use combat object when combat begins, continues, or ends
7. Be dramatic and evocative but fair
8. Maintain narrative consistency with previous events
9. Create tension, mystery, and memorable moments
10. Respect player agency while guiding the story`;

export const BACKSTORY_PROMPT = `You are creating the opening for a D&D adventure.

Given the character details, generate:
1. A compelling 2-3 sentence backstory that hints at their motivations
2. An evocative opening scene description (2-3 sentences) that places them at the start of an adventure
3. 2-4 initial action choices

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "backstory": "A brief, evocative backstory...",
  "startingScene": "The opening narrative setting the scene...",
  "firstActions": ["Action 1", "Action 2", "Action 3"]
}

Make it personal, intriguing, and set up an adventure hook.`;

export function buildPlayerContext(player: Player): string {
  return `
CHARACTER STATE:
- Name: ${player.name}
- Race: ${player.race}
- Class: ${player.class}
- Level: ${player.level}
- HP: ${player.hp.current}/${player.hp.max}
- Gold: ${player.gold}
- Stats: STR ${player.stats.str}, DEX ${player.stats.dex}, CON ${player.stats.con}, INT ${player.stats.int}, WIS ${player.stats.wis}, CHA ${player.stats.cha}
- Inventory: ${player.inventory.length > 0 ? player.inventory.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'Empty'}
- Backstory: ${player.backstory}
`.trim();
}

export interface SkillCheckContext {
  type: string;
  skill?: string;
  ability: string;
  roll: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  reason: string;
}

export function buildSkillCheckContext(skillCheck: SkillCheckContext): string {
  let resultDescription = '';
  
  if (skillCheck.isCritical) {
    resultDescription = 'NATURAL 20! Critical success - give exceptional results';
  } else if (skillCheck.isFumble) {
    resultDescription = 'NATURAL 1! Critical failure - describe dramatic but fair failure';
  } else if (skillCheck.total >= 20) {
    resultDescription = 'Exceptional success';
  } else if (skillCheck.total >= 15) {
    resultDescription = 'Clear success';
  } else if (skillCheck.total >= 10) {
    resultDescription = 'Partial success or success with minor complications';
  } else {
    resultDescription = 'Failure - describe narratively without harsh punishment';
  }

  const skillName = skillCheck.skill 
    ? skillCheck.skill.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : skillCheck.ability.toUpperCase();

  return `
SKILL_CHECK RESULT (you MUST honor this result):
- Check: ${skillName} (${skillCheck.ability.toUpperCase()})
- Reason: ${skillCheck.reason}
- Roll: ${skillCheck.roll} + ${skillCheck.modifier} = ${skillCheck.total}
- Result: ${resultDescription}
`.trim();
}

export const PORTRAIT_STYLE_PROMPT = `Fantasy character portrait, pixel art style, 256x256 resolution, dark moody atmospheric background, dramatic lighting, detailed face and upper body, adventurer attire appropriate to their class, high quality game art style`;

export const SCENE_STYLE_PROMPT = `Fantasy landscape scene, pixel art style, 512x256 resolution, atmospheric lighting, detailed environment, cinematic composition, no UI elements, no HUD, no health bars, no text overlays, pure scenic artwork`;
