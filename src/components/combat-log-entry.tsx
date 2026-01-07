'use client';

import type { CombatLogEntry as CombatLogEntryType } from '@/types/game';
import { DiceRoll } from './dice-roll';

interface CombatLogEntryProps {
  entry: CombatLogEntryType;
}

export function CombatLogEntry({ entry }: CombatLogEntryProps) {
  const typeStyles: Record<CombatLogEntryType['type'], string> = {
    attack: 'border-l-accent',
    damage: 'border-l-danger',
    miss: 'border-l-muted',
    heal: 'border-l-success',
    spell: 'border-l-purple-500',
    status: 'border-l-blue-500',
    narrative: 'border-l-white/30',
    roll: 'border-l-accent',
    critical: 'border-l-accent',
    fumble: 'border-l-danger',
  };

  const typeIcons: Record<CombatLogEntryType['type'], React.ReactNode> = {
    attack: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M17 14l4-4-3-3-4 4" />
      </svg>
    ),
    damage: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    miss: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    heal: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    spell: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    status: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    narrative: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    roll: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    critical: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    fumble: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const isPlayerAction = entry.actor === 'You' || entry.actor.toLowerCase() === 'player';

  return (
    <div className={`pl-3 border-l-2 ${typeStyles[entry.type]} py-2`}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 ${isPlayerAction ? 'text-accent' : 'text-danger'}`}>
          {typeIcons[entry.type]}
        </span>
        <div className="flex-1 min-w-0">
          {/* Actor and Action */}
          <p className="text-sm">
            <span className={`font-semibold ${isPlayerAction ? 'text-accent' : 'text-danger'}`}>
              {entry.actor}
            </span>
            {entry.target && (
              <>
                <span className="text-muted"> targets </span>
                <span className="font-semibold text-foreground">{entry.target}</span>
              </>
            )}
            {entry.action && (
              <span className="text-foreground"> - {entry.action}</span>
            )}
          </p>

          {/* Dice Roll */}
          {entry.diceRoll && (
            <div className="mt-2">
              <DiceRoll roll={entry.diceRoll} result={entry.result} />
            </div>
          )}

          {/* Damage/Healing Value */}
          {entry.value !== undefined && entry.type !== 'roll' && (
            <p className={`text-sm mt-1 font-semibold ${
              entry.type === 'heal' ? 'text-success' : 'text-danger'
            }`}>
              {entry.type === 'heal' ? '+' : '-'}{entry.value} 
              {entry.damageType && ` ${entry.damageType}`}
              {entry.type === 'heal' ? ' HP healed' : ' damage'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
