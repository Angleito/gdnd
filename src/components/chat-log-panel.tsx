'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/stores/game-store';
import { CombatLogEntry } from './combat-log-entry';

interface ChatLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'combat' | 'narrative';

export function ChatLogPanel({ isOpen, onClose }: ChatLogPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('combat');
  const { combatLog, history, combatTurn } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const narrativeMessages = history.filter((msg) => msg.role === 'model');

  // Group combat log by turn
  const logByTurn = combatLog.reduce((acc, entry) => {
    const turn = entry.turn;
    if (!acc[turn]) acc[turn] = [];
    acc[turn].push(entry);
    return acc;
  }, {} as Record<number, typeof combatLog>);

  const turns = Object.keys(logByTurn).map(Number).sort((a, b) => b - a);

  // Auto-scroll to bottom when new entries added
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = 0;
    }
  }, [combatLog.length, isOpen]);

  return (
    <>
      {/* Backdrop - transparent, just for click handling */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed right-0 top-0 h-full w-96 z-50
          bg-background/95 backdrop-blur-md
          border-l border-white/10
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-accent">Adventure Log</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('combat')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'combat'
                ? 'text-accent'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Combat
            {combatLog.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-accent/20 text-accent">
                {combatLog.length}
              </span>
            )}
            {activeTab === 'combat' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('narrative')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'narrative'
                ? 'text-accent'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Narrative
            {narrativeMessages.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/10 text-muted">
                {narrativeMessages.length}
              </span>
            )}
            {activeTab === 'narrative' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
          {activeTab === 'combat' ? (
            <div className="space-y-4">
              {combatLog.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-muted/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M17 14l4-4-3-3-4 4M9 12l-6 6 3 3 6-6" />
                  </svg>
                  <p className="text-muted text-sm">No combat yet</p>
                  <p className="text-muted/60 text-xs mt-1">Combat actions will appear here</p>
                </div>
              ) : (
                turns.map((turn) => (
                  <div key={turn}>
                    {/* Turn Separator */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs font-semibold text-accent px-2 py-1 bg-accent/10 rounded">
                        Turn {turn}
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Entries for this turn */}
                    <div className="space-y-2">
                      {logByTurn[turn].map((entry) => (
                        <CombatLogEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {narrativeMessages.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-muted/50 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-muted text-sm">No narrative yet</p>
                  <p className="text-muted/60 text-xs mt-1">Your adventure story will appear here</p>
                </div>
              ) : (
                [...narrativeMessages].reverse().map((msg, index) => (
                  <div
                    key={msg.timestamp}
                    className={`p-3 rounded-lg border ${
                      index === 0
                        ? 'bg-accent/5 border-accent/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <p className={`text-sm leading-relaxed ${
                      index === 0 ? 'text-foreground' : 'text-muted'
                    }`}>
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted/60 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer - Current Turn Indicator */}
        {combatTurn > 0 && (
          <div className="p-3 border-t border-white/10 bg-white/5">
            <p className="text-xs text-center text-muted">
              Current Combat Turn: <span className="text-accent font-bold">{combatTurn}</span>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
