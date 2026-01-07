'use client';

import { useState, useEffect } from 'react';

interface DiceFallbackProps {
  targetValue: number;
  isRolling: boolean;
  onRollComplete: () => void;
  onStartRoll: () => void;
}

export function DiceFallback({
  targetValue,
  isRolling,
  onRollComplete,
  onStartRoll,
}: DiceFallbackProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(null);
      setAnimating(false);
      return;
    }

    setAnimating(true);
    
    // Animate through random numbers
    let frame = 0;
    const maxFrames = 20;
    const interval = setInterval(() => {
      frame++;
      setDisplayValue(Math.floor(Math.random() * 20) + 1);
      
      if (frame >= maxFrames) {
        clearInterval(interval);
        setDisplayValue(targetValue);
        setAnimating(false);
        setTimeout(onRollComplete, 500);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isRolling, targetValue, onRollComplete]);

  const diceColor = targetValue === 20 
    ? 'from-yellow-500 to-yellow-600' 
    : targetValue === 1 
      ? 'from-red-500 to-red-600' 
      : 'from-indigo-500 to-indigo-600';

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black/30 rounded-lg">
      {/* D20 shape (CSS) */}
      <div
        className={`
          relative w-24 h-24
          bg-gradient-to-br ${diceColor}
          rounded-lg
          shadow-lg shadow-indigo-500/30
          flex items-center justify-center
          transform transition-transform duration-100
          ${animating ? 'animate-bounce scale-110' : ''}
          ${!isRolling ? 'hover:scale-105 cursor-pointer' : ''}
        `}
        onClick={!isRolling ? onStartRoll : undefined}
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        <span className={`
          text-3xl font-black text-white drop-shadow-lg
          ${animating ? 'animate-pulse' : ''}
        `}>
          {displayValue ?? '?'}
        </span>
      </div>

      {/* Click to roll text */}
      {!isRolling && !displayValue && (
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <span className="text-sm text-muted animate-pulse">
            Click to Roll
          </span>
        </div>
      )}
    </div>
  );
}
