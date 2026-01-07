'use client';

import { useGameStore } from '@/stores/game-store';
import { ColorPicker } from '@/components/ui/color-picker';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DICE_SETTINGS = {
  color: '#4f46e5',
  numberColor: '#ffffff',
  criticalColor: '#fbbf24',
  fumbleColor: '#ef4444',
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, setSettings } = useGameStore();

  // Fallback for older persisted settings without dice property
  const diceSettings = settings.dice ?? DEFAULT_DICE_SETTINGS;

  const updateDiceSetting = (key: keyof typeof diceSettings, value: string) => {
    setSettings({
      dice: {
        ...diceSettings,
        [key]: value,
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed left-0 top-0 h-full w-80 z-50
          bg-background/95 backdrop-blur-md
          border-r border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-accent">Dice Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Dice Color */}
          <ColorPicker
            label="Dice Color"
            value={diceSettings.color}
            onChange={(color) => updateDiceSetting('color', color)}
          />

          {/* Number Color */}
          <ColorPicker
            label="Number Color"
            value={diceSettings.numberColor}
            onChange={(color) => updateDiceSetting('numberColor', color)}
          />

          {/* Critical Color */}
          <ColorPicker
            label="Critical (Nat 20) Color"
            value={diceSettings.criticalColor}
            onChange={(color) => updateDiceSetting('criticalColor', color)}
          />

          {/* Fumble Color */}
          <ColorPicker
            label="Fumble (Nat 1) Color"
            value={diceSettings.fumbleColor}
            onChange={(color) => updateDiceSetting('fumbleColor', color)}
          />

          {/* Reset to defaults */}
          <button
            onClick={() => setSettings({ dice: DEFAULT_DICE_SETTINGS })}
            className="w-full px-4 py-2 rounded-lg border border-white/20 text-sm text-muted hover:text-foreground hover:border-white/40 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </>
  );
}
