import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, GameMessage, Scene, NPC, CombatState, DMCombatState, GameSettings, Race, Class } from '@/types/game';
import { BASE_STATS, BASE_HP, STARTING_GOLD, getVoiceForNPC } from '@/lib/game/constants';
import { generateId } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface GameState {
  player: Player | null;
  scene: Scene | null;
  history: GameMessage[];
  npcs: Map<string, NPC>;
  sprites: Map<string, string>;
  combat: CombatState | null;
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
  
  addNPC: (name: string, description: string, disposition?: 'friendly' | 'neutral' | 'hostile') => NPC;
  setNPCPortrait: (id: string, portrait: string) => void;
  
  cacheSprite: (key: string, data: string) => void;
  getSprite: (key: string) => string | undefined;
  
  setCombat: (combat: DMCombatState | null) => void;
  updateEnemyHP: (enemyId: string, delta: number) => void;
  
  setSettings: (settings: Partial<GameSettings>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  resetGame: () => void;
}

const initialSettings: GameSettings = {
  ttsEnabled: true,
  volume: 0.8,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: null,
      scene: null,
      history: [],
      npcs: new Map(),
      sprites: new Map(),
      combat: null,
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

      addNPC: (name, description, disposition = 'neutral') => {
        const id = `npc-${name.toLowerCase().replace(/\s+/g, '-')}`;
        const voice = getVoiceForNPC(name);
        
        logger.store('addNPC', { id, name, disposition, voice });

        const npc: NPC = {
          id,
          name,
          description,
          portrait: null,
          voice,
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
        set((state) => {
          const newSprites = new Map(state.sprites);
          newSprites.set(key, data);
          return { sprites: newSprites };
        });
      },

      getSprite: (key) => {
        return get().sprites.get(key);
      },

      setCombat: (combat) => {
        if (!combat) {
          logger.store('setCombat', { combat: null });
          set({ combat: null });
          return;
        }
        
        logger.store('setCombat', {
          inCombat: combat.inCombat,
          enemyCount: combat.enemies.length,
          enemies: combat.enemies.map(e => e.name),
          currentTurn: combat.currentTurn,
        });

        const combatWithPortraits: CombatState = {
          ...combat,
          enemies: combat.enemies.map(e => ({ ...e, portrait: null })),
        };
        set({ combat: combatWithPortraits });
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
          npcs: new Map(),
          sprites: new Map(),
          combat: null,
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
        settings: state.settings,
      }),
    }
  )
);
