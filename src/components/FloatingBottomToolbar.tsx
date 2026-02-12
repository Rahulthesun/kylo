import {
  Clock,
  ChevronUp,
  CheckSquare,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingBottomToolbarProps {
  onExpand: () => void;
}

export const FloatingBottomToolbar = ({ onExpand }: FloatingBottomToolbarProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const activeProject = 'Product Launch';
  const pendingToday = 7;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec
      .toString()
      .padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    console.log('AI query:', aiInput);
    setAiInput('');
  };

  return (
    <div className="fixed w-full z-50">
      <div className="w-full h-full bg-[#0B0D10]/95 border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden">

        {/* Progress */}
        <div className="h-[2px] bg-white/[0.04]">
          <div
            className="h-full bg-white/30 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-3 py-2 flex flex-col gap-2">

          {/* Row 1 — TIMER (HERO) */}
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-white/40 tracking-widest">
              KYLO
            </span>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center"
            >
              {isRunning ? (
                <Pause className="w-3.5 h-3.5 text-white/70" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white/70 ml-0.5" />
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-lg font-semibold text-white tabular-nums">
                {formatTime(timeLeft)}
              </span>
            </div>

            <div className="flex-1" />

            <button
              onClick={onExpand}
              className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center"
            >
              <ChevronUp className="w-4 h-4 text-white/50" />
            </button>
          </div>

          {/* Row 2 — CONTEXT */}
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="truncate flex-1">
              {activeProject}
            </span>

            <div className="flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{pendingToday}</span>
            </div>
          </div>

          {/* Row 3 — AI QUERY (COMPACT) */}
          <form onSubmit={handleAISubmit}>
            <div className="relative">
              <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask Kylo…"
                className="
                  w-full h-7
                  pl-8 pr-2
                  bg-white/[0.04]
                  border border-white/[0.06]
                  rounded-md
                  text-xs text-white/80
                  placeholder:text-white/30
                  outline-none
                  focus:bg-white/[0.08]
                  focus:border-white/[0.12]
                  transition
                "
              />
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};