import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameMessage, Scene, NPC, CombatState, DMCombatState, GameSettings, Race, Class, CombatLogEntry, DMCombatLogEntry } from '@/types/game';
import { BASE_STATS, BASE_HP, STARTING_GOLD } from '@/lib/game/constants';
import { generateId } from '@/lib/utils';
import { logger } from '@/lib/logger';

const IMAGE_CACHE_KEY = 'gdnd-image-cache';
const MAX_CACHED_IMAGES = 10;

interface ImageCacheEntry {
  data: string;
  timestamp: number;
}

interface GameState {
  player: Player | null;
  scene: Scene | null;
  history: GameMessage[];
  historySummary: string | null;
  npcs: Map<string, NPC>;
  sprites: Map<string, string>;
  combat: CombatState | null;
  combatLog: CombatLogEntry[];
  combatTurn: number;
  settings: GameSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  createPlayer: (name: string, race: Race, characterClass: Class) => void;
  setPlayerBackstory: (backstory: string) => void;
  setPlayerPortrait: (portrait: string) => void;
  updatePlayerHP: (delta: number) => void;
  updatePlayerGold: (delta: number) => void;
  addItem: (name: string) => void;
  removeItem: (name: string) => void;
  
  setScene: (description: string, sprite?: string) => void;
  addMessage: (role: 'user' | 'model', content: string, thoughtSignature?: string) => void;
  setHistorySummary: (summary: string) => void;
  
  addNPC: (name: string, description: string, disposition?: 'friendly' | 'neutral' | 'hostile') => NPC;
  setNPCPortrait: (id: string, portrait: string) => void;
  
  cacheSprite: (key: string, data: string) => void;
  getSprite: (key: string) => string | undefined;
  loadSpritesFromStorage: () => void;
  
  setCombat: (combat: DMCombatState | null) => void;
  updateEnemyHP: (enemyId: string, delta: number) => void;
  
  // Combat Log Actions
  addCombatLogEntry: (entry: DMCombatLogEntry) => void;
  addCombatLogEntries: (entries: DMCombatLogEntry[]) => void;
  clearCombatLog: () => void;
  incrementCombatTurn: () => void;
  
