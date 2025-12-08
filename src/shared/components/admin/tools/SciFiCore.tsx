import { useEffect, useState } from "react";
import { Music, Film, ImageIcon, Code, Mic, Cloud, Clapperboard } from "lucide-react";

interface SciFiCoreProps {
  onAnimationComplete: () => void;
  isActive: boolean;
}

const SciFiCore = ({ onAnimationComplete, isActive }: SciFiCoreProps) => {
  const [phase, setPhase] = useState(0);

  const particles = [
    { icon: Music, delay: 0, startX: -200, startY: -150 },
    { icon: Film, delay: 0.2, startX: 200, startY: -100 },
    { icon: ImageIcon, delay: 0.4, startX: -180, startY: 100 },
    { icon: Code, delay: 0.6, startX: 150, startY: 150 },
    { icon: Mic, delay: 0.8, startX: -100, startY: -200 },
    { icon: Cloud, delay: 1.0, startX: 180, startY: -180 },
    { icon: Clapperboard, delay: 1.2, startX: -150, startY: 180 },
  ];

  useEffect(() => {
    if (!isActive) return;

    // Phase 0: Globe spinning (immediate)
    setPhase(0);

    // Phase 1: Data extraction (1200ms)
    const timer1 = setTimeout(() => setPhase(1), 1200);

    // Phase 2: Convergence (4000ms)
    const timer2 = setTimeout(() => setPhase(2), 4000);

    // Phase 3: UI Reveal (5500ms)
    const timer3 = setTimeout(() => {
      setPhase(3);
      onAnimationComplete();
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isActive, onAnimationComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-radial from-slate-950 via-slate-900 to-black">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/20 rounded-full animate-glow-pulse" style={{ animationDelay: '-1s' }} />
      </div>

      {/* Scan lines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)]" />
      </div>

      {/* Main globe container */}
      <div className="perspective-container relative w-80 h-80">
        {/* Outer rotating rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Ring 1 - Slowest */}
          <div className="absolute w-72 h-72 border-2 border-dashed border-cyan-500/30 rounded-full animate-ring-slow" />
          
          {/* Ring 2 - Medium, reverse */}
          <div className="absolute w-56 h-56 border border-dashed border-primary/40 rounded-full animate-ring-medium" />
          
          {/* Ring 3 - Fastest */}
          <div className="absolute w-40 h-40 border border-dashed border-cyan-400/50 rounded-full animate-ring-fast" />
        </div>

        {/* Central globe */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 via-primary/20 to-slate-900 animate-globe-spin backdrop-blur-sm border border-cyan-500/20">
            {/* Globe surface details */}
            <div className="absolute inset-2 rounded-full border border-cyan-500/10" />
            <div className="absolute inset-4 rounded-full border border-primary/10" />
            <div className="absolute inset-6 rounded-full border border-cyan-400/10" />
          </div>
        </div>

        {/* Pulsing core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-primary to-cyan-600 animate-pulse-core" />
          <div className="absolute w-12 h-12 rounded-full bg-white/80" />
        </div>

        {/* Data flow lines (Phase 1+) */}
        {phase >= 1 && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-24 bg-gradient-to-t from-cyan-500 via-primary to-transparent animate-data-flow origin-bottom"
                style={{
                  transform: `rotate(${i * 45}deg)`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Particle implosion (Phase 2+) */}
        {phase >= 2 && (
          <div className="absolute inset-0">
            {particles.map((particle, index) => (
              <div
                key={index}
                className="absolute top-1/2 left-1/2 animate-implode"
                style={{
                  '--start-x': `${particle.startX}px`,
                  '--start-y': `${particle.startY}px`,
                  animationDelay: `${particle.delay}s`,
                } as React.CSSProperties}
              >
                <particle.icon className="w-8 h-8 text-cyan-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading text */}
      <div className={`absolute bottom-20 text-center transition-opacity duration-500 ${phase >= 3 ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-cyan-400/80 text-sm font-mono tracking-widest uppercase">
          {phase === 0 && "Initialisation du système..."}
          {phase === 1 && "Extraction des données..."}
          {phase === 2 && "Convergence en cours..."}
        </p>
        <div className="mt-4 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-primary to-cyan-400 transition-all duration-1000 ease-out"
            style={{ width: `${((phase + 1) / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SciFiCore;