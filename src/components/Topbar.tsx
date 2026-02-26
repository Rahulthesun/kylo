import { useState, useEffect} from 'react';

type TimerMode = 'pomodoro' | 'daily' | 'project';
type FocusPhase = 'focus' | 'shortBreak' | 'longBreak';

const FOCUS_DURATIONS: Record<FocusPhase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODES: { id: TimerMode; label: string }[] = [
  { id: 'pomodoro', label: 'POMODORO' },
  { id: 'daily',    label: 'DAILY'    },
  { id: 'project',  label: 'PROJECT'  },
];

export const TopBar = () => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [focusPhase, setFocusPhase] = useState<FocusPhase>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const getDayEndSeconds = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(18, 0, 0, 0);
    if (now > endOfDay) endOfDay.setDate(endOfDay.getDate() + 1);
    return Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
  };

  useEffect(() => {
    if (mode === 'daily') {
      setTimeLeft(getDayEndSeconds());
      const interval = setInterval(() => setTimeLeft(getDayEndSeconds()), 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mode === 'pomodoro') advanceFocusPhase();
          else setIsRunning(false);
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
      const next: FocusPhase = cycle % 4 === 0 ? 'longBreak' : 'shortBreak';
      setFocusPhase(next);
      setTimeLeft(FOCUS_DURATIONS[next]);
    } else {
      setFocusPhase('focus');
      setTimeLeft(FOCUS_DURATIONS.focus);
      setCycle((c) => c + 1);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'pomodoro') { setFocusPhase('focus'); setTimeLeft(FOCUS_DURATIONS.focus); }
    else if (newMode === 'daily') setTimeLeft(getDayEndSeconds());
    else if (newMode === 'project') setTimeLeft(2 * 60 * 60);
  };

  const toggle = () => { if (mode !== 'daily') setIsRunning((v) => !v); };

  const reset = () => {
    setIsRunning(false);
    if (mode === 'pomodoro') setTimeLeft(FOCUS_DURATIONS[focusPhase]);
    else if (mode === 'project') setTimeLeft(2 * 60 * 60);
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove  = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd   = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (dist > 50)  { if (mode === 'pomodoro') switchMode('daily'); else if (mode === 'daily') switchMode('project'); }
    if (dist < -50) { if (mode === 'project') switchMode('daily'); else if (mode === 'daily') switchMode('pomodoro'); }
    setTouchStart(0); setTouchEnd(0);
  };

  const hours   = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const totalDuration =
    mode === 'pomodoro' ? FOCUS_DURATIONS[focusPhase] :
    mode === 'project'  ? 2 * 60 * 60 : 1;

  const progress = mode === 'daily' ? 0 : 1 - timeLeft / totalDuration;

  const phaseLabel =
    mode !== 'pomodoro' ? '' :
    focusPhase === 'focus' ? 'FOCUS' :
    focusPhase === 'shortBreak' ? 'SHORT BREAK' : 'LONG BREAK';

  const timeString = hours > 0
    ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
    : `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;

  return (
    <div
      className="flex-shrink-0 bg-[#0A0A0A] border-b border-white/[0.07] pt-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Mode tabs ── */}
      <div className="flex items-stretch border-b border-white/[0.07]">
        {MODES.map(({ id, label }) => {
          const isActive = mode === id;
          return (
            <button
              key={id}
              onClick={() => switchMode(id)}
              style={{ borderBottomColor: isActive ? '#C8F135' : 'transparent' }}
              className={[
                'flex-1 py-2.5 text-[10px] font-black tracking-[0.18em] uppercase',
                'border-b-2 border-r border-white/[0.07] last:border-r-0',
                'transition-all duration-100 outline-none cursor-pointer',
                isActive
                  ? 'text-[#C8F135] bg-[#C8F135]/10'
                  : 'text-white/30 bg-transparent hover:text-white/60 hover:bg-white/[0.03]',
              ].join(' ')}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Timer card ── */}
      <div className="px-4 pt-4 pb-3">

        {/* Phase label + cycle */}
        <div className="flex items-center justify-between mb-3 h-4">
          {phaseLabel ? (
            <span className="text-[9px] font-black tracking-[0.22em] text-[#C8F135]/60 uppercase">
              {phaseLabel}
            </span>
          ) : <span />}

          {mode === 'pomodoro' && (
            <span className="text-[9px] font-black tracking-[0.18em] text-white/25 uppercase tabular-nums">
              CYCLE&nbsp;{String(cycle).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-[#C8F135]/15 mb-3 w-full">
          <div
            className="h-full bg-[#C8F135] transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Timer display — hard border box */}
        <div className="border border-[#C8F135]/40 bg-[#111316] px-4 py-4 mb-4 relative">
          {/* Corner ticks */}
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#C8F135]" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#C8F135]" />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#C8F135]" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#C8F135]" />

          <div className="text-center text-[52px] font-black tracking-[-0.02em] text-[#EDEDED] tabular-nums leading-none">
            {timeString}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">

          {/* Reset */}
          <button
            onClick={reset}
            disabled={mode === 'daily'}
            className="w-11 h-11 flex items-center justify-center
                       border border-white/[0.07] bg-transparent
                       text-white/40 hover:text-[#EDEDED] hover:border-white/20
                       disabled:opacity-20 disabled:cursor-not-allowed
                       transition-all duration-100 outline-none cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Play / Pause — acid filled */}
          <button
            onClick={toggle}
            disabled={mode === 'daily'}
            className="w-14 h-14 flex items-center justify-center
                       bg-[#C8F135] text-[#0A0A0A]
                       border border-[#C8F135]
                       hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed
                       transition-opacity duration-100 outline-none cursor-pointer"
          >
            {isRunning ? (
              /* Pause icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              /* Play icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Skip — only pomodoro */}
          <button
            onClick={advanceFocusPhase}
            disabled={mode !== 'pomodoro'}
            className="w-11 h-11 flex items-center justify-center
                       border border-white/[0.07] bg-transparent
                       text-white/40 hover:text-[#EDEDED] hover:border-white/20
                       disabled:opacity-20 disabled:cursor-not-allowed
                       transition-all duration-100 outline-none cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13,19 22,12 13,5" />
              <line x1="2" y1="19" x2="2" y2="5" stroke="currentColor" strokeWidth="2.5" />
              <polygon points="3,19 12,12 3,5" />
            </svg>
          </button>
        </div>

        {/* Daily mode label */}
        {mode === 'daily' && (
          <p className="text-center text-[9px] font-bold tracking-[0.18em] text-white/20 uppercase mt-3">
            UNTIL 18:00
          </p>
        )}
      </div>
    </div>
  );
};