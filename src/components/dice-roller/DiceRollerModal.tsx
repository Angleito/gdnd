'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { SkillCheckResult } from '@/lib/dice/types';
import { SKILL_NAMES, ABILITY_NAMES } from '@/lib/dice/types';
import { formatModifier } from '@/lib/dice/modifiers';
import { useGameStore } from '@/stores/game-store';

// Dynamic import to avoid SSR issues with Three.js
const DiceScene = dynamic(
  () => import('./DiceScene').then((mod) => mod.DiceScene),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black/50 rounded-lg">
        <div className="text-muted animate-pulse">Loading dice...</div>
      </div>
    ),
  }
);

interface DiceRollerModalProps {
  isOpen: boolean;
  result: SkillCheckResult | null;
  onComplete: () => void;
}

export function DiceRollerModal({ isOpen, result, onComplete }: DiceRollerModalProps) {
  const { settings } = useGameStore();
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && result) {
      setIsRolling(false);
      setShowResult(false);
      setHasRolled(false);
    }
  }, [isOpen, result]);

  const handleStartRoll = useCallback(() => {
    setIsRolling(true);
    setHasRolled(true);
  }, []);

  const handleRollComplete = useCallback(() => {
    if (!result) return;

    setIsRolling(false);
    setShowResult(true);

    // Auto-dismiss after showing result
    setTimeout(() => {
      onComplete();
    }, 2500);
  }, [result, onComplete]);

  if (!isOpen || !result) return null;

  const checkName = result.check.skill
    ? SKILL_NAMES[result.check.skill]
    : ABILITY_NAMES[result.check.ability];

  const checkType = result.check.skill ? 'Skill Check' : 'Ability Check';

  // Determine result styling
  let resultColor = 'text-white';
  let resultBg = 'bg-white/10';
  let resultText = '';
  
  // Fallback for older persisted settings without dice property
  const diceSettings = settings.dice ?? {
    color: '#4f46e5',
    numberColor: '#ffffff',
    criticalColor: '#fbbf24',
    fumbleColor: '#ef4444',
  };
  
  // Use settings for dice colors, with overrides for critical/fumble
  let diceColor = diceSettings.color;
  const numberColor = diceSettings.numberColor;

  if (result.isCritical) {
    resultColor = 'text-yellow-400';
    resultBg = 'bg-yellow-500/20 border-yellow-500/50';
    resultText = 'NATURAL 20!';
    diceColor = diceSettings.criticalColor;
  } else if (result.isFumble) {
    resultColor = 'text-red-400';
    resultBg = 'bg-red-500/20 border-red-500/50';
    resultText = 'NATURAL 1...';
    diceColor = diceSettings.fumbleColor;
  } else if (result.total >= 15) {
    resultBg = 'bg-green-500/10 border-green-500/30';
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 p-6 max-w-md w-full mx-4">
        {/* Check title */}
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted mb-1">
            {checkType}
          </p>
          <h2 className="text-2xl font-bold text-accent">{checkName}</h2>
          <p className="mt-1 text-sm text-muted/80">{result.reason}</p>
        </div>

        {/* 3D Dice Scene */}
        <div className="w-80 h-64 rounded-xl overflow-hidden border border-white/20 bg-black/50">
          <DiceScene
            targetValue={result.roll}
            onRollComplete={handleRollComplete}
            isRolling={isRolling}
            onStartRoll={handleStartRoll}
            diceColor={diceColor}
            numberColor={numberColor}
          />
        </div>

        {/* Roll result display */}
        {showResult && (
          <div
            className={`
              w-full rounded-xl border p-5
              transition-all duration-300 animate-in fade-in slide-in-from-bottom-4
              ${resultBg}
            `}
          >
            {/* Roll breakdown */}
            <div className="flex items-center justify-center gap-2 text-xl font-bold">
              <div className="flex items-center gap-1">
                <span className="text-muted text-sm">D20</span>
                <span className={`text-2xl ${result.isCritical ? 'text-yellow-400' : result.isFumble ? 'text-red-400' : 'text-white'}`}>
                  {result.roll}
                </span>
              </div>
              <span className="text-muted">+</span>
              <div className="flex items-center gap-1">
                <span className="text-muted text-sm">{ABILITY_NAMES[result.check.ability].slice(0, 3).toUpperCase()}</span>
                <span className="text-white">
                  {formatModifier(result.modifier)}
                </span>
              </div>
              <span className="text-muted">=</span>
              <span className={`text-3xl font-black ${result.isCritical ? 'text-yellow-400' : result.isFumble ? 'text-red-400' : 'text-accent'}`}>
                {result.total}
              </span>
            </div>

            {/* Critical/Fumble text */}
            {resultText && (
              <p className={`mt-3 text-center text-lg font-bold ${resultColor} animate-pulse`}>
                {resultText}
              </p>
            )}
          </div>
        )}

        {/* Instruction text when waiting to roll */}
        {!hasRolled && (
          <p className="text-sm text-muted/60 animate-pulse">
            Click the dice to roll
          </p>
        )}

        {/* Rolling indicator */}
        {isRolling && (
          <p className="text-sm text-accent animate-pulse">
            Rolling...
          </p>
        )}
      </div>
    </div>
  );
}
