'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/game-store';
import { RACES, CLASSES } from '@/lib/game/constants';
import { LoadingSpinner } from '@/components/loading-spinner';
import { logger } from '@/lib/logger';
import type { Race, Class } from '@/types/game';

type Step = 'race' | 'class' | 'name' | 'generating';

export default function CreatePage() {
  const router = useRouter();
  const { createPlayer, setPlayerBackstory, setPlayerPortrait, addMessage, setScene } = useGameStore();

  const [step, setStep] = useState<Step>('race');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleRaceSelect = (race: Race) => {
    logger.ui('CreatePage', 'Race selected', { race });
    setSelectedRace(race);
    setStep('class');
  };

  const handleClassSelect = (cls: Class) => {
    logger.ui('CreatePage', 'Class selected', { class: cls });
    setSelectedClass(cls);
    setStep('name');
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedRace || !selectedClass) return;

    logger.ui('CreatePage', 'Character creation started', {
      name: name.trim(),
      race: selectedRace,
      class: selectedClass,
    });

    setStep('generating');
    setError(null);

    try {
      createPlayer(name.trim(), selectedRace, selectedClass);

      // Generate backstory
      setLoadingMessage('The fates weave your destiny...');
      logger.api('POST', '/api/dm', 'request', { type: 'backstory' });
      
      const backstoryRes = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'backstory',
          name: name.trim(),
          race: selectedRace,
          characterClass: selectedClass,
        }),
      });

      if (!backstoryRes.ok) {
        throw new Error('Failed to generate backstory');
      }

      const backstoryData = await backstoryRes.json();
      logger.game('Backstory generated', {
        backstoryLength: backstoryData.backstory.length,
        startingSceneLength: backstoryData.startingScene.length,
      });

      setPlayerBackstory(backstoryData.backstory);
      addMessage('model', backstoryData.startingScene);

      // Generate portrait and scene sprite in parallel
      setLoadingMessage('Your world takes shape...');
      
      logger.api('POST', '/api/image', 'request', { type: 'player' });
      logger.api('POST', '/api/image', 'request', { type: 'scene' });

      const [portraitRes, sceneRes] = await Promise.all([
        fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'player',
            race: selectedRace,
            characterClass: selectedClass,
            name: name.trim(),
          }),
        }),
        fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'scene',
            description: backstoryData.startingScene,
          }),
        }),
      ]);

      // Handle portrait
      if (portraitRes.ok) {
        const portraitData = await portraitRes.json();
        logger.game('Portrait generated', { imageSize: portraitData.image.length });
        setPlayerPortrait(portraitData.image);
      } else {
        logger.warn('CreatePage', 'Portrait generation failed, continuing without portrait');
      }

      // Handle scene sprite
      if (sceneRes.ok) {
        const sceneData = await sceneRes.json();
        logger.game('Scene sprite generated', { imageSize: sceneData.image.length });
        setScene(backstoryData.startingScene, sceneData.image);
      } else {
        logger.warn('CreatePage', 'Scene generation failed, continuing without scene sprite');
        setScene(backstoryData.startingScene);
      }

      logger.ui('CreatePage', 'Character creation complete, navigating to game');
      router.push('/game');
    } catch (err) {
      logger.error('CreatePage', 'Character creation error', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('name');
    }
  };

  const handleBack = () => {
    if (step === 'class') {
      logger.ui('CreatePage', 'Back to race selection');
      setStep('race');
    } else if (step === 'name') {
      logger.ui('CreatePage', 'Back to class selection');
      setStep('class');
    }
  };

  if (step === 'generating') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8">
          <h1 className="text-3xl font-bold text-accent">Creating Your Legend</h1>
          <LoadingSpinner size="lg" message={loadingMessage} />
          <p className="text-muted text-sm max-w-md">
            The Dungeon Master prepares your adventure...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-accent">AI Dungeon Master</h1>
          <p className="text-muted">Begin your solo D&D adventure</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-center">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {step === 'race' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-center">Choose Your Race</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {RACES.map((race) => (
                <button
                  key={race.value}
                  onClick={() => handleRaceSelect(race.value)}
                  className="p-4 rounded-lg border border-white/10 hover:border-accent/50 hover:bg-white/5 transition-all text-left group"
                >
                  <h3 className="font-semibold text-accent group-hover:text-accent-dim">
                    {race.label}
                  </h3>
                  <p className="text-sm text-muted mt-1">{race.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'class' && selectedRace && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-muted hover:text-foreground transition-colors"
              >
                &larr; Back
              </button>
              <h2 className="text-xl font-semibold">Choose Your Class</h2>
              <div className="w-12" />
            </div>
            <p className="text-center text-muted">
              Playing as a <span className="text-accent">{RACES.find(r => r.value === selectedRace)?.label}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CLASSES.map((cls) => (
                <button
                  key={cls.value}
                  onClick={() => handleClassSelect(cls.value)}
                  className="p-4 rounded-lg border border-white/10 hover:border-accent/50 hover:bg-white/5 transition-all text-left group"
                >
                  <h3 className="font-semibold text-accent group-hover:text-accent-dim">
                    {cls.label}
                  </h3>
                  <p className="text-sm text-muted mt-1">{cls.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'name' && selectedRace && selectedClass && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="text-muted hover:text-foreground transition-colors"
              >
                &larr; Back
              </button>
              <h2 className="text-xl font-semibold">Name Your Character</h2>
              <div className="w-12" />
            </div>
            <p className="text-center text-muted">
              A <span className="text-accent">{RACES.find(r => r.value === selectedRace)?.label}</span>{' '}
              <span className="text-accent">{CLASSES.find(c => c.value === selectedClass)?.label}</span>
            </p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-accent/50 focus:outline-none text-center text-lg"
                autoFocus
                maxLength={30}
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Begin Adventure
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
