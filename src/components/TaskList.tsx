import { useState, useCallback } from 'react';
import { Task } from '../types';
import { Clock, Plus, Trash2, Circle, CheckCircle2, Flag, Play, X, Check } from 'lucide-react';
import { useSFX } from '../hooks/useSFX';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: {
    title: string;
    estimatedMinutes?: number;
    deadline?: string;
    important?: boolean;
  }) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleTaskDone?: (taskId: string, currentDone: boolean) => void;
  onToggleTaskImportant?: (taskId: string, currentImportant: boolean) => void;
  onToggleSubtaskDone?: (taskId: string, subtaskId: string, currentDone: boolean) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onFocusTask?: (task: Task) => void;
}

const MINUTE_OPTS = [15, 25, 40, 60];

export const TaskList = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTaskDone,
  onToggleTaskImportant,
  onToggleSubtaskDone,
  onAddSubtask,
  onFocusTask,
}: TaskListProps) => {
  const [isAdding, setIsAdding]     = useState(false);
  const [title, setTitle]           = useState('');
  const [minutes, setMinutes]       = useState(25);
  const [important, setImportant]   = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');

  const sfx = useSFX();

  const submitTask = () => {
    if (!title.trim()) return;
    onAddTask({ title: title.trim(), estimatedMinutes: minutes, important });
    setTitle(''); setMinutes(25); setImportant(false); setIsAdding(false);
  };

  const handleToggleDone = useCallback((taskId: string, currentDone: boolean) => {
    sfx.play('check');
    onToggleTaskDone?.(taskId, currentDone);
  }, [onToggleTaskDone, sfx]);

  const handleToggleSubDone = useCallback((taskId: string, subId: string, currentDone: boolean) => {
    sfx.play('check', 0.35);
    onToggleSubtaskDone?.(taskId, subId, currentDone);
  }, [onToggleSubtaskDone, sfx]);

  const remaining = tasks.filter(t => !t.done).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400&display=swap');
        @keyframes tl-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .tl-in { animation: tl-in 0.18s cubic-bezier(0.16,1,0.3,1) both; }
        .task-text { font-family: 'DM Sans', sans-serif; font-weight: 300; }
      `}</style>

      <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'Barlow Condensed', Arial Black, sans-serif" }}>

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black tracking-[0.22em] uppercase text-white/25">TASKS</span>
            {remaining > 0 && (
              <span className="text-[9px] font-black tracking-[0.14em] text-[#C8F135]/60">{remaining} left</span>
            )}
          </div>
          <button
            onClick={() => setIsAdding(v => !v)}
            className={`flex items-center gap-1.5 h-7 px-3 text-[9px] font-black tracking-[0.16em] uppercase transition-all cursor-pointer outline-none
              ${isAdding ? 'bg-white/[0.05] text-white/35 border border-white/[0.07]' : 'bg-[#C8F135] text-[#0A0A0A] hover:opacity-90'}`}
          >
            {isAdding ? <X size={9} strokeWidth={2.5} /> : <Plus size={9} strokeWidth={2.5} />}
            {isAdding ? 'Cancel' : 'Add task'}
          </button>
        </div>

        {/* ── ADD TASK PANEL ── */}
        {isAdding && (
          <div className="tl-in mx-5 mb-4 border border-white/[0.07]" style={{ borderTop: '1.5px solid #C8F135' }}>
            <div className="px-4 pt-3 pb-2.5 border-b border-white/[0.06]">
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitTask()}
                placeholder="What needs to get done?"
                className="task-text w-full bg-transparent text-[13px] text-white/70 placeholder:text-white/22 outline-none"
              />
            </div>
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <p className="text-[8px] font-black tracking-[0.2em] uppercase text-white/20 mb-2">Duration</p>
              <div className="flex gap-1.5">
                {MINUTE_OPTS.map(m => (
                  <button key={m} onClick={() => setMinutes(m)}
                    className={`flex-1 h-7 text-[9px] font-black tracking-[0.1em] uppercase transition-all cursor-pointer outline-none
                      ${minutes === m ? 'bg-[#C8F135] text-[#0A0A0A]' : 'bg-white/[0.04] text-white/28 hover:text-white/55 border border-white/[0.06]'}`}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <button onClick={() => setImportant(v => !v)}
                className={`flex items-center gap-1.5 text-[9px] font-black tracking-[0.14em] uppercase transition-all cursor-pointer outline-none
                  ${important ? 'text-red-400' : 'text-white/22 hover:text-white/45'}`}>
                <Flag size={10} strokeWidth={2} />
                {important ? 'Important' : 'Mark important'}
                {important && <Check size={9} strokeWidth={3} className="ml-0.5" />}
              </button>
            </div>
            <button onClick={submitTask} disabled={!title.trim()}
              className="w-full h-9 bg-[#C8F135] text-[#0A0A0A] text-[9px] font-black tracking-[0.22em] uppercase disabled:opacity-25 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
              Add task
            </button>
          </div>
        )}

        {/* ── TASK LIST ── */}
        <div className="px-5 pb-8">
          {tasks.length === 0 && !isAdding && (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="text-[9px] font-black tracking-[0.2em] uppercase text-white/12">No tasks yet</span>
              <button onClick={() => setIsAdding(true)}
                className="text-[9px] font-black tracking-[0.14em] uppercase text-[#C8F135]/40 hover:text-[#C8F135] transition-colors cursor-pointer">
                + Add one
              </button>
            </div>
          )}

          {tasks.map((task, idx) => {
            const isExpanded = expandedId === task.id;
            const doneSubs   = (task.subtasks ?? []).filter(s => s.done).length;
            const totalSubs  = (task.subtasks ?? []).length;

            return (
              <div key={task.id} className="tl-in border-b border-white/[0.05] last:border-b-0"
                style={{ animationDelay: `${idx * 0.04}s` }}>

                {/* ── TITLE ROW — full width tappable ── */}
                <button
                  onClick={() => handleToggleDone(task.id, task.done)}
                  className="w-full flex items-start gap-2.5 pt-2.5 pb-0.5 text-left group cursor-pointer outline-none"
                >
                  <span className="mt-[3px] shrink-0">
                    {task.done
                      ? <CheckCircle2 className="w-[13px] h-[13px] text-[#C8F135]" />
                      : <Circle       className="w-[13px] h-[13px] text-white/18 group-hover:text-white/45 transition-colors" />
                    }
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1">
                      {task.important && !task.done && (
                        <span className="mt-[6px] w-[3px] h-[3px] rounded-full bg-red-400 shrink-0" />
                      )}
                      <p className={`task-text text-[13px] leading-snug transition-colors
                        ${task.done ? 'line-through text-white/20' : 'text-white/72 group-hover:text-white/92'}`}>
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {task.estimatedMinutes && (
                        <span className="flex items-center gap-1 text-[9px] text-white/18">
                          <Clock size={8} strokeWidth={1.75} />
                          {task.estimatedMinutes}m
                        </span>
                      )}

                      {/* Subtask pill */}
                      {totalSubs > 0 && (
                        <span
                          onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : task.id); }}
                          className={`inline-flex items-center gap-1 px-1.5 h-[18px] text-[8px] font-black tracking-[0.1em] uppercase transition-all cursor-pointer
                            ${doneSubs === totalSubs
                              ? 'bg-[#C8F135]/15 text-[#C8F135]/80'
                              : 'bg-white/[0.06] text-white/30 hover:bg-white/[0.1] hover:text-white/55'
                            }`}
                        >
                          {doneSubs === totalSubs
                            ? <CheckCircle2 size={8} strokeWidth={2.5} />
                            : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          }
                          {doneSubs}/{totalSubs}
                        </span>
                      )}

                      {totalSubs > 0 && doneSubs < totalSubs && (
                        <div className="flex-1 min-w-[32px] h-px bg-white/[0.05] overflow-hidden">
                          <div className="h-full bg-[#C8F135]/40 transition-all duration-500"
                            style={{ width: `${(doneSubs / totalSubs) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* ── SUBTASKS ── */}
                {isExpanded && (
                  <div className="tl-in pl-[22px] pb-2">
                    {(task.subtasks ?? []).map(st => (
                      <button key={st.id}
                        onClick={() => handleToggleSubDone(task.id, st.id, st.done)}
                        className="w-full flex items-center gap-2.5 py-2 border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors text-left cursor-pointer group/st"
                      >
                        {st.done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F135] shrink-0" />
                          : <Circle       className="w-3.5 h-3.5 text-white/18 shrink-0 group-hover/st:text-white/35 transition-colors" />
                        }
                        <span className={`task-text text-[12px] transition-colors
                          ${st.done ? 'line-through text-white/20' : 'text-white/55 group-hover/st:text-white/80'}`}>
                          {st.title}
                        </span>
                      </button>
                    ))}
                    <div className="flex items-center gap-2.5 py-2 border-t border-white/[0.05]">
                      <Plus size={10} strokeWidth={2} className="text-white/25 shrink-0" />
                      <input
                        autoFocus
                        value={newSubtask}
                        onChange={e => setNewSubtask(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newSubtask.trim()) {
                            onAddSubtask?.(task.id, newSubtask.trim());
                            setNewSubtask('');
                          }
                        }}
                        placeholder="Add subtask…"
                        className="task-text flex-1 bg-transparent text-[12px] text-white/50 placeholder:text-white/20 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── ACTION STRIP ── */}
                <div className="flex items-center pl-[22px] pb-2 gap-0.5">
                  <button onClick={() => onFocusTask?.(task)}
                    className="group/btn flex items-center justify-center h-7 w-7 hover:w-auto hover:px-2.5
                      text-[#C8F135]/50 hover:text-[#C8F135] hover:bg-white/[0.05]
                      transition-[width,padding,color,background] duration-150 cursor-pointer overflow-hidden">
                    <Play size={11} strokeWidth={2.5} className="fill-current shrink-0" />
                    <span className="hidden group-hover/btn:inline text-[10px] font-black tracking-[0.12em] uppercase ml-1.5 whitespace-nowrap">Sprint</span>
                  </button>

                  <button onClick={() => setExpandedId(isExpanded ? null : task.id)}
                    className="group/btn flex items-center justify-center h-7 w-7 hover:w-auto hover:px-2.5
                      text-white/28 hover:text-white/70 hover:bg-white/[0.05]
                      transition-[width,padding,color,background] duration-150 cursor-pointer overflow-hidden">
                    <Plus size={11} strokeWidth={2.5} className="shrink-0" />
                    <span className="hidden group-hover/btn:inline text-[10px] font-black tracking-[0.12em] uppercase ml-1.5 whitespace-nowrap">Subtask</span>
                  </button>

                  <span className="w-px h-3 bg-white/[0.07] mx-1 shrink-0" />

                  <button onClick={() => onToggleTaskImportant?.(task.id, task.important)}
                    className={`group/btn flex items-center justify-center h-7 w-7 hover:w-auto hover:px-2.5
                      transition-[width,padding,color,background] duration-150 cursor-pointer overflow-hidden hover:bg-white/[0.05]
                      ${task.important ? 'text-red-400' : 'text-white/25 hover:text-white/60'}`}>
                    <Flag size={11} strokeWidth={1.75} className="shrink-0" />
                    <span className="hidden group-hover/btn:inline text-[10px] font-black tracking-[0.12em] uppercase ml-1.5 whitespace-nowrap">
                      {task.important ? 'Flagged' : 'Flag'}
                    </span>
                  </button>

                  <button onClick={() => onDeleteTask?.(task.id)}
                    className="group/btn flex items-center justify-center h-7 w-7 hover:w-auto hover:px-2.5
                      text-white/20 hover:text-red-400/80 hover:bg-red-400/[0.07]
                      transition-[width,padding,color,background] duration-150 cursor-pointer overflow-hidden">
                    <Trash2 size={11} strokeWidth={1.75} className="shrink-0" />
                    <span className="hidden group-hover/btn:inline text-[10px] font-black tracking-[0.12em] uppercase ml-1.5 whitespace-nowrap">Delete</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};