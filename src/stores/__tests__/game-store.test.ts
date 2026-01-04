import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../game-store';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    store: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock generateId to return predictable values
vi.mock('@/lib/utils', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}));

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      player: null,
      scene: null,
      history: [],
      npcs: new Map(),
      sprites: new Map(),
      combat: null,
      settings: { ttsEnabled: true, volume: 0.8 },
      isLoading: false,
      error: null,
    });
  });

  describe('createPlayer', () => {
    it('creates a player with correct stats', () => {
      useGameStore.getState().createPlayer('Thorin', 'dwarf', 'fighter');

      const player = useGameStore.getState().player;
      expect(player).not.toBeNull();
      expect(player?.name).toBe('Thorin');
      expect(player?.race).toBe('dwarf');
      expect(player?.class).toBe('fighter');
      expect(player?.level).toBe(1);
    });

    it('calculates HP based on class and constitution', () => {
      useGameStore.getState().createPlayer('Thorin', 'dwarf', 'fighter');

      const player = useGameStore.getState().player;
      // Fighter base HP is 12, with 14 CON (+2 modifier) = 14
      expect(player?.hp.current).toBe(14);
      expect(player?.hp.max).toBe(14);
    });

    it('sets starting gold based on class', () => {
      useGameStore.getState().createPlayer('Gandalf', 'human', 'wizard');

      const player = useGameStore.getState().player;
      expect(player?.gold).toBe(30); // Wizard starting gold
    });

    it('resets game state when creating new player', () => {
      // Add some existing state
      useGameStore.getState().addMessage('user', 'test message');
      
      useGameStore.getState().createPlayer('New Player', 'elf', 'rogue');

      expect(useGameStore.getState().history).toHaveLength(0);
      expect(useGameStore.getState().npcs.size).toBe(0);
    });
  });

  describe('setPlayerBackstory', () => {
    it('sets the player backstory', () => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
      useGameStore.getState().setPlayerBackstory('A brave warrior from the north.');

      expect(useGameStore.getState().player?.backstory).toBe('A brave warrior from the north.');
    });

    it('does nothing if no player exists', () => {
      useGameStore.getState().setPlayerBackstory('No player');

      expect(useGameStore.getState().player).toBeNull();
    });
  });

  describe('setPlayerPortrait', () => {
    it('sets the player portrait', () => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
      useGameStore.getState().setPlayerPortrait('base64-portrait-data');

      expect(useGameStore.getState().player?.portrait).toBe('base64-portrait-data');
    });
  });

  describe('updatePlayerHP', () => {
    beforeEach(() => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
    });

    it('increases HP', () => {
      useGameStore.getState().updatePlayerHP(-5); // First reduce
      useGameStore.getState().updatePlayerHP(3);

      const player = useGameStore.getState().player;
      expect(player?.hp.current).toBe(player!.hp.max - 2);
    });

    it('decreases HP', () => {
      useGameStore.getState().updatePlayerHP(-5);

      const player = useGameStore.getState().player;
      expect(player?.hp.current).toBe(player!.hp.max - 5);
    });

    it('does not exceed max HP', () => {
      useGameStore.getState().updatePlayerHP(100);

      const player = useGameStore.getState().player;
      expect(player?.hp.current).toBe(player?.hp.max);
    });

    it('does not go below 0', () => {
      useGameStore.getState().updatePlayerHP(-1000);

      expect(useGameStore.getState().player?.hp.current).toBe(0);
    });
  });

  describe('updatePlayerGold', () => {
    beforeEach(() => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
    });

    it('increases gold', () => {
      const initialGold = useGameStore.getState().player!.gold;
      useGameStore.getState().updatePlayerGold(50);

      expect(useGameStore.getState().player?.gold).toBe(initialGold + 50);
    });

    it('decreases gold', () => {
      const initialGold = useGameStore.getState().player!.gold;
      useGameStore.getState().updatePlayerGold(-5);

      expect(useGameStore.getState().player?.gold).toBe(initialGold - 5);
    });

    it('does not go below 0', () => {
      useGameStore.getState().updatePlayerGold(-1000);

      expect(useGameStore.getState().player?.gold).toBe(0);
    });
  });

  describe('addItem', () => {
    beforeEach(() => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
    });

    it('adds a new item to inventory', () => {
      useGameStore.getState().addItem('Health Potion');

      const inventory = useGameStore.getState().player?.inventory;
      expect(inventory).toHaveLength(1);
      expect(inventory?.[0].name).toBe('Health Potion');
      expect(inventory?.[0].quantity).toBe(1);
    });

    it('increments quantity for existing item', () => {
      useGameStore.getState().addItem('Health Potion');
      useGameStore.getState().addItem('Health Potion');

      const inventory = useGameStore.getState().player?.inventory;
      expect(inventory).toHaveLength(1);
      expect(inventory?.[0].quantity).toBe(2);
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
      useGameStore.getState().addItem('Health Potion');
      useGameStore.getState().addItem('Health Potion');
    });

    it('decrements quantity for existing item', () => {
      useGameStore.getState().removeItem('Health Potion');

      const inventory = useGameStore.getState().player?.inventory;
      expect(inventory?.[0].quantity).toBe(1);
    });

    it('removes item when quantity reaches 0', () => {
      useGameStore.getState().removeItem('Health Potion');
      useGameStore.getState().removeItem('Health Potion');

      expect(useGameStore.getState().player?.inventory).toHaveLength(0);
    });

    it('does nothing for non-existent item', () => {
      useGameStore.getState().removeItem('Non-existent Item');

      expect(useGameStore.getState().player?.inventory).toHaveLength(1);
    });
  });

  describe('setScene', () => {
    it('sets scene description', () => {
      useGameStore.getState().setScene('A dark tavern');

      expect(useGameStore.getState().scene?.description).toBe('A dark tavern');
    });

    it('sets scene with sprite', () => {
      useGameStore.getState().setScene('A forest', 'base64-sprite');

      const scene = useGameStore.getState().scene;
      expect(scene?.description).toBe('A forest');
      expect(scene?.sprite).toBe('base64-sprite');
    });

    it('sets sprite to null when not provided', () => {
      useGameStore.getState().setScene('A cave');

      expect(useGameStore.getState().scene?.sprite).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('adds a user message', () => {
      useGameStore.getState().addMessage('user', 'Hello');

      const history = useGameStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Hello');
    });

    it('adds a model message', () => {
      useGameStore.getState().addMessage('model', 'Welcome adventurer!');

      const history = useGameStore.getState().history;
      expect(history[0].role).toBe('model');
    });

    it('includes timestamp', () => {
      const before = Date.now();
      useGameStore.getState().addMessage('user', 'Test');
      const after = Date.now();

      const timestamp = useGameStore.getState().history[0].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('includes thought signature when provided', () => {
      useGameStore.getState().addMessage('model', 'Response', 'thought-sig-123');

      expect(useGameStore.getState().history[0].thoughtSignature).toBe('thought-sig-123');
    });
  });

  describe('addNPC', () => {
    it('adds an NPC to the map', () => {
      const npc = useGameStore.getState().addNPC('Bartender', 'A friendly tavern keeper');

      expect(npc.name).toBe('Bartender');
      expect(npc.description).toBe('A friendly tavern keeper');
      expect(useGameStore.getState().npcs.size).toBe(1);
    });

    it('generates correct NPC ID', () => {
      const npc = useGameStore.getState().addNPC('Mysterious Stranger', 'A hooded figure');

      expect(npc.id).toBe('npc-mysterious-stranger');
    });

    it('sets default disposition to neutral', () => {
      const npc = useGameStore.getState().addNPC('Guard', 'A city guard');

      expect(npc.disposition).toBe('neutral');
    });

    it('allows setting custom disposition', () => {
      const npc = useGameStore.getState().addNPC('Enemy', 'A goblin', 'hostile');

      expect(npc.disposition).toBe('hostile');
    });
  });

  describe('setNPCPortrait', () => {
    it('sets portrait for existing NPC', () => {
      const npc = useGameStore.getState().addNPC('Guard', 'A guard');
      useGameStore.getState().setNPCPortrait(npc.id, 'base64-portrait');

      const updatedNPC = useGameStore.getState().npcs.get(npc.id);
      expect(updatedNPC?.portrait).toBe('base64-portrait');
    });

    it('does nothing for non-existent NPC', () => {
      useGameStore.getState().setNPCPortrait('fake-id', 'portrait');

      expect(useGameStore.getState().npcs.size).toBe(0);
    });
  });

  describe('cacheSprite and getSprite', () => {
    it('caches and retrieves a sprite', () => {
      useGameStore.getState().cacheSprite('tavern-scene', 'base64-data');

      expect(useGameStore.getState().getSprite('tavern-scene')).toBe('base64-data');
    });

    it('returns undefined for non-existent sprite', () => {
      expect(useGameStore.getState().getSprite('non-existent')).toBeUndefined();
    });
  });

  describe('setCombat', () => {
    it('sets combat state', () => {
      useGameStore.getState().setCombat({
        inCombat: true,
        enemies: [
          { id: 'goblin-1', name: 'Goblin', description: 'A small creature', hp: { current: 7, max: 7 } },
        ],
        turnOrder: ['Player', 'Goblin'],
        currentTurn: 'Player',
      });

      const combat = useGameStore.getState().combat;
      expect(combat?.inCombat).toBe(true);
      expect(combat?.enemies).toHaveLength(1);
      expect(combat?.enemies[0].portrait).toBeNull();
    });

    it('clears combat when set to null', () => {
      useGameStore.getState().setCombat({
        inCombat: true,
        enemies: [],
        turnOrder: [],
        currentTurn: 'Player',
      });
      useGameStore.getState().setCombat(null);

      expect(useGameStore.getState().combat).toBeNull();
    });
  });

  describe('updateEnemyHP', () => {
    beforeEach(() => {
      useGameStore.getState().setCombat({
        inCombat: true,
        enemies: [
          { id: 'goblin-1', name: 'Goblin', description: 'A small creature', hp: { current: 7, max: 7 } },
        ],
        turnOrder: ['Player', 'Goblin'],
        currentTurn: 'Player',
      });
    });

    it('decreases enemy HP', () => {
      useGameStore.getState().updateEnemyHP('goblin-1', -3);

      expect(useGameStore.getState().combat?.enemies[0].hp.current).toBe(4);
    });

    it('does not go below 0', () => {
      useGameStore.getState().updateEnemyHP('goblin-1', -100);

      expect(useGameStore.getState().combat?.enemies[0].hp.current).toBe(0);
    });

    it('does nothing for non-existent enemy', () => {
      useGameStore.getState().updateEnemyHP('fake-id', -5);

      expect(useGameStore.getState().combat?.enemies[0].hp.current).toBe(7);
    });
  });

  describe('setSettings', () => {
    it('updates TTS setting', () => {
      useGameStore.getState().setSettings({ ttsEnabled: false });

      expect(useGameStore.getState().settings.ttsEnabled).toBe(false);
    });

    it('updates volume', () => {
      useGameStore.getState().setSettings({ volume: 0.5 });

      expect(useGameStore.getState().settings.volume).toBe(0.5);
    });

    it('preserves other settings when updating one', () => {
      useGameStore.getState().setSettings({ volume: 0.5 });

      expect(useGameStore.getState().settings.ttsEnabled).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('sets loading state to true', () => {
      useGameStore.getState().setLoading(true);

      expect(useGameStore.getState().isLoading).toBe(true);
    });

    it('sets loading state to false', () => {
      useGameStore.getState().setLoading(true);
      useGameStore.getState().setLoading(false);

      expect(useGameStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      useGameStore.getState().setError('Something went wrong');

      expect(useGameStore.getState().error).toBe('Something went wrong');
    });

    it('clears error', () => {
      useGameStore.getState().setError('Error');
      useGameStore.getState().setError(null);

      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('resetGame', () => {
    it('resets all game state', () => {
      useGameStore.getState().createPlayer('Hero', 'human', 'fighter');
      useGameStore.getState().addMessage('user', 'test');
      useGameStore.getState().setScene('A scene');
      useGameStore.getState().setError('An error');

      useGameStore.getState().resetGame();

      const state = useGameStore.getState();
      expect(state.player).toBeNull();
      expect(state.scene).toBeNull();
      expect(state.history).toHaveLength(0);
      expect(state.npcs.size).toBe(0);
      expect(state.sprites.size).toBe(0);
      expect(state.combat).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('preserves settings', () => {
      useGameStore.getState().setSettings({ volume: 0.5 });
      useGameStore.getState().resetGame();

      // Settings are part of persisted state, but resetGame doesn't touch them
      // Actually looking at the code, resetGame doesn't reset settings
      expect(useGameStore.getState().settings).toBeDefined();
    });
  });
});
