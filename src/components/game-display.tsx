'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/game-store';
import { base64ToDataUrl } from '@/lib/utils';

export function GameDisplay() {
  const { scene, history, combat } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const narrativeMessages = history.filter((msg) => msg.role === 'model');
  const latestNarrative = narrativeMessages[narrativeMessages.length - 1];

  return (
    <div className="flex flex-col h-full">
      {/* Scene Sprite */}
      {scene?.sprite && (
        <div className="mb-4 rounded-lg overflow-hidden border border-white/10">
          <img
            src={base64ToDataUrl(scene.sprite)}
            alt="Current scene"
            className="w-full h-32 object-cover pixelated"
          />
        </div>
      )}

      {/* Combat Display */}
      {combat?.inCombat && combat.enemies.length > 0 && (
        <div className="mb-4 p-4 bg-danger/10 border border-danger/30 rounded-lg">
          <h3 className="text-danger font-bold mb-3">Combat!</h3>
          <div className="flex gap-4 flex-wrap">
            {combat.enemies.map((enemy) => (
              <div key={enemy.id} className="flex items-center gap-2">
                {enemy.portrait ? (
                  <img
                    src={base64ToDataUrl(enemy.portrait)}
                    alt={enemy.name}
                    className="w-12 h-12 rounded pixelated border border-danger/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-danger/20 flex items-center justify-center">
                    <span className="text-danger">!</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{enemy.name}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-danger transition-all"
                        style={{ width: `${(enemy.hp.current / enemy.hp.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted">
                      {enemy.hp.current}/{enemy.hp.max}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {combat.currentTurn && (
            <p className="mt-2 text-sm text-muted">
              Current turn: <span className="text-foreground">{combat.currentTurn}</span>
            </p>
          )}
        </div>
      )}

      {/* Narrative */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
      >
        {narrativeMessages.length === 0 ? (
          <p className="text-muted text-center py-8">Your adventure awaits...</p>
        ) : (
          narrativeMessages.map((msg, index) => (
            <div
              key={msg.timestamp}
              className={`animate-fade-in ${
                index === narrativeMessages.length - 1 ? 'text-foreground' : 'text-muted'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
