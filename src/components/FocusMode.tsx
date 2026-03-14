import { useState, useEffect, useRef } from "react";
import { X, RotateCcw, Play, Pause, Music, VolumeX, ChevronDown, CheckCircle2, Circle, SkipForward, Minus, Check, Zap } from "lucide-react";
import { FlowTrack } from "../hooks/usePersistentMusic";
import { useSFX } from "../hooks/useSFX";

const MINDSET_PHRASES = [
  "INITIATE FLOW STATE.",
  "ELIMINATE DISTRACTIONS.",
  "EXECUTE WITH PRECISION.",
  "LOCK IN. SHIP IT.",
  "ZERO CONTEXT SWITCHING.",
  "BUILD. DON'T BROWSE.",
];

const CONGRATS = [
  "LOCKED IN.",
  "SHIPPED.",
  "EXECUTED.",
  "DIALED IN.",
  "CLEAN SPRINT.",
];

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface FocusModeProps {
  activeTask: {
    id?: string | null;
    title: string;
    estimated_minutes?: number;
    subtasks?: Subtask[];
    deadline?: string | null;
    important?: boolean;
  } | null;
  onClose: () => void;
  onMinimize: () => void;
  onDone?: () => void;
  onNextTask?: () => void;
  onToggleSubtaskDone?: (subtaskId: string, currentDone: boolean) => void;
  onToggleTaskDone?: () => void;
  secondsLeft: number;
  setSecondsLeft: (n: number | ((prev: number) => number)) => void;
  isRunning: boolean;
  setIsRunning: (v: boolean | ((prev: boolean) => boolean)) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  music: {
    isPlaying: boolean;
    musicEnabled: boolean;
    activeTrack: FlowTrack;
    tracks: FlowTrack[];
    syncWithSprint: (isRunning: boolean) => void;
    toggleEnabled: (isRunning: boolean) => void;
    selectTrack: (id: string, isRunning: boolean) => void;
  };
}

