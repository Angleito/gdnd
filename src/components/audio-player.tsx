'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/game-store';
import { base64ToAudioUrl } from '@/lib/utils';

interface AudioPlayerProps {
  audioBase64: string | null;
  autoPlay?: boolean;
}

export function AudioPlayer({ audioBase64, autoPlay = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useGameStore();

  useEffect(() => {
    if (audioBase64 && audioRef.current && autoPlay && settings.ttsEnabled) {
      audioRef.current.volume = settings.volume;
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
      });
    }
  }, [audioBase64, autoPlay, settings.ttsEnabled, settings.volume]);

  if (!audioBase64 || !settings.ttsEnabled) return null;

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={base64ToAudioUrl(audioBase64)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={handlePlayPause}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Settings toggle component
export function TTSToggle() {
  const { settings, setSettings } = useGameStore();

  return (
    <button
      onClick={() => setSettings({ ttsEnabled: !settings.ttsEnabled })}
      className={`p-2 rounded-lg transition-colors ${
        settings.ttsEnabled ? 'bg-accent/20 text-accent' : 'bg-white/10 text-muted'
      }`}
      title={settings.ttsEnabled ? 'Disable narration' : 'Enable narration'}
    >
      {settings.ttsEnabled ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      )}
    </button>
  );
}
