'use client';

import { useState } from 'react';
import { LoadingSpinner } from './loading-spinner';

interface ActionInputProps {
  actions: string[];
  onAction: (action: string) => void;
  isLoading: boolean;
}

export function ActionInput({ actions, onAction, isLoading }: ActionInputProps) {
  const [customAction, setCustomAction] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAction.trim() && !isLoading) {
      onAction(customAction.trim());
      setCustomAction('');
      setShowCustom(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner message="The Dungeon Master ponders..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preset Actions */}
      <div className="grid gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onAction(action)}
            disabled={isLoading}
            className="w-full p-3 text-left bg-white/5 border border-white/10 rounded-lg hover:border-accent/50 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-accent mr-2">{index + 1}.</span>
            <span className="group-hover:text-accent transition-colors">{action}</span>
          </button>
        ))}
      </div>

      {/* Custom Action Toggle */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="w-full p-3 text-center text-muted border border-dashed border-white/10 rounded-lg hover:border-accent/30 hover:text-foreground transition-all"
        >
          + Custom action
        </button>
      ) : (
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <input
            type="text"
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            placeholder="What do you do?"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-accent/50 focus:outline-none"
            autoFocus
            maxLength={200}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCustom(false);
                setCustomAction('');
              }}
              className="flex-1 py-2 text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!customAction.trim()}
              className="flex-1 py-2 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50"
            >
              Do it
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
