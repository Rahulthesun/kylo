import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingBottomToolbarProps {
  onExpand: () => void;
}

export const FloatingBottomToolbar = ({ onExpand }: FloatingBottomToolbarProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(1);

  const TOTAL_SESSIONS = 4;
  const TOTAL = 25 * 60;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setSession((s) => Math.min(s + 1, TOTAL_SESSIONS));
          return TOTAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = () => { setIsRunning(false); setTimeLeft(TOTAL); };
  const skip  = () => { setIsRunning(false); setTimeLeft(TOTAL); setSession((s) => Math.min(s + 1, TOTAL_SESSIONS)); };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const progress = ((TOTAL - timeLeft) / TOTAL) * 100;

  return (
    <>
      <style>{`@keyframes kb{0%,100%{opacity:1}50%{opacity:0.1}}`}</style>

      {/* Fixed 300×120 container, centered bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
           style={{ width: 300, height: 120 }}>

        <div className="relative w-full h-full bg-[#0A0A0A] border-t-2 border-[#C8F135] border-l border-r border-b border-white/[0.07] flex flex-col overflow-hidden">

          {/* Corner accents */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-[#C8F135] pointer-events-none" style={{ top: 2 }} />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-[#C8F135] pointer-events-none" style={{ top: 2 }} />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-[1.5px] border-l-[1.5px] border-[#C8F135] pointer-events-none" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-[#C8F135] pointer-events-none" />

          {/* ── Progress bar ── */}
          <div className="h-[2px] w-full bg-[#C8F135]/10 flex-shrink-0">
            <div
              className="h-full bg-[#C8F135] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* ── Row 1: KYLO + session pips ── */}
          <div className="flex items-center justify-center space-x-4 px-4 pt-3 pb-1 flex-shrink-0">
            <button
              onClick={onExpand}
              className="flex items-center gap-[6px]
                         text-[10px] font-black tracking-[0.2em] uppercase leading-none
                         text-[#EDEDED] hover:text-[#C8F135]
                         transition-colors duration-100 outline-none cursor-pointer bg-transparent border-none"
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
                <rect x="0" y="0" width="5" height="5" />
                <rect x="7" y="0" width="5" height="5" />
                <rect x="0" y="7" width="5" height="5" />
                <rect x="7" y="7" width="5" height="5" />
              </svg>
              KYLO
            </button>

            {/* Session pips */}
            <div className="flex items-center gap-[4px] absolute right-4">
              {Array.from({ length: TOTAL_SESSIONS }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    width: 5, height: 5,
                    backgroundColor: i < session ? '#C8F135' : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Row 2: Timer hero ── */}
          <div className="flex items-center justify-center gap-2 flex-1">
            {isRunning && (
              <span
                className="inline-block flex-shrink-0"
                style={{ width: 6, height: 6, backgroundColor: '#C8F135', animation: 'kb 1s ease-in-out infinite' }}
              />
            )}
            <span className="text-[40px] font-black tracking-[-0.03em] text-[#EDEDED] tabular-nums leading-none">
              {mins}:{secs}
            </span>
          </div>

          {/* ── Row 3: Controls ── */}
          <div className="flex items-stretch border-t border-white/[0.07] flex-shrink-0" style={{ height: 36 }}>

            {/* Reset */}
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center
                         border-r border-white/[0.07]
                         text-white/20 hover:text-white/50 hover:bg-white/[0.03]
                         transition-all duration-100 outline-none cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={12} strokeWidth={2.5} />
            </button>

            {/* Play / Pause — acid accent */}
            <button
              onClick={() => setIsRunning((r) => !r)}
              className="flex items-center justify-center
                         bg-[#C8F135] text-[#0A0A0A]
                         hover:opacity-85 transition-opacity duration-100
                         outline-none cursor-pointer border-r border-black/20"
              style={{ width: 120 }}
              title={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning
                ? <Pause size={14} strokeWidth={3} />
                : <Play  size={14} strokeWidth={3} />
              }
            </button>

            {/* Skip */}
            <button
              onClick={skip}
              className="flex-1 flex items-center justify-center
                         text-white/20 hover:text-white/50 hover:bg-white/[0.03]
                         transition-all duration-100 outline-none cursor-pointer"
              title="Skip"
            >
              <SkipForward size={12} strokeWidth={2.5} />
            </button>

          </div>
        </div>
      </div>
    </>
  );
};