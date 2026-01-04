'use client';

import { useGameStore } from '@/stores/game-store';
import { base64ToDataUrl } from '@/lib/utils';

export function CharacterSheet() {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const statModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : mod.toString();
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      {/* Portrait and Name */}
      <div className="flex items-center gap-4">
        {player.portrait ? (
          <img
            src={base64ToDataUrl(player.portrait)}
            alt={player.name}
            className="w-16 h-16 rounded-lg pixelated object-cover border border-accent/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-2xl text-muted">?</span>
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-accent">{player.name}</h2>
          <p className="text-sm text-muted capitalize">
            {player.race} {player.class} (Lvl {player.level})
          </p>
        </div>
      </div>

      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted">HP</span>
          <span className={player.hp.current <= player.hp.max * 0.25 ? 'text-danger' : 'text-foreground'}>
            {player.hp.current}/{player.hp.max}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              player.hp.current <= player.hp.max * 0.25
                ? 'bg-danger'
                : player.hp.current <= player.hp.max * 0.5
                ? 'bg-yellow-500'
                : 'bg-success'
            }`}
            style={{ width: `${(player.hp.current / player.hp.max) * 100}%` }}
          />
        </div>
      </div>

      {/* Gold */}
      <div className="flex justify-between text-sm">
        <span className="text-muted">Gold</span>
        <span className="text-accent">{player.gold} gp</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {Object.entries(player.stats).map(([stat, value]) => (
          <div key={stat} className="bg-white/5 rounded p-2">
            <div className="text-muted uppercase">{stat}</div>
            <div className="font-bold">{value}</div>
            <div className="text-accent text-xs">{statModifier(value)}</div>
          </div>
        ))}
      </div>

      {/* Inventory */}
      {player.inventory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">Inventory</h3>
          <div className="flex flex-wrap gap-1">
            {player.inventory.map((item) => (
              <span
                key={item.id}
                className="text-xs bg-white/10 px-2 py-1 rounded"
              >
                {item.name} {item.quantity > 1 && `(x${item.quantity})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
