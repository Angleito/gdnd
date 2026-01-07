'use client';

import type { DiceRoll as DiceRollType, DiceType } from '@/types/game';

// SVG Dice Icons
const DiceIcons: Record<DiceType, React.ReactNode> = {
  D4: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L2 20h20L12 2zm0 4l6.5 12h-13L12 6z" />
      <text x="12" y="16" textAnchor="middle" fontSize="6" fill="currentColor" className="font-bold">4</text>
    </svg>
  ),
  D6: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  D8: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L3 12l9 10 9-10L12 2zm0 3l6 7-6 7-6-7 6-7z" />
      <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="font-bold">8</text>
    </svg>
  ),
  D10: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L2 10l4 10h12l4-10L12 2zm0 3l7 6-3 8H8l-3-8 7-6z" />
      <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" className="font-bold">10</text>
    </svg>
  ),
  D12: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5l5.5 3.5v7l-5.5 3.5-5.5-3.5v-7L12 4.5z" />
      <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" className="font-bold">12</text>
    </svg>
  ),
  D20: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <path d="M12 2L3 8.5v7L12 22l9-6.5v-7L12 2zm0 2l6.5 4.5L12 13l-6.5-4.5L12 4zm-7 5.5l6 4v6.5l-6-4v-6.5zm14 0v6.5l-6 4v-6.5l6-4z" />
      <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" className="font-bold">20</text>
    </svg>
  ),
  D100: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" className="font-bold">%</text>
    </svg>
  ),
};

interface DiceRollProps {
  roll: DiceRollType;
  result?: 'hit' | 'miss' | 'critical' | 'fumble' | 'success' | 'failure';
  compact?: boolean;
}

export function DiceRoll({ roll, result, compact }: DiceRollProps) {
  const resultColors = {
    hit: 'text-success',
    success: 'text-success',
    critical: 'text-accent',
    miss: 'text-muted',
    failure: 'text-muted',
    fumble: 'text-danger',
  };

  const resultLabels = {
    hit: 'HIT!',
    success: 'SUCCESS',
    critical: 'CRITICAL!',
    miss: 'MISS',
    failure: 'FAIL',
    fumble: 'FUMBLE!',
  };

  const resultColor = result ? resultColors[result] : 'text-foreground';
  const resultLabel = result ? resultLabels[result] : null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <span className="w-4 h-4 text-accent">{DiceIcons[roll.dice]}</span>
        <span className="font-mono">{roll.total}</span>
        {resultLabel && (
          <span className={`font-bold ${resultColor}`}>{resultLabel}</span>
        )}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
      {/* Dice Icon */}
      <div className="w-10 h-10 text-accent flex-shrink-0">
        {DiceIcons[roll.dice]}
      </div>

      {/* Roll Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Individual rolls */}
          <span className="font-mono text-sm text-muted">
            {roll.count > 1 ? `${roll.count}${roll.dice}` : roll.dice}:
          </span>
          <span className="font-mono text-foreground">
            {roll.rolls.join(' + ')}
          </span>
          
          {/* Modifier */}
          {roll.modifier !== 0 && (
            <span className="font-mono text-muted">
              {roll.modifier > 0 ? '+' : ''}{roll.modifier}
            </span>
          )}
          
          {/* Equals and Total */}
          <span className="font-mono text-muted">=</span>
          <span className={`font-mono font-bold text-lg ${resultColor}`}>
            {roll.total}
          </span>
          
          {/* Result Label */}
          {resultLabel && (
            <span className={`font-bold text-sm px-2 py-0.5 rounded ${
              result === 'critical' ? 'bg-accent/20' :
              result === 'fumble' ? 'bg-danger/20' :
              result === 'hit' || result === 'success' ? 'bg-success/20' :
              'bg-white/10'
            } ${resultColor}`}>
              {resultLabel}
            </span>
          )}
        </div>
        
        {/* Purpose */}
        {roll.purpose && (
          <p className="text-xs text-muted mt-0.5">{roll.purpose}</p>
        )}
      </div>
    </div>
  );
}
