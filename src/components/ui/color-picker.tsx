'use client';

import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#dc2626', // Red
  '#16a34a', // Green
  '#d4af37', // Gold
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#000000', // Black
  '#ffffff', // White
];

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value is a preset
  const isPreset = PRESET_COLORS.includes(value.toLowerCase());

  useEffect(() => {
    if (showCustom && inputRef.current) {
      inputRef.current.click();
    }
  }, [showCustom]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted">{label}</label>
      
      {/* Preset colors grid */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => {
              onChange(color);
              setShowCustom(false);
            }}
            className={`
              w-full aspect-square rounded-lg border-2 transition-all
              hover:scale-105 hover:shadow-lg
              ${value.toLowerCase() === color.toLowerCase() 
                ? 'border-accent ring-2 ring-accent/50' 
                : 'border-white/20 hover:border-white/40'}
            `}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom color picker */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`
            flex-1 px-3 py-2 rounded-lg border text-sm transition-all
            ${!isPreset 
              ? 'border-accent bg-accent/10 text-accent' 
              : 'border-white/20 text-muted hover:border-white/40 hover:text-foreground'}
          `}
        >
          Custom Color
        </button>
        
        {/* Current color preview */}
        <div
          className="w-10 h-10 rounded-lg border border-white/20"
          style={{ backgroundColor: value }}
        />
        
        {/* Hidden native color picker */}
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 opacity-0 absolute"
        />
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                onChange(val);
              }
            }}
            placeholder="#000000"
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-sm font-mono focus:outline-none focus:border-accent"
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            Pick
          </button>
        </div>
      )}
    </div>
  );
}