export const FocusMode = ({
  activeTask,
  onClose,
  onMinimize,
  onDone,
  onNextTask,
  onToggleSubtaskDone,
  onToggleTaskDone,
  secondsLeft,
  isRunning,
  onTogglePlay,
  onReset,
  music,
}: FocusModeProps) => {
  const totalSeconds = (activeTask?.estimated_minutes ?? 25) * 60;
  const [mindsetIdx, setMindsetIdx]   = useState(0);
  const [showPicker, setShowPicker]   = useState(false);
  const [completed, setCompleted]     = useState(false);
  const [showMusicHint, setShowMusicHint] = useState(false);
  const musicHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const congratsMsg = useRef(CONGRATS[Math.floor(Math.random() * CONGRATS.length)]);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const sfx = useSFX();

  useEffect(() => {
    const id = setInterval(() => setMindsetIdx((i) => (i + 1) % MINDSET_PHRASES.length), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    music.syncWithSprint(isRunning);
  }, [isRunning]);

  // Auto-trigger completion screen when timer hits 0 (or is already 0 on mount)
  useEffect(() => {
    if (secondsLeft === 0 && totalSeconds > 0 && !completed) {
      music.syncWithSprint(false);
      setCompleted(true);
    }
  }, [secondsLeft]);

  // Also check on mount in case we expanded into an already-finished sprint
  useEffect(() => {
    if (secondsLeft === 0 && totalSeconds > 0) {
      music.syncWithSprint(false);
      setCompleted(true);
    }
  }, []);

  const handleDone = () => {
    music.syncWithSprint(false);
    subtasks.forEach(st => { if (!st.done) onToggleSubtaskDone?.(st.id, false); });
    onToggleTaskDone?.();
    onDone ? onDone() : onClose();
  };

  const subtasks  = activeTask?.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const progress  = Math.min(1 - secondsLeft / Math.max(totalSeconds, 1), 1);
  const mins      = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs      = String(secondsLeft % 60).padStart(2, "0");

  const deadlineLabel = (() => {
    if (!activeTask?.deadline) return null;
    const diff = Math.ceil((new Date(activeTask.deadline).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: "Overdue", urgent: true };
    if (diff === 0) return { text: "Due today", urgent: true };
    if (diff === 1) return { text: "Due tomorrow", urgent: false };
    return { text: `Due in ${diff}d`, urgent: false };
  })();

  const TW = 200, TH = 96;
  const S  = 1.5;
  const rw = TW - S * 2, rh = TH - S * 2;
  const PERIM = 2 * (rw + rh);
  const sqDashOffset = PERIM * (1 - progress);

  return (
    <>
      <style>{`
        @keyframes fm-blink  { 0%,100%{opacity:1} 50%{opacity:0.08} }
        @keyframes fm-in     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes st-in     { from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
        @keyframes done-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes done-glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        .fm-in      { animation: fm-in 0.22s cubic-bezier(0.22,1,0.36,1) both; }
        .st-in      { animation: st-in 0.18s ease both; }
        .blink      { animation: fm-blink 1s ease-in-out infinite; }
        .mindset-in { animation: fm-in 0.3s ease both; }
        .sq-prog    { transition: stroke-dashoffset 1s linear; }
        .done-up    { animation: done-up 0.38s cubic-bezier(0.16,1,0.3,1) both; }
        .done-glow  { animation: done-glow 2.4s ease-in-out infinite; }
      `}</style>

      <div
        className="fm-in absolute inset-0 flex flex-col bg-[#0A0A0A] overflow-hidden"
        style={{
          fontFamily: "'Barlow Condensed', Arial Black, sans-serif",
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.016) 39px,rgba(255,255,255,0.016) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.016) 39px,rgba(255,255,255,0.016) 40px)",
        }}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return;
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          const dx = Math.abs(e.changedTouches[0].clientX - (touchStartX.current ?? 0));
          if (dy > 60 && dx < 60) onMinimize();
          touchStartY.current = null;
        }}
      >

        {/* ── TOP BAR ── */}
        <div className="flex items-stretch border-b border-white/[0.07] shrink-0 mt-6" style={{ height: 40 }}>
          <div className="flex items-center px-4 border-r border-white/[0.07]">
            <span className="text-[13px] font-black tracking-[0.14em] text-white/70 uppercase">KYLO</span>
          </div>
          <div className="flex items-center flex-1 px-4 min-w-0 overflow-hidden">
            <span key={mindsetIdx} className="mindset-in text-[9px] font-extrabold tracking-[0.2em] uppercase text-white/25 truncate">
              {MINDSET_PHRASES[mindsetIdx]}
            </span>
          </div>
          <button onClick={onClose} title="End session"
            className="flex items-center justify-center w-10 h-full border-l border-white/[0.07] text-white/25 hover:text-white/60 transition-colors outline-none cursor-pointer">
            <X size={12} strokeWidth={2} />
          </button>
        </div>

        {/* ── TASK TITLE ── */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-start gap-2 mb-1">
            {activeTask?.important && <span className="mt-[4px] w-[4px] h-[4px] shrink-0 bg-red-400" />}
            <h2 className="text-[13px] font-black tracking-[0.05em] text-white/80 uppercase leading-tight">
              {activeTask?.title ?? "DEEP FOCUS"}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-[0.16em] text-white/25 uppercase">
              {activeTask?.estimated_minutes ?? 25}min
            </span>
            {deadlineLabel && (
              <>
                <span className="text-white/10">·</span>
                <span className={`text-[9px] font-bold tracking-[0.14em] uppercase ${deadlineLabel.urgent ? "text-red-400/70" : "text-amber-400/50"}`}>
                  {deadlineLabel.text}
                </span>
              </>
            )}
            {subtasks.length > 0 && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-[9px] font-bold tracking-[0.14em] text-white/20 uppercase">
                  {doneCount}/{subtasks.length} subtasks
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── TIMER ── */}
        <div className="shrink-0 flex items-center justify-center py-4">
          <div className="relative" style={{ width: TW, height: TH }}>
            <svg width={TW} height={TH} className="absolute inset-0" style={{ display: "block" }}>
              <rect rx={8} x={S} y={S} width={rw} height={rh} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} />
              <rect rx={8} x={S} y={S} width={rw} height={rh} fill="none" stroke={completed ? "#C8F135" : "#C8F135"}
                strokeWidth={1.5} strokeDasharray={PERIM} strokeDashoffset={completed ? 0 : sqDashOffset} className="sq-prog" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                {isRunning && !completed && <span className="blink w-[5px] h-[5px] shrink-0 bg-[#C8F135]" />}
                {completed && <Zap size={14} className="text-[#C8F135] done-glow shrink-0" strokeWidth={2.5} />}
                <span className="font-black text-[#EDEDED] tabular-nums leading-none"
                  style={{ fontSize: 38, letterSpacing: "-0.03em" }}>
                  {completed ? "00:00" : `${mins}:${secs}`}
                </span>
              </div>
              <span className="text-[8px] font-bold tracking-[0.18em] text-white/20 uppercase">
                {completed ? "DONE" : isRunning ? "running" : "paused"}
              </span>
            </div>
          </div>
        </div>

        {/* ── CONTROLS ── */}
        <div className="flex items-stretch border-t border-b border-white/[0.07] shrink-0" style={{ height: 48 }}>
          <button onClick={onReset}
            className="flex items-center justify-center border-r border-white/[0.07] text-white/25 hover:text-white/60 hover:bg-white/[0.03] transition-all outline-none cursor-pointer"
            style={{ width: 48 }} title="Reset">
            <RotateCcw size={13} strokeWidth={2} />
          </button>

          <button onClick={completed ? handleDone : onTogglePlay}
            className="flex-1 flex items-center justify-center bg-[#C8F135] text-[#0A0A0A] hover:opacity-90 transition-opacity outline-none cursor-pointer">
            {completed
              ? <><Check size={14} strokeWidth={3} /><span className="text-[10px] font-black tracking-[0.16em] uppercase ml-2">Complete</span></>
              : isRunning ? <Pause size={15} strokeWidth={3} /> : <Play size={15} strokeWidth={3} />
            }
          </button>

          <button onClick={() => {
              music.toggleEnabled(isRunning);
              // Show hint on every toggle (disappears after 2.5s)
              setShowMusicHint(true);
              if (musicHintTimer.current) clearTimeout(musicHintTimer.current);
              musicHintTimer.current = setTimeout(() => setShowMusicHint(false), 2500);
            }}
            onContextMenu={e => { e.preventDefault(); setShowPicker(v => !v); }}
            onDoubleClick={() => setShowPicker(v => !v)}
            className="relative flex items-center justify-center border-l border-white/[0.07] transition-all outline-none cursor-pointer"
            style={{ width: 48 }}
            title={music.musicEnabled ? "Mute · right-click to pick track" : "Unmute · right-click to pick track"}>
            {music.musicEnabled
              ? <Music   size={13} strokeWidth={2} className="text-[#C8F135]" />
              : <VolumeX size={13} strokeWidth={2} className="text-white/25" />
            }
            {/* Hint tooltip */}
            {showMusicHint && (
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[8px] font-bold tracking-[0.1em] uppercase text-white/60 bg-[#1A1A1A] border border-white/[0.08] whitespace-nowrap pointer-events-none"
                style={{ animation: 'fm-in 0.18s ease both' }}
              >
                Right-click to choose track
              </span>
            )}
          </button>

          <button onClick={onMinimize}
            className="flex items-center justify-center border-l border-white/[0.07] text-white/25 hover:text-[#C8F135] hover:bg-white/[0.03] transition-all outline-none cursor-pointer"
            style={{ width: 48 }} title="Minimize">
            <ChevronDown size={13} strokeWidth={2} />
          </button>
        </div>

        {/* ── TRACK PICKER ── */}
        {showPicker && (
          <div className="shrink-0 border-b border-white/[0.07] bg-[#0A0A0A]">
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <span className="text-[9px] font-black tracking-[0.22em] uppercase text-white/25">Flow Music</span>
              <button onClick={() => setShowPicker(false)} className="text-white/20 hover:text-white/50 transition-colors cursor-pointer outline-none">
                <X size={11} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-col pb-2">
              {music.tracks.map(track => {
                const isActive = track.id === music.activeTrack.id;
                return (
                  <button key={track.id}
                    onClick={() => { music.selectTrack(track.id, isRunning); if (!music.musicEnabled) music.toggleEnabled(isRunning); }}
                    className={`flex items-center gap-3 px-5 py-2.5 text-left transition-colors cursor-pointer ${isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                    <span className="w-4 shrink-0 flex items-center justify-center">
                      {isActive && music.musicEnabled && music.isPlaying
                        ? <span className="flex gap-[2px] items-end h-3">
                            {[1,2,3].map(i => (
                              <span key={i} className="w-[2px] bg-[#C8F135] rounded-full"
                                style={{ height: `${[8,12,6][i-1]}px`, animation: `fm-blink ${[0.8,1.1,0.9][i-1]}s ease-in-out infinite` }} />
                            ))}
                          </span>
                        : isActive
                          ? <span className="w-1.5 h-1.5 rounded-full bg-[#C8F135]/50" />
                          : <span className="w-1.5 h-1.5 rounded-full bg-white/[0.1]" />
                      }
                    </span>
                    <span className={`text-[11px] font-black tracking-[0.1em] uppercase transition-colors ${isActive ? 'text-[#C8F135]' : 'text-white/40 hover:text-white/70'}`}>
                      {track.label}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-[8px] font-black tracking-[0.14em] uppercase text-[#C8F135]/40">
                        {music.musicEnabled ? (music.isPlaying ? 'Playing' : 'Paused') : 'Muted'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            COMPLETION SCREEN — replaces subtasks on done
        ══════════════════════════════════════════════ */}
        {completed ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 done-up">
            {/* Big lime check */}
            <div className="w-14 h-14 rounded-full border-2 border-[#C8F135]/30 flex items-center justify-center mb-5">
              <Check size={26} strokeWidth={2.5} className="text-[#C8F135]" />
            </div>

            {/* Congrats headline */}
            <p className="text-[22px] font-black tracking-[0.08em] uppercase text-[#EDEDED] mb-1">
              {congratsMsg.current}
            </p>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 mb-8">
              Sprint complete · {activeTask?.estimated_minutes ?? 25} min
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full">
              {/* Complete task & close */}
              <button onClick={handleDone}
                className="w-full h-11 bg-[#C8F135] text-[#0A0A0A] text-[10px] font-black tracking-[0.2em] uppercase hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2">
                <Check size={12} strokeWidth={3} />
                Mark task done & close
              </button>

              {/* Next sprint */}
              {onNextTask && (
                <button onClick={onNextTask}
                  className="w-full h-10 bg-white/[0.05] border border-white/[0.08] text-white/55 text-[10px] font-black tracking-[0.18em] uppercase hover:bg-white/[0.09] hover:text-white/80 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <SkipForward size={11} strokeWidth={2.5} />
                  Next task sprint
                </button>
              )}

              {/* Just close */}
              <button onClick={onClose}
                className="w-full h-9 text-white/20 text-[9px] font-black tracking-[0.18em] uppercase hover:text-white/45 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                <Minus size={10} strokeWidth={2} />
                Close without completing
              </button>
            </div>
          </div>

        ) : (
          <>
            {/* ── SUBTASKS (normal mode) ── */}
            {subtasks.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 pt-4 pb-2">
                  <span className="text-[9px] font-extrabold tracking-[0.22em] text-white/25 uppercase">SUBTASKS</span>
                </div>
                <div>
                  {subtasks.map((st, i) => (
                    <button key={st.id}
                      onClick={() => { sfx.play('check', 0.35); onToggleSubtaskDone?.(st.id, st.done); }}
                      className="st-in w-full flex items-center gap-3 px-5 py-3 text-left border-t border-white/[0.05] hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      style={{ animationDelay: `${i * 0.035}s` }}>
                      {st.done
                        ? <CheckCircle2 className="w-4 h-4 text-[#C8F135] shrink-0" />
                        : <Circle className="w-4 h-4 text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
                      }
                      <span className={`text-[11px] font-extrabold tracking-[0.08em] uppercase transition-colors ${st.done ? "line-through text-white/20" : "text-white/60 group-hover:text-white/90"}`}>
                        {st.title}
                      </span>
                      {st.done && <span className="ml-auto text-[9px] font-black tracking-[0.16em] text-[#C8F135]/50 uppercase shrink-0">DONE</span>}
                    </button>
                  ))}
                </div>
                {subtasks.length > 1 && (
                  <div className="px-5 pt-4 pb-2">
                    <div className="h-[2px] bg-white/[0.05]">
                      <div className="h-full bg-[#C8F135]/50 transition-all duration-500" style={{ width: `${(doneCount / subtasks.length) * 100}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] font-extrabold tracking-[0.2em] text-white/15 uppercase">{doneCount} DONE</span>
                      <span className="text-[8px] font-extrabold tracking-[0.2em] text-white/15 uppercase">{subtasks.length - doneCount} LEFT</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {subtasks.length === 0 && <div className="flex-1" />}

            {/* ── BOTTOM (normal mode) ── */}
            <div className="flex items-center justify-between px-5 border-t border-white/[0.07] shrink-0 gap-3 py-4 pb-7">
              <button onClick={onMinimize}
                className="flex items-center gap-2 h-9 px-4 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/40 text-[10px] font-black tracking-[0.14em] uppercase hover:bg-white/10 hover:text-white/70 transition-all cursor-pointer">
                <Minus size={11} strokeWidth={2.5} />
                Minimize
              </button>
              {onNextTask && (
                <button onClick={onNextTask}
                  className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.16em] uppercase text-white/20 hover:text-[#C8F135] transition-colors outline-none cursor-pointer">
                  Next <SkipForward size={9} strokeWidth={2.5} />
                </button>
              )}
              <button onClick={() => setCompleted(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-full bg-[#C8F135] text-[#0A0A0A] text-[10px] font-black tracking-[0.14em] uppercase hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                <Check size={11} strokeWidth={2.5} />
                Done
              </button>
            </div>
          </>
        )}

      </div>
    </>
  );
};

export default FocusMode;