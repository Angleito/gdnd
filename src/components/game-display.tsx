'use client';

import { useGameStore } from '@/stores/game-store';
import { base64ToDataUrl } from '@/lib/utils';

export function GameDisplay() {
  const { scene, history, combat } = useGameStore();

  const narrativeMessages = history.filter((msg) => msg.role === 'model');
  const latestNarrative = narrativeMessages[narrativeMessages.length - 1];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Cinematic Scene Container */}
      <div className="relative w-full aspect-video max-h-[60vh] overflow-hidden rounded-xl border border-white/10">
        {/* Scene Image or Fallback Gradient */}
        {scene?.sprite ? (
          <img
            src={base64ToDataUrl(scene.sprite)}
            alt="Current scene"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/30 via-background to-background" />
        )}

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Combat Overlay - Top Center */}
        {combat?.inCombat && combat.enemies.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg border border-danger/30">
            {combat.enemies.map((enemy) => (
              <div key={enemy.id} className="flex items-center gap-3">
                {enemy.portrait ? (
                  <img
                    src={base64ToDataUrl(enemy.portrait)}
                    alt={enemy.name}
                    className="w-10 h-10 rounded-lg object-cover border border-danger/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center border border-danger/50">
                    <svg className="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-[100px]">
                  <p className="text-sm font-semibold text-white truncate">{enemy.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-danger to-red-400 transition-all duration-300"
                        style={{ width: `${Math.max(0, (enemy.hp.current / enemy.hp.max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/80 font-mono">
                      {enemy.hp.current}/{enemy.hp.max}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Narrative Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {latestNarrative ? (
            <p className="text-base md:text-lg lg:text-xl leading-relaxed text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {latestNarrative.content}
            </p>
          ) : (
            <p className="text-lg text-white/60 italic">
              Your adventure awaits...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
