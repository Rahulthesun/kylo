import { useState, useEffect, useRef } from "react";
import { X, RotateCcw, SkipForward, Play, Pause } from "lucide-react";

const MINDSET_PHRASES = [
  "INITIATE FLOW STATE.",
  "ELIMINATE DISTRACTIONS.",
  "EXECUTE WITH PRECISION.",
  "LOCK IN. SHIP IT.",
];

interface FocusModeProps {
  activeTask: { title: string; estimated_minutes?: number } | null;
  onClose: () => void;
  onNextTask?: () => void;       // advances to next incomplete task
  secondsLeft: number;
  setSecondsLeft: (n: number | ((prev: number) => number)) => void;
  isRunning: boolean;
  setIsRunning: (v: boolean | ((prev: boolean) => boolean)) => void;
  session: number;
  setSession: (n: number | ((prev: number) => number)) => void;
  totalSessions: number;
}

export const FocusMode = ({
  activeTask,
  onClose,
  onNextTask,
  secondsLeft,
  setSecondsLeft,
  isRunning,
  setIsRunning,
  session,
  setSession,
  totalSessions,
}: FocusModeProps) => {
  const totalSeconds = (activeTask?.estimated_minutes ?? 25) * 60;
  const [mindsetIdx, setMindsetIdx] = useState(0);

  // Swipe up to close
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMindsetIdx((i) => (i + 1) % MINDSET_PHRASES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const handleReset = () => { setIsRunning(false); setSecondsLeft(totalSeconds); };

  const handleSkip = () => {
    setIsRunning(false);
    if (session < totalSessions) { setSession((s) => s + 1); setSecondsLeft(totalSeconds); }
    else onClose();
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const progress = Math.min(1 - secondsLeft / totalSeconds, 1);
  const taskTitle = (activeTask?.title ?? "DEEP FOCUS").toUpperCase().replace(/\s+/g, "_") + ".EXE";

  return (
    <>
      <style>{`
        @keyframes fm-blink { 0%,100%{opacity:1} 50%{opacity:0.1} }
        @keyframes fm-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div
        className="absolute inset-0 z-60 flex flex-col bg-[#0A0A0A] overflow-hidden"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.022) 39px,rgba(255,255,255,0.022) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.022) 39px,rgba(255,255,255,0.022) 40px)',
          animation: 'fm-in 0.22s ease both',
        }}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          if (touchStartY.current !== null && touchStartY.current - e.changedTouches[0].clientY > 80) onClose();
          touchStartY.current = null;
        }}
      >

        {/* ── TOP BAR ── */}
        <div className="flex items-stretch h-11 border-b border-white/[0.07] flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center px-4 border-r border-white/[0.07]">
            <span className="text-[14px] font-black tracking-[0.14em] text-[#EDEDED] uppercase">KYLO</span>
          </div>

          {/* Mindset ticker */}
          <div className="flex items-center flex-1 px-4 min-w-0">
            <span
              key={mindsetIdx}
              className="text-[9px] font-black tracking-[0.2em] uppercase text-[#C8F135]/60 truncate"
              style={{ animation: 'fm-in 0.3s ease both' }}
            >
              {MINDSET_PHRASES[mindsetIdx]}
            </span>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-full
                       border-l border-white/[0.07]
                       text-white/25 hover:text-[#EDEDED] hover:bg-white/[0.04]
                       transition-all duration-100 outline-none cursor-pointer"
            title="Close focus"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── TASK NAME ── */}
        <div className="flex items-center h-10 px-4 border-b border-white/[0.07] flex-shrink-0">
          <span className="w-[6px] h-[6px] bg-[#C8F135] flex-shrink-0 inline-block mr-3" />
          <span className="text-[11px] font-black tracking-[0.12em] text-[#EDEDED]/70 uppercase truncate">
            {taskTitle}
          </span>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="h-[2px] bg-[#C8F135]/10 flex-shrink-0">
          <div
            className="h-full bg-[#C8F135] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* ── TIMER (HERO) ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">

          {/* Time display */}
          <div className="flex items-center gap-3">
            {isRunning && (
              <span
                className="w-2 h-2 flex-shrink-0 inline-block"
                style={{ backgroundColor: '#C8F135', animation: 'fm-blink 1s ease-in-out infinite' }}
              />
            )}
            <span
              className="font-black text-[#EDEDED] tabular-nums leading-none"
              style={{ fontSize: 'clamp(64px, 18vw, 96px)', letterSpacing: '-0.03em' }}
            >
              {mins}:{secs}
            </span>
          </div>

          {/* Session pips */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSessions }).map((_, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  width: 8, height: 8,
                  backgroundColor: i < session ? '#C8F135' : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
            <span className="text-[9px] font-black tracking-[0.16em] text-white/20 uppercase ml-2">
              SESSION {String(session).padStart(2,'0')}/{String(totalSessions).padStart(2,'0')}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-12 h-12
                         border border-white/[0.07]
                         text-white/30 hover:text-[#EDEDED] hover:border-white/20
                         transition-all duration-100 outline-none cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
            </button>

            {/* Play / Pause — hero */}
            <button
              onClick={() => setIsRunning((r) => !r)}
              className="flex items-center justify-center w-20 h-14
                         bg-[#C8F135] text-[#0A0A0A]
                         hover:opacity-85 transition-opacity duration-100
                         outline-none cursor-pointer"
              title={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning
                ? <Pause size={18} strokeWidth={3} />
                : <Play  size={18} strokeWidth={3} />
              }
            </button>

            {/* Skip session */}
            <button
              onClick={handleSkip}
              className="flex items-center justify-center w-12 h-12
                         border border-white/[0.07]
                         text-white/30 hover:text-[#EDEDED] hover:border-white/20
                         transition-all duration-100 outline-none cursor-pointer"
              title="Skip session"
            >
              <SkipForward size={14} strokeWidth={2.5} />
            </button>

          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="flex items-stretch h-12 border-t border-white/[0.07] flex-shrink-0">

          {/* Swipe hint */}
          <div className="flex items-center px-4 border-r border-white/[0.07] flex-1">
            <span className="text-[9px] font-black tracking-[0.16em] text-white/15 uppercase">
              SWIPE UP TO CLOSE
            </span>
          </div>

          {/* Next task */}
          {onNextTask && (
            <button
              onClick={onNextTask}
              className="flex items-center gap-2 px-5 flex-shrink-0
                         border-l border-white/[0.07]
                         text-[10px] font-black tracking-[0.16em] uppercase
                         text-white/30 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                         transition-all duration-100 outline-none cursor-pointer"
            >
              NEXT TASK
              <SkipForward size={11} strokeWidth={2.5} />
            </button>
          )}

          {/* Done — close focus */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 flex-shrink-0
                       border-l border-white/[0.07]
                       bg-[#C8F135] text-[#0A0A0A]
                       text-[10px] font-black tracking-[0.16em] uppercase
                       hover:opacity-85 transition-opacity duration-100
                       outline-none cursor-pointer"
          >
            DONE
            <X size={11} strokeWidth={3} />
          </button>

        </div>
      </div>
    </>
  );
};

export default FocusMode;