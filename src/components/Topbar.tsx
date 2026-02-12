import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

type TimerMode = 'pomodoro' | 'daily' | 'project';
type FocusPhase = 'focus' | 'shortBreak' | 'longBreak';

const FOCUS_DURATIONS: Record<FocusPhase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const TopBar = () => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [focusPhase, setFocusPhase] = useState<FocusPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const timerRef = useRef<HTMLDivElement>(null);

  // Calculate day end timer (6 PM)
  const getDayEndSeconds = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(18, 0, 0, 0);
    
    if (now > endOfDay) {
      endOfDay.setDate(endOfDay.getDate() + 1);
    }
    
    return Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
  };

  // Auto-update for daily timer
  useEffect(() => {
    if (mode === 'daily') {
      const interval = setInterval(() => {
        setTimeLeft(getDayEndSeconds());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Main timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mode === 'pomodoro') {
            advanceFocusPhase();
          } else {
            setIsRunning(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, focusPhase]);

  const advanceFocusPhase = () => {
    setIsRunning(false);

    if (focusPhase === 'focus') {
      const nextPhase = cycle % 4 === 0 ? 'longBreak' : 'shortBreak';
      setFocusPhase(nextPhase);
      setTimeLeft(FOCUS_DURATIONS[nextPhase]);
    } else {
      setFocusPhase('focus');
      setTimeLeft(FOCUS_DURATIONS.focus);
      setCycle((c) => c + 1);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);

    if (newMode === 'pomodoro') {
      setFocusPhase('focus');
      setTimeLeft(FOCUS_DURATIONS.focus);
    } else if (newMode === 'daily') {
      setTimeLeft(getDayEndSeconds());
    } else if (newMode === 'project') {
      setTimeLeft(2 * 60 * 60); // 2 hours
    }
  };

  const toggle = () => {
    if (mode === 'daily') return;
    setIsRunning((v) => !v);
  };

  const reset = () => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      setTimeLeft(FOCUS_DURATIONS[focusPhase]);
    } else if (mode === 'project') {
      setTimeLeft(2 * 60 * 60);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      if (mode === 'pomodoro') switchMode('daily');
      else if (mode === 'daily') switchMode('project');
    }

    if (isRightSwipe) {
      if (mode === 'project') switchMode('daily');
      else if (mode === 'daily') switchMode('pomodoro');
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const progress =
    mode === 'pomodoro'
      ? 1 - timeLeft / FOCUS_DURATIONS[focusPhase]
      : mode === 'project'
      ? 1 - timeLeft / (2 * 60 * 60)
      : 0;

  const getPhaseLabel = () => {
    if (mode !== 'pomodoro') return '';
    if (focusPhase === 'focus') return 'Focus';
    if (focusPhase === 'shortBreak') return 'Short Break';
    return 'Long Break';
  };

  return (
    <div className="px-6 py-4 border-b border-white/5 bg-[#0B0D10]">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[13px] font-semibold text-white/40 tracking-widest">
          KYLO
        </h1>

        {mode === 'pomodoro' && (
          <span className="text-[10px] text-white/30 font-medium tabular-nums">
            CYCLE {cycle}
          </span>
        )}
      </div>

      {/* Centered Content */}
      <div 
        ref={timerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex flex-col items-center touch-none select-none"
      >
        {/* Compact Mode Slider */}
        <div className="flex items-center gap-1 bg-white/5 rounded-full p-0.5 mb-5 backdrop-blur-xl border border-white/10">
          {[
            { key: 'pomodoro' as TimerMode, label: 'Pomodoro' },
            { key: 'daily' as TimerMode, label: 'Daily' },
            { key: 'project' as TimerMode, label: 'Project' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchMode(tab.key)}
              className={`
                px-4 py-1.5 rounded-full text-[11px] font-medium transition-all
                ${mode === tab.key
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/50 hover:text-white/70'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compact Timer Icon */}
        <div className="relative mb-4">
          {/* Subtle glow */}
          <div 
            className="absolute inset-0 rounded-3xl blur-2xl opacity-20"
            style={{
              background: mode === 'pomodoro' 
                ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' 
                : mode === 'daily'
                ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                : 'linear-gradient(135deg, #06B6D4, #3B82F6)',
            }}
          />

          {/* Timer Container - Smaller Size */}
          <div 
            className="relative w-[160px] h-[160px] rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95), rgba(20, 20, 25, 0.98))',
              boxShadow: `
                0 10px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
            }}
          >
            {/* Progress overlay */}
            <div 
              className="absolute inset-0 transition-all duration-1000 ease-linear"
              style={{
                background: mode === 'pomodoro' 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))' 
                  : mode === 'daily'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.15))'
                  : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.15))',
                opacity: progress,
              }}
            />

            {/* Minimal tick marks */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-2 left-1/2 w-[1px] origin-top"
                  style={{
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: `rotate(${i * 30}deg)`,
                  }}
                />
              ))}
            </div>

            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-[36px] font-light text-white tabular-nums tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {hours > 0 && `${hours}:`}
                {String(minutes).padStart(2, '0')}
                <span className="opacity-50">:</span>
                {String(seconds).padStart(2, '0')}
              </div>

              {/* Phase Label */}
              {mode === 'pomodoro' && (
                <div className="text-[10px] text-white/40 font-medium mt-1 tracking-wide">
                  {getPhaseLabel()}
                </div>
              )}
            </div>

            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="75"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="2"
                fill="none"
              />
              {mode !== 'daily' && (
                <circle
                  cx="80"
                  cy="80"
                  r="75"
                  stroke="url(#gradient)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - progress)}`}
                  className="transition-all duration-1000 ease-linear"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
                  }}
                />
              )}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={
                    mode === 'pomodoro' ? '#8B5CF6' : mode === 'daily' ? '#F59E0B' : '#06B6D4'
                  } />
                  <stop offset="100%" stopColor={
                    mode === 'pomodoro' ? '#6366F1' : mode === 'daily' ? '#EF4444' : '#3B82F6'
                  } />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Compact Controls */}
        <div className="flex items-center gap-2 mt-4">
          {mode !== 'daily' && (
            <>
              <button
                onClick={toggle}
                className="
                  w-11 h-11 rounded-full
                  bg-white/10 backdrop-blur-xl
                  border border-white/20
                  flex items-center justify-center
                  hover:bg-white/15 hover:scale-105
                  active:scale-95
                  transition-all
                "
              >
                {isRunning ? (
                  <Pause className="w-4 h-4 text-white" fill="white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                )}
              </button>

              <button
                onClick={reset}
                className="
                  w-11 h-11 rounded-full
                  bg-white/5 backdrop-blur-xl
                  border border-white/10
                  flex items-center justify-center
                  hover:bg-white/10 hover:scale-105
                  active:scale-95
                  transition-all
                "
              >
                <RotateCcw className="w-3.5 h-3.5 text-white/60" />
              </button>

              {mode === 'pomodoro' && (
                <button
                  onClick={advanceFocusPhase}
                  className="
                    px-3 h-11 rounded-full
                    bg-white/5 backdrop-blur-xl
                    border border-white/10
                    flex items-center justify-center
                    hover:bg-white/10 hover:scale-105
                    active:scale-95
                    transition-all
                    text-xs text-white/60 font-medium
                  "
                >
                  Skip →
                </button>
              )}
            </>
          )}

          {mode === 'daily' && (
            <div className="text-[10px] text-white/40 font-medium">
              Auto-updating
            </div>
          )}
        </div>
      </div>
    </div>
  );
};