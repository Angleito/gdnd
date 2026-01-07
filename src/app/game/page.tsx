'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { CharacterSheet } from '@/components/character-sheet';
import { GameDisplay } from '@/components/game-display';
import { ActionInput } from '@/components/action-input';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ChatLogButton } from '@/components/chat-log-button';
import { ChatLogPanel } from '@/components/chat-log-panel';
import { DiceRollerModal } from '@/components/dice-roller';
import { SettingsPanel } from '@/components/settings-panel';
import { logger } from '@/lib/logger';
import { shouldRegenerateScene } from '@/lib/utils';
import type { DMResponseType } from '@/lib/game/schemas';
import { detectSkillCheck, getCheckReason, performSkillCheck } from '@/lib/dice';
import type { SkillCheckResult } from '@/lib/dice';

export default function GamePage() {
  const router = useRouter();
  const {
    player,
    scene,
    history,
    historySummary,
    isLoading,
    combatLog,
    combatTurn,
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
    addCombatLogEntries,
    setHistorySummary,
    loadSpritesFromStorage,
  } = useGameStore();

  const [actions, setActions] = useState<string[]>([]);
  const [chatLogOpen, setChatLogOpen] = useState(false);
  const [lastSeenLogCount, setLastSeenLogCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Dice roller state
  const [diceRollResult, setDiceRollResult] = useState<SkillCheckResult | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showDiceRoller, setShowDiceRoller] = useState(false);

  // Load cached sprites from localStorage on mount
  useEffect(() => {
    loadSpritesFromStorage();
  }, [loadSpritesFromStorage]);

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

  // Summarize history when it gets too long (every 10 messages after 20)
  useEffect(() => {
    const summarizeIfNeeded = async () => {
      const historyLength = history.length;
      // Summarize when we have 20+ messages and every 10 after that
      const shouldSummarize = historyLength >= 20 && historyLength % 10 === 0;
      
      if (shouldSummarize && !isLoading) {
        try {
          logger.game('Summarizing history', { historyLength });
          
          // Get messages to summarize (everything except last 10)
          const toSummarize = history.slice(0, -10);
          
          const response = await fetch('/api/dm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'summarize',
              messages: toSummarize,
              existingSummary: historySummary || '',
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.summary) {
              setHistorySummary(data.summary);
              logger.game('History summarized', { summaryLength: data.summary.length });
            }
          }
        } catch (err) {
          // Fail silently - summarization is optional
          logger.error('GamePage', 'History summarization failed');
        }
      }
    };
    
    summarizeIfNeeded();
  }, [history.length, historySummary, isLoading, history, setHistorySummary]);

  // Submit action to DM (with optional skill check result)
  const submitActionToDM = useCallback(
    async (action: string, skillCheck?: SkillCheckResult) => {
      if (!player) return;

      logger.group('GAME', `Submitting Action: ${action}`);
      setLoading(true);
      setError(null);

      try {
        addMessage('user', action);

        const requestBody: Record<string, unknown> = {
          type: 'action',
          player,
          history,
          historySummary,
          action,
        };

        // Include skill check result if provided
        if (skillCheck) {
          requestBody.skillCheck = {
            type: skillCheck.check.type,
            skill: skillCheck.check.skill,
            ability: skillCheck.check.ability,
            roll: skillCheck.roll,
            modifier: skillCheck.modifier,
            total: skillCheck.total,
            isCritical: skillCheck.isCritical,
            isFumble: skillCheck.isFumble,
            reason: skillCheck.reason,
          };
          logger.game('Including skill check', requestBody.skillCheck as Record<string, unknown>);
        }

        logger.api('POST', '/api/dm', 'request', { type: 'action', action, hasSkillCheck: !!skillCheck });
        const startTime = Date.now();
        
        const response = await fetch('/api/dm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
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

        // Process combat log entries from DM
        if (data.combatLog && data.combatLog.length > 0) {
          logger.game('Adding combat log entries', { count: data.combatLog.length });
          const entries = data.combatLog.map((entry) => ({
            ...entry,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
          }));
          addCombatLogEntries(entries);
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

        // Handle new scene - only regenerate if significantly different
        if (data.newScene) {
          const currentSceneDesc = scene?.description || null;
          
          if (shouldRegenerateScene(currentSceneDesc, data.newScene.description)) {
            logger.game('New scene (regenerating)', { description: data.newScene.description });
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
          } else {
            // Reuse existing scene image, just update description
            logger.game('New scene (reusing image)', { description: data.newScene.description });
            setScene(data.newScene.description, scene?.sprite || undefined);
          }
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
      scene,
      history,
      historySummary,
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
      addCombatLogEntries,
    ]
  );

  // Handle action - check if skill check needed first
  const handleAction = useCallback(
    async (action: string) => {
      if (!player || isLoading) return;

      logger.group('GAME', `Player Action: ${action}`);
      logger.game('Action initiated', { action, playerHP: player.hp.current });

      // Check if this action requires a skill check
      const check = detectSkillCheck(action);

      if (check) {
        logger.game('Skill check detected', { check });
        
        // Perform the roll
        const reason = getCheckReason(action, check);
        const result = performSkillCheck(check, player.stats, reason);
        
        logger.game('Skill check result', {
          skill: check.skill,
          ability: check.ability,
          roll: result.roll,
          modifier: result.modifier,
          total: result.total,
          isCritical: result.isCritical,
          isFumble: result.isFumble,
        });

        // Add to combat log (store adds id/timestamp automatically)
        addCombatLogEntries([{
          turn: combatTurn,
          type: result.isCritical ? 'critical' : result.isFumble ? 'fumble' : 'roll',
          actor: player.name,
          action: reason,
          diceRoll: {
            dice: 'D20',
            count: 1,
            rolls: [result.roll],
            modifier: result.modifier,
            total: result.total,
          },
          result: result.isCritical ? 'critical' : result.isFumble ? 'fumble' : 'success',
        }]);

        // Show dice roller modal
        setDiceRollResult(result);
        setPendingAction(action);
        setShowDiceRoller(true);
        
        logger.groupEnd();
        return;
      }

      // No skill check needed, submit directly
      logger.groupEnd();
      await submitActionToDM(action);
    },
    [player, isLoading, combatTurn, addCombatLogEntries, submitActionToDM]
  );

  // Handle dice roll completion
  const handleDiceRollComplete = useCallback(() => {
    setShowDiceRoller(false);
    
    if (pendingAction && diceRollResult) {
      // Submit the action with the skill check result
      submitActionToDM(pendingAction, diceRollResult);
    }
    
    setPendingAction(null);
    setDiceRollResult(null);
  }, [pendingAction, diceRollResult, submitActionToDM]);

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
      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={showDiceRoller}
        result={diceRollResult}
        onComplete={handleDiceRollComplete}
      />

      {/* Settings Panel (LEFT side) */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Chat Log FAB and Panel */}
      <ChatLogButton
        count={combatLog.length}
        onClick={() => {
          setChatLogOpen(true);
          setLastSeenLogCount(combatLog.length);
        }}
        hasNew={combatLog.length > lastSeenLogCount}
      />
      <ChatLogPanel
        isOpen={chatLogOpen}
        onClose={() => setChatLogOpen(false)}
      />

      {/* Sidebar - Character Sheet */}
      <aside className="lg:w-72 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-white/10 p-4 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-accent">AI Dungeon Master</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-muted hover:text-foreground transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
