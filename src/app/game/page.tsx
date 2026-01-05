'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { CharacterSheet } from '@/components/character-sheet';
import { GameDisplay } from '@/components/game-display';
import { ActionInput } from '@/components/action-input';
import { AudioPlayer, TTSToggle } from '@/components/audio-player';
import { LoadingSpinner } from '@/components/loading-spinner';
import { logger } from '@/lib/logger';
import type { DMResponseType } from '@/lib/game/schemas';

export default function GamePage() {
  const router = useRouter();
  const {
    player,
    history,
    settings,
    isLoading,
    setLoading,
    setError,
    addMessage,
    updatePlayerHP,
    updatePlayerGold,
    addItem,
    removeItem,
    setScene,
    setCombat,
    addNPC,
    setNPCPortrait,
    cacheSprite,
    getSprite,
  } = useGameStore();

  const [actions, setActions] = useState<string[]>([]);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  // Redirect if no player
  useEffect(() => {
    if (!player) {
      logger.ui('GamePage', 'No player found, redirecting to create');
      router.push('/create');
    }
  }, [player, router]);

  // Extract initial actions from backstory response
  useEffect(() => {
    const lastModelMessage = history.filter((m) => m.role === 'model').pop();
    if (lastModelMessage && actions.length === 0) {
      logger.game('Setting default actions');
      setActions([
        'Look around and observe your surroundings',
        'Check your equipment and inventory',
        'Approach and investigate further',
      ]);
    }
  }, [history, actions.length]);

  const handleAction = useCallback(
    async (action: string) => {
      if (!player || isLoading) return;

      logger.group('GAME', `Player Action: ${action}`);
      logger.game('Action initiated', { action, playerHP: player.hp.current });

      setLoading(true);
      setError(null);
      setCurrentAudio(null);

      try {
        addMessage('user', action);

        logger.api('POST', '/api/dm', 'request', { type: 'action', action });
        const startTime = Date.now();
        
        const response = await fetch('/api/dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'action',
            player,
            history,
            action,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response from DM');
        }

        const data: DMResponseType = await response.json();
        const elapsed = Date.now() - startTime;

        logger.api('POST', '/api/dm', 'response', {
          narrativeLength: data.narrative.length,
          actionsCount: data.actions.length,
          hasNewCharacter: !!data.newCharacter,
          hasNewScene: !!data.newScene,
          hasCombat: !!data.combat,
        }, elapsed);

        addMessage('model', data.narrative);
        setActions(data.actions);

        // Apply state changes
        if (data.stateChanges) {
          logger.game('Applying state changes', data.stateChanges);
          if (data.stateChanges.hpDelta) {
            updatePlayerHP(data.stateChanges.hpDelta);
          }
          if (data.stateChanges.goldDelta) {
            updatePlayerGold(data.stateChanges.goldDelta);
          }
          data.stateChanges.addItems?.forEach((item) => addItem(item));
          data.stateChanges.removeItems?.forEach((item) => removeItem(item));
        }

        // Handle combat
        if (data.combat) {
          logger.game('Combat initiated', {
            enemies: data.combat.enemies.map(e => e.name),
            currentTurn: data.combat.currentTurn,
          });
          setCombat(data.combat);
          
          // Generate portraits for new enemies
          for (const enemy of data.combat.enemies) {
            const spriteKey = `enemy-${enemy.id}`;
            if (!getSprite(spriteKey)) {
              logger.game('Generating enemy portrait', { enemyId: enemy.id, name: enemy.name });
              fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'npc',
                  name: enemy.name,
                  description: enemy.description,
                }),
              })
                .then((res) => res.json())
                .then((imgData) => {
                  if (imgData.image) {
                    logger.game('Enemy portrait cached', { enemyId: enemy.id });
                    cacheSprite(spriteKey, imgData.image);
                  }
                })
                .catch((err) => logger.error('GamePage', 'Enemy portrait generation failed', { error: err.message }));
            }
          }
        } else {
          setCombat(null);
        }

        // Handle new character
        if (data.newCharacter) {
          logger.game('New character introduced', { name: data.newCharacter.name });
          const npc = addNPC(data.newCharacter.name, data.newCharacter.description);
          
          fetch('/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'npc',
              name: data.newCharacter.name,
              description: data.newCharacter.description,
            }),
          })
            .then((res) => res.json())
            .then((imgData) => {
              if (imgData.image) {
                logger.game('NPC portrait generated', { npcId: npc.id });
                setNPCPortrait(npc.id, imgData.image);
                cacheSprite(npc.id, imgData.image);
              }
            })
            .catch((err) => logger.error('GamePage', 'NPC portrait generation failed', { error: err.message }));
        }

        // Handle new scene
        if (data.newScene) {
          logger.game('New scene', { description: data.newScene.description });
          fetch('/api/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'scene',
              description: data.newScene.description,
            }),
          })
            .then((res) => res.json())
            .then((imgData) => {
              if (imgData.image) {
                logger.game('Scene sprite generated');
                setScene(data.newScene!.description, imgData.image);
              }
            })
            .catch((err) => logger.error('GamePage', 'Scene sprite generation failed', { error: err.message }));
        }

        // Generate TTS in background
        if (settings.ttsEnabled) {
          logger.game('Generating TTS narration');
          fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: data.narrative,
              voice: 'Kore',
            }),
          })
            .then((res) => res.json())
            .then((ttsData) => {
              if (ttsData.audio) {
                logger.game('TTS audio ready', { audioSize: ttsData.audio.length });
                setCurrentAudio(ttsData.audio);
              }
            })
            .catch((err) => logger.error('GamePage', 'TTS generation failed', { error: err.message }));
        }

        logger.groupEnd();
      } catch (err) {
        logger.error('GamePage', 'Game action error', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        logger.groupEnd();
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [
      player,
      history,
      isLoading,
      settings.ttsEnabled,
      addMessage,
      updatePlayerHP,
      updatePlayerGold,
      addItem,
      removeItem,
      setScene,
      setCombat,
      addNPC,
      setNPCPortrait,
      cacheSprite,
      getSprite,
      setLoading,
      setError,
    ]
  );

  const handleNewGame = () => {
    logger.ui('GamePage', 'New game requested');
    useGameStore.getState().resetGame();
    router.push('/');
  };

  if (!player) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading your adventure..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Character Sheet */}
      <aside className="lg:w-72 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-accent">AI Dungeon Master</h1>
          <div className="flex items-center gap-2">
            <TTSToggle />
            <button
              onClick={handleNewGame}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-muted hover:text-foreground transition-colors"
              title="New Game"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <CharacterSheet />
        {currentAudio && (
          <div className="mt-4">
            <AudioPlayer audioBase64={currentAudio} />
          </div>
        )}
      </aside>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-200px)] lg:min-h-screen">
        {/* Narrative Display */}
        <div className="flex-1 p-4 lg:p-6 overflow-hidden">
          <GameDisplay />
        </div>

        {/* Actions */}
        <div className="border-t border-white/10 p-4 lg:p-6 bg-white/[0.02]">
          <ActionInput
            actions={actions}
            onAction={handleAction}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  );
}