  setSettings: (settings: Partial<GameSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  resetGame: () => void;
}

const initialSettings: GameSettings = {
  dice: {
    color: '#4f46e5',
    numberColor: '#ffffff',
    criticalColor: '#fbbf24',
    fumbleColor: '#ef4444',
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: null,
      scene: null,
      history: [],
      historySummary: null,
      npcs: new Map(),
      sprites: new Map(),
      combat: null,
      combatLog: [],
      combatTurn: 0,
      settings: initialSettings,
      isLoading: false,
      error: null,

      createPlayer: (name, race, characterClass) => {
        const stats = BASE_STATS[characterClass];
        const maxHP = BASE_HP[characterClass] + Math.floor((stats.con - 10) / 2);
        
        logger.store('createPlayer', {
          name,
          race,
          class: characterClass,
          hp: `${maxHP}/${maxHP}`,
          gold: STARTING_GOLD[characterClass],
        });

        set({
          player: {
            name,
            race,
            class: characterClass,
            level: 1,
            hp: { current: maxHP, max: maxHP },
            stats,
            inventory: [],
            gold: STARTING_GOLD[characterClass],
            portrait: null,
            backstory: '',
          },
          history: [],
          historySummary: null,
          npcs: new Map(),
          sprites: new Map(),
          scene: null,
          combat: null,
          error: null,
        });
      },

      setPlayerBackstory: (backstory) => {
        logger.store('setPlayerBackstory', { backstory });
        set((state) => ({
          player: state.player ? { ...state.player, backstory } : null,
        }));
      },

      setPlayerPortrait: (portrait) => {
        logger.store('setPlayerPortrait', { portraitLength: portrait.length });
        set((state) => ({
          player: state.player ? { ...state.player, portrait } : null,
        }));
      },

      updatePlayerHP: (delta) => {
        const state = get();
        if (!state.player) return;
        
        const oldHP = state.player.hp.current;
        const newHP = Math.max(0, Math.min(state.player.hp.max, oldHP + delta));
        
        logger.store('updatePlayerHP', {
          delta,
          oldHP,
          newHP,
          max: state.player.hp.max,
        });

        set((state) => {
          if (!state.player) return state;
          return {
            player: { ...state.player, hp: { ...state.player.hp, current: newHP } },
          };
        });
      },

      updatePlayerGold: (delta) => {
        const state = get();
        if (!state.player) return;
        
        const oldGold = state.player.gold;
        const newGold = Math.max(0, oldGold + delta);
        
        logger.store('updatePlayerGold', { delta, oldGold, newGold });

        set((state) => {
          if (!state.player) return state;
          return {
            player: { ...state.player, gold: newGold },
          };
        });
      },

      addItem: (name) => {
        const state = get();
        const existingItem = state.player?.inventory.find((i) => i.name === name);
        
        logger.store('addItem', {
          item: name,
          existingQuantity: existingItem?.quantity ?? 0,
          newQuantity: (existingItem?.quantity ?? 0) + 1,
        });

        set((state) => {
          if (!state.player) return state;
          const existingItem = state.player.inventory.find((i) => i.name === name);
          if (existingItem) {
            return {
              player: {
                ...state.player,
                inventory: state.player.inventory.map((i) =>
                  i.name === name ? { ...i, quantity: i.quantity + 1 } : i
                ),
              },
            };
          }
          return {
            player: {
              ...state.player,
              inventory: [
                ...state.player.inventory,
                { id: generateId(), name, description: '', quantity: 1 },
              ],
            },
          };
        });
      },

      removeItem: (name) => {
        const state = get();
        const existingItem = state.player?.inventory.find((i) => i.name === name);
        
        logger.store('removeItem', {
          item: name,
          existingQuantity: existingItem?.quantity ?? 0,
          removed: existingItem?.quantity === 1,
        });

        set((state) => {
          if (!state.player) return state;
          const existingItem = state.player.inventory.find((i) => i.name === name);
          if (!existingItem) return state;
          if (existingItem.quantity <= 1) {
            return {
              player: {
                ...state.player,
                inventory: state.player.inventory.filter((i) => i.name !== name),
              },
            };
          }
          return {
            player: {
              ...state.player,
              inventory: state.player.inventory.map((i) =>
                i.name === name ? { ...i, quantity: i.quantity - 1 } : i
              ),
            },
          };
        });
      },

      setScene: (description, sprite) => {
        logger.store('setScene', {
          description,
          hasSprite: !!sprite,
        });
        set({ scene: { description, sprite: sprite ?? null } });
      },

      addMessage: (role, content, thoughtSignature) => {
        logger.store('addMessage', {
          role,
          content,
          hasThoughtSignature: !!thoughtSignature,
        });
        set((state) => ({
          history: [
            ...state.history,
            { role, content, timestamp: Date.now(), thoughtSignature },
          ],
        }));
      },

      setHistorySummary: (summary) => {
        logger.store('setHistorySummary', { summaryLength: summary.length });
        set({ historySummary: summary });
      },

      addNPC: (name, description, disposition = 'neutral') => {
        const id = `npc-${name.toLowerCase().replace(/\s+/g, '-')}`;
        
        logger.store('addNPC', { id, name, disposition });

        const npc: NPC = {
          id,
          name,
          description,
          portrait: null,
          disposition,
        };
        set((state) => {
          const newNpcs = new Map(state.npcs);
          newNpcs.set(id, npc);
          return { npcs: newNpcs };
        });
        return npc;
      },

      setNPCPortrait: (id, portrait) => {
        logger.store('setNPCPortrait', { id, portraitLength: portrait.length });
        set((state) => {
          const npc = state.npcs.get(id);
          if (!npc) return state;
          const newNpcs = new Map(state.npcs);
          newNpcs.set(id, { ...npc, portrait });
          return { npcs: newNpcs };
        });
      },

      cacheSprite: (key, data) => {
        logger.store('cacheSprite', { key, dataLength: data.length });
        
        // Memory cache
        set((state) => {
          const newSprites = new Map(state.sprites);
          newSprites.set(key, data);
          return { sprites: newSprites };
        });

        // Persistent cache with LRU eviction
        try {
          const cacheStr = localStorage.getItem(IMAGE_CACHE_KEY);
          const cache: Record<string, ImageCacheEntry> = cacheStr ? JSON.parse(cacheStr) : {};
          
          cache[key] = { data, timestamp: Date.now() };
          
          // LRU eviction - keep only MAX_CACHED_IMAGES most recent
          const entries = Object.entries(cache);
          if (entries.length > MAX_CACHED_IMAGES) {
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const trimmed = Object.fromEntries(entries.slice(0, MAX_CACHED_IMAGES));
            localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(trimmed));
          } else {
            localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
          }
        } catch (e) {
          // localStorage full or unavailable - fail silently
          logger.error('cacheSprite', 'Failed to persist to localStorage');
        }
      },

      getSprite: (key) => {
        // Check memory first
        const memorySprite = get().sprites.get(key);
        if (memorySprite) return memorySprite;

        // Check localStorage
        try {
          const cacheStr = localStorage.getItem(IMAGE_CACHE_KEY);
          if (cacheStr) {
            const cache: Record<string, ImageCacheEntry> = JSON.parse(cacheStr);
            if (cache[key]?.data) {
              // Restore to memory cache
              set((state) => {
                const newSprites = new Map(state.sprites);
                newSprites.set(key, cache[key].data);
                return { sprites: newSprites };
              });
              return cache[key].data;
            }
          }
        } catch (e) {
          // localStorage unavailable
        }

        return undefined;
      },

      loadSpritesFromStorage: () => {
        try {
          const cacheStr = localStorage.getItem(IMAGE_CACHE_KEY);
          if (cacheStr) {
            const cache: Record<string, ImageCacheEntry> = JSON.parse(cacheStr);
            set((state) => {
              const newSprites = new Map(state.sprites);
              for (const [key, entry] of Object.entries(cache)) {
                newSprites.set(key, entry.data);
              }
              return { sprites: newSprites };
            });
            logger.store('loadSpritesFromStorage', { count: Object.keys(cache).length });
          }
        } catch (e) {
          // localStorage unavailable
        }
      },

      setCombat: (combat) => {
        const state = get();
        const wasInCombat = state.combat?.inCombat ?? false;
        
        if (!combat || !combat.inCombat) {
          logger.store('setCombat', { combat: null, clearedLog: wasInCombat });
          set({ 
            combat: null,
            combatLog: wasInCombat ? [] : state.combatLog,
            combatTurn: wasInCombat ? 0 : state.combatTurn,
          });
          return;
        }
        
        const newTurn = !wasInCombat ? 1 : state.combatTurn + 1;
        
        logger.store('setCombat', {
          inCombat: combat.inCombat,
          enemyCount: combat.enemies.length,
          enemies: combat.enemies.map(e => e.name),
          currentTurn: combat.currentTurn,
          combatTurn: newTurn,
        });

        const combatWithPortraits: CombatState = {
          ...combat,
          enemies: combat.enemies.map(e => ({ ...e, portrait: null })),
        };
        set({ 
          combat: combatWithPortraits,
          combatTurn: newTurn,
        });
      },

      updateEnemyHP: (enemyId, delta) => {
        const state = get();
        const enemy = state.combat?.enemies.find(e => e.id === enemyId);
        
        logger.store('updateEnemyHP', {
          enemyId,
          delta,
          oldHP: enemy?.hp.current,
          newHP: enemy ? Math.max(0, enemy.hp.current + delta) : null,
        });

        set((state) => {
          if (!state.combat) return state;
          return {
            combat: {
              ...state.combat,
              enemies: state.combat.enemies.map((e) =>
                e.id === enemyId
                  ? { ...e, hp: { ...e.hp, current: Math.max(0, e.hp.current + delta) } }
                  : e
              ),
            },
          };
        });
      },

      addCombatLogEntry: (entry) => {
        const state = get();
        const fullEntry: CombatLogEntry = {
          ...entry,
          id: generateId(),
          timestamp: Date.now(),
          turn: entry.turn ?? state.combatTurn,
        };
        
        logger.store('addCombatLogEntry', {
          type: fullEntry.type,
          actor: fullEntry.actor,
          action: fullEntry.action,
          turn: fullEntry.turn,
        });

        set((state) => ({
          combatLog: [...state.combatLog, fullEntry],
        }));
      },

      addCombatLogEntries: (entries) => {
        const state = get();
        const fullEntries: CombatLogEntry[] = entries.map((entry) => ({
          ...entry,
          id: generateId(),
          timestamp: Date.now(),
          turn: entry.turn ?? state.combatTurn,
        }));
        
        logger.store('addCombatLogEntries', {
          count: fullEntries.length,
          types: fullEntries.map(e => e.type),
        });

        set((state) => ({
          combatLog: [...state.combatLog, ...fullEntries],
        }));
      },

      clearCombatLog: () => {
        logger.store('clearCombatLog', {});
        set({ combatLog: [], combatTurn: 0 });
      },

      incrementCombatTurn: () => {
        const newTurn = get().combatTurn + 1;
        logger.store('incrementCombatTurn', { newTurn });
        set({ combatTurn: newTurn });
      },

      setSettings: (newSettings) => {
        logger.store('setSettings', newSettings);
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setLoading: (isLoading) => {
        logger.store('setLoading', { isLoading });
        set({ isLoading });
      },

      setError: (error) => {
        if (error) {
          logger.error('setError', error);
        }
        set({ error });
      },

      resetGame: () => {
        logger.store('resetGame', {});
        set({
          player: null,
          scene: null,
          history: [],
          historySummary: null,
          npcs: new Map(),
          sprites: new Map(),
          combat: null,
          combatLog: [],
          combatTurn: 0,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'gdnd-game-storage',
      partialize: (state) => ({
        player: state.player,
        scene: state.scene,
        history: state.history,
        historySummary: state.historySummary,
        settings: state.settings,
      }),
    }
  )
);
