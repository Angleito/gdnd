'use client';

import Link from 'next/link';

// Deterministic "random" based on seed - avoids hydration mismatch
// Round to 2 decimal places to prevent floating point precision differences
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return Math.round((x - Math.floor(x)) * 100) / 100;
};

// SVG Icons
const DragonIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="w-16 h-16">
    <path d="M52 12c-2-2-5-3-8-2l-4 2-6-4c-2-1-4-1-6 0l-6 4-4-2c-3-1-6 0-8 2-3 3-3 7-1 10l4 6-2 8c-1 3 0 6 2 8l6 6 2 8c1 3 3 5 6 6l8 2 8-2c3-1 5-3 6-6l2-8 6-6c2-2 3-5 2-8l-2-8 4-6c2-3 2-7-1-10zm-20 36c-6 0-10-4-10-10s4-10 10-10 10 4 10 10-4 10-10 10z"/>
    <circle cx="28" cy="38" r="3"/>
    <circle cx="40" cy="38" r="3"/>
  </svg>
);

const MindflayerIcon = () => (
  <svg viewBox="0 0 64 64" fill="currentColor" className="w-16 h-16">
    <ellipse cx="32" cy="24" rx="16" ry="20"/>
    <path d="M20 44c-2 4-4 8-2 12 1 2 3 4 6 4M32 44v16M44 44c2 4 4 8 2 12-1 2-3 4-6 4"/>
    <path d="M24 48c-4 2-8 6-6 10M40 48c4 2 8 6 6 10"/>
    <circle cx="26" cy="20" r="4" fill="#0a0a0a"/>
    <circle cx="38" cy="20" r="4" fill="#0a0a0a"/>
    <circle cx="26" cy="20" r="2" fill="#d4af37"/>
    <circle cx="38" cy="20" r="2" fill="#d4af37"/>
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 4.5c-1.5-2-4-2.5-6-1.5S3 6 3 8c0 1.5.5 3 1.5 4-1 1.5-1.5 3.5-1 5.5.5 2 2.5 3.5 4.5 3.5 1.5 0 3-.5 4-2 1 1.5 2.5 2 4 2 2 0 4-1.5 4.5-3.5.5-2 0-4-1-5.5 1-1 1.5-2.5 1.5-4 0-2-1-4-3-5s-4.5-.5-6 1.5z"/>
    <path d="M12 4.5v15M8 8c1 1 3 1 4 0M8 16c1-1 3-1 4 0M16 8c-1 1-3 1-4 0M16 16c-1-1-3-1-4 0"/>
  </svg>
);

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>
);

const VoiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 1v22M8 5v14M4 9v6M16 5v14M20 9v6"/>
  </svg>
);

const SwordIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M17 14l4-4-3-3-4 4"/>
    <path d="M9 12l-6 6 3 3 6-6"/>
  </svg>
);

const DiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent/30 rounded-full animate-pulse-slow"
              style={{
                left: `${seededRandom(i * 3 + 1) * 100}%`,
                top: `${seededRandom(i * 7 + 2) * 100}%`,
                animationDelay: `${seededRandom(i * 11 + 3) * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Icons */}
          <div className="flex justify-center gap-8 mb-8 text-accent/60">
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <DragonIcon />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <MindflayerIcon />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-accent">AI</span> Dungeon Master
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Experience solo D&D adventures like never before
          </p>
          <p className="text-lg text-muted/80 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Powered by <span className="text-accent font-semibold">Google Gemini 3</span>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link
              href="/create"
              className="px-8 py-4 bg-accent text-background font-bold text-lg rounded-lg hover:bg-accent-dim transition-all hover:scale-105 shadow-lg shadow-accent/20"
            >
              Begin Your Adventure
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-white/20 text-foreground font-semibold rounded-lg hover:bg-white/5 transition-all"
            >
              Learn More
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Powered by <span className="text-accent">Gemini 3</span>
          </h2>
          <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
            Experience the cutting edge of AI technology in a fantasy adventure. 
            Three powerful Gemini 3 models work together to create your unique story.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* DM Feature */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-accent/30 transition-all">
              <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <BrainIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Intelligent Dungeon Master</h3>
              <p className="text-muted mb-4">
                Gemini 3 Flash with deep thinking creates dynamic narratives, 
                remembers your choices, and adapts the story to your actions.
              </p>
              <div className="text-sm text-accent/60 font-mono">
                gemini-3-flash-preview
              </div>
            </div>

            {/* Image Feature */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-accent/30 transition-all">
              <div className="w-16 h-16 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <ImageIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Generated Artwork</h3>
              <p className="text-muted mb-4">
                See your character, NPCs, and scenes come to life with 
                real-time generated fantasy artwork as you play.
              </p>
              <div className="text-sm text-accent/60 font-mono">
                gemini-3-pro-image-preview
              </div>
            </div>

            {/* Voice Feature */}
            <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-accent/30 transition-all">
              <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform">
                <VoiceIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Voice Narration</h3>
              <p className="text-muted mb-4">
                Immerse yourself with AI-generated voice narration that 
                brings every scene and character to life.
              </p>
              <div className="text-sm text-accent/60 font-mono">
                gemini-2.5-flash-preview-tts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-accent">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Create Your Hero</h3>
              <p className="text-muted">
                Choose your race, class, and name. The AI generates a unique 
                backstory and portrait for your character.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Make Choices</h3>
              <p className="text-muted">
                Explore, interact with NPCs, and make decisions. Every choice 
                shapes your unique adventure.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Live the Adventure</h3>
              <p className="text-muted">
                Battle monsters, discover treasures, and write your legend. 
                Your story is saved automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Full D&D Experience
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <SwordIcon />, title: 'Combat System', desc: 'Turn-based battles with HP tracking' },
              { icon: <DiceIcon />, title: '6 Races & Classes', desc: 'From Elves to Dragonborn' },
              { icon: <BrainIcon />, title: 'Smart NPCs', desc: 'Characters that remember you' },
              { icon: <ImageIcon />, title: 'Visual Scenes', desc: 'AI art for every location' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 text-center hover:border-accent/30 transition-all">
                <div className="text-accent mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-r from-purple-900/20 via-accent/10 to-purple-900/20 border border-accent/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Begin?
            </h2>
            <p className="text-muted mb-8 max-w-xl mx-auto">
              Your adventure awaits. Create your character and step into a world 
              of endless possibilities.
            </p>
            <Link
              href="/create"
              className="inline-block px-10 py-4 bg-accent text-background font-bold text-lg rounded-lg hover:bg-accent-dim transition-all hover:scale-105 shadow-lg shadow-accent/20"
            >
              Create Your Character
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="text-accent">
              <DragonIcon />
            </div>
            <div>
              <div className="font-bold">AI Dungeon Master</div>
              <div className="text-sm text-muted">Built for Gemini 3 Hackathon</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-muted">
            <a 
              href="https://github.com/Angleito/gdnd" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
              </svg>
              GitHub
            </a>
            <span className="text-white/20">|</span>
            <span className="text-sm">
              Powered by <span className="text-accent">Google Gemini 3</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
