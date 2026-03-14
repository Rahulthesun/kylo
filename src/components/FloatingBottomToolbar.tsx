import { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Music, VolumeX, Zap, Expand } from 'lucide-react';
import { FlowTrack } from '../hooks/usePersistentMusic';

interface FloatingBottomToolbarProps {
  onExpand: () => void;
  secondsLeft?: number | null;
  isRunning?: boolean;
  onTogglePlay?: () => void;
  onReset?: () => void;
  // Music — passed from parent's usePersistentMusic
  music: {
    isPlaying: boolean;
    musicEnabled: boolean;
    activeTrack: FlowTrack;
    syncWithSprint: (isRunning: boolean) => void;
    toggleEnabled: (isRunning: boolean) => void;
  };
}

export const FloatingBottomToolbar = ({
  onExpand,
  secondsLeft = null,
  isRunning = false,
  onTogglePlay,
  onReset,
  music,
}: FloatingBottomToolbarProps) => {

  const [completed, setCompleted] = useState(false);

  // Sync music whenever sprint running state changes
  useEffect(() => {
    music.syncWithSprint(isRunning);
  }, [isRunning]);

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && hasTimer === false && completed === false) return; // idle state, ignore
    if (secondsLeft === 0 && !completed) {
      music.syncWithSprint(false);
      setCompleted(true);
      // Bring up FocusMode so the done screen is shown
      onExpand();
    }
  }, [secondsLeft]);

  // Reset completed if a new sprint starts
  useEffect(() => {
    if (isRunning) setCompleted(false);
  }, [isRunning]);

  // ── Timer ──
  const W = 300, H = 120;
  const TOTAL = 25 * 60;
  const hasTimer    = (secondsLeft !== null && secondsLeft! > 0) || completed;
  const displaySecs = (secondsLeft !== null && secondsLeft! > 0) ? secondsLeft! : TOTAL;
  const mins = Math.floor(displaySecs / 60).toString().padStart(2, '0');
  const secs = (displaySecs % 60).toString().padStart(2, '0');
  const progress = hasTimer ? (TOTAL - displaySecs) / TOTAL : 0;

  // Square progress border
  const S = 1.5;
  const rw = W - S * 2, rh = H - S * 2;
  const PERIM = 2 * (rw + rh);
  const dashOffset = PERIM * (1 - progress);

  // Window drag
  const winDrag = useRef<{ sx: number; sy: number } | null>(null);
  const onWinDragDown = (e: React.MouseEvent) => {
    e.preventDefault();
    winDrag.current = { sx: e.screenX, sy: e.screenY };
  };
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      if (!winDrag.current) return;
      // window.electron?.ipcRenderer.send("move-window", dx, dy)
      winDrag.current = { sx: e.screenX, sy: e.screenY };
    };
    const up = () => { winDrag.current = null; };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, []);

  return (
    <>
      <style>{`
        @keyframes kb        { 0%,100%{opacity:1} 50%{opacity:0.08} }
        @keyframes done-glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .kb        { animation: kb 1.2s ease-in-out infinite; }
        .prog-ring { transition: stroke-dashoffset 1s linear; }
        .done-glow { animation: done-glow 2.4s ease-in-out infinite; }
      `}</style>

      <div
        className="fixed bottom-0.5 left-1/2 -translate-x-1/2 z-50 select-none"
        style={{ width: W, height: H }}
      >
        {/* SVG — background + square progress border */}
        <svg width={W} height={H} className="absolute inset-0" style={{ display: 'block' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0C0C0E" rx={8} />
          <rect x={S} y={S} width={rw} height={rh} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} rx={8} />
          <rect
            x={S} y={S} width={rw} height={rh}
            fill="none" stroke="#C8F135" strokeWidth={1.5}
            strokeDasharray={PERIM} strokeDashoffset={completed ? 0 : dashOffset}
            className="prog-ring"
            rx={8}
          />
        </svg>

        {/* UI layer */}
        <div className="absolute inset-0 flex flex-col" style={{ fontFamily: "'Barlow Condensed', Arial Black, sans-serif" }}>

          {/* ── TOP ROW h=30 ── */}
          <div className="flex items-center shrink-0" style={{ height: 30 }}>
            {/* Window drag */}
            <div onMouseDown={onWinDragDown}
              className="w-8 h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-white/25 hover:text-white/55 transition-colors shrink-0">
              <Zap size={11} strokeWidth={2} stroke='#C8F135' />
            </div>


            {/* KYLO centered */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[11px] font-black tracking-[0.24em] text-white/50 uppercase">KYLO</span>
            </div>

            {/* Running blink dot */}
            {isRunning && hasTimer && (
              <span className="kb w-[5px] h-[5px] rounded-full bg-[#C8F135] shrink-0 mr-1" />
            )}

            {/* Maximize */}
            <button onClick={onExpand}
              className="w-8 h-full flex items-center justify-center text-white/40 hover:text-[#C8F135] transition-colors cursor-pointer outline-none shrink-0">
              <Expand size={11} strokeWidth={2} stroke='#C8F135' />
            </button>
          </div>

          {/* ── TIMER ── */}
          <div className="flex items-center justify-center flex-1 gap-2">
            {completed && (
              <Zap size={13} strokeWidth={2.5} className="text-[#C8F135] done-glow shrink-0" />
            )}
            {isRunning && !completed && (
              <span className="kb w-[5px] h-[5px] rounded-full bg-[#C8F135] shrink-0" />
            )}
            <span
              className="font-black tabular-nums leading-none tracking-[-0.03em]"
              style={{ fontSize: 36, color: completed ? '#C8F135' : hasTimer ? '#EDEDED' : 'rgba(255,255,255,0.1)' }}
            >
              {completed ? '00:00' : `${mins}:${secs}`}
            </span>
          </div>

          {/* ── CONTROLS h=34 ── */}
          <div className="flex items-stretch shrink-0 border-t border-white/[0.07]" style={{ height: 34 }}>

            {/* Reset */}
            <button onClick={onReset} disabled={!hasTimer && !completed}
              className="flex-1 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all outline-none cursor-pointer border-r border-white/[0.07]">
              <RotateCcw size={13} strokeWidth={2} />
            </button>

            {/* Play / Pause — expands to full when completed */}
            <button
              onClick={completed ? onExpand : hasTimer ? onTogglePlay : onExpand}
              className="flex items-center justify-center gap-1.5 bg-[#C8F135] text-[#0C0C0E] hover:opacity-90 active:scale-[0.98] transition-all outline-none cursor-pointer shrink-0"
              style={{ width: completed ? 170 : 142 }}
            >
              {completed
                ? <><Zap size={12} strokeWidth={3} /><span className="text-[9px] font-black tracking-[0.16em] uppercase">Open</span></>
                : hasTimer && isRunning
                  ? <Pause size={14} strokeWidth={3} />
                  : <Play  size={14} strokeWidth={3} />
              }
            </button>

            {/* Music toggle */}
            <button
              onClick={() => music.toggleEnabled(isRunning)}
              title={music.musicEnabled ? 'Mute music' : 'Play music'}
              className={`flex-1 flex items-center justify-center transition-all outline-none cursor-pointer border-l border-white/[0.07]
                ${music.musicEnabled ? 'text-[#C8F135]' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}
            >
              {music.musicEnabled
                ? <Music   size={13} strokeWidth={2} />
                : <VolumeX size={13} strokeWidth={2} />
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingBottomToolbar;