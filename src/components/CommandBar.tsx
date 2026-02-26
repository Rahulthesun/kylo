import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User, Zap, Plus, CheckSquare, FolderPlus, X } from 'lucide-react';

interface CommandBarProps {
  onSignOut: () => void;
  userEmail?: string;
  onStartSprint: () => void;
  onAddTask: (title: string) => void;
  onAddProject: (name: string) => void;
}

export const CommandBar = ({
  onSignOut,
  userEmail,
  onStartSprint,
  onAddTask,
  onAddProject,
}: CommandBarProps) => {
  const [userOpen, setUserOpen]       = useState(false);
  const [addOpen, setAddOpen]         = useState(false);
  const [mode, setMode]               = useState<'idle' | 'task' | 'project'>('idle');
  const [inputVal, setInputVal]       = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef  = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  /* close user menu on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* close add menu on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) closeAdd();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* focus input when mode switches */
  useEffect(() => {
    if (mode !== 'idle') setTimeout(() => inputRef.current?.focus(), 30);
  }, [mode]);

  const openAdd = () => { setAddOpen(true); setMode('idle'); setInputVal(''); };
  const closeAdd = () => { setAddOpen(false); setMode('idle'); setInputVal(''); };

  const handleSubmit = () => {
    const v = inputVal.trim();
    if (!v) return;
    if (mode === 'task')    onAddTask(v);
    if (mode === 'project') onAddProject(v);
    closeAdd();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  handleSubmit();
    if (e.key === 'Escape') closeAdd();
  };

  return (
    <div className="relative">

      {/* ── User dropdown ── */}
      {userOpen && (
        <div
          ref={userMenuRef}
          className="absolute bottom-full right-0 mb-1 w-52
                     bg-[#0D0F12] border border-white/[0.07]
                     shadow-[0_-8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
        >
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#C8F135] pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#C8F135] pointer-events-none" />

          <div className="px-4 py-3 border-b border-white/[0.07]">
            <p className="text-[9px] font-black tracking-[0.18em] uppercase text-white/25 mb-1">SIGNED IN AS</p>
            <p className="text-[12px] font-bold tracking-[0.06em] text-[#EDEDED] truncate uppercase">
              {userEmail?.split('@')[0] ?? 'USER'}
            </p>
          </div>

          <button type="button"
            className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]
                       text-[10px] font-black tracking-[0.14em] uppercase
                       text-white/40 hover:text-[#EDEDED] hover:bg-white/[0.04]
                       transition-colors duration-100 outline-none cursor-pointer">
            <Settings size={11} strokeWidth={2.5} />
            SETTINGS
          </button>

          <button type="button"
            onClick={() => { setUserOpen(false); onSignOut(); }}
            className="w-full flex items-center gap-3 px-4 py-3
                       text-[10px] font-black tracking-[0.14em] uppercase
                       text-red-500/60 hover:text-red-400 hover:bg-red-500/[0.06]
                       transition-colors duration-100 outline-none cursor-pointer">
            <LogOut size={11} strokeWidth={2.5} />
            SIGN OUT
          </button>
        </div>
      )}

      {/* ── Add submenu ── */}
      {addOpen && (
        <div
          ref={addMenuRef}
          className="absolute bottom-full right-11 mb-1
                     bg-[#0D0F12] border border-white/[0.07]
                     shadow-[0_-8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
          style={{ width: 220 }}
        >
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#C8F135] pointer-events-none" />
          <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#C8F135] pointer-events-none" />

          {/* Picker — show when idle */}
          {mode === 'idle' && (
            <>
              <button type="button"
                onClick={() => setMode('task')}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]
                           text-[10px] font-black tracking-[0.14em] uppercase
                           text-white/50 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                           transition-colors duration-100 outline-none cursor-pointer">
                <CheckSquare size={11} strokeWidth={2.5} />
                NEW TASK
              </button>
              <button type="button"
                onClick={() => setMode('project')}
                className="w-full flex items-center gap-3 px-4 py-3
                           text-[10px] font-black tracking-[0.14em] uppercase
                           text-white/50 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                           transition-colors duration-100 outline-none cursor-pointer">
                <FolderPlus size={11} strokeWidth={2.5} />
                NEW PROJECT
              </button>
            </>
          )}

          {/* Input — shown after picking */}
          {mode !== 'idle' && (
            <div className="flex items-stretch h-11">
              {/* Back / label */}
              <div className="flex items-center px-3 border-r border-white/[0.07] flex-shrink-0">
                <span className="text-[9px] font-black tracking-[0.14em] uppercase text-[#C8F135]/60">
                  {mode === 'task' ? 'TASK' : 'PROJECT'}
                </span>
              </div>

              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                placeholder={mode === 'task' ? 'TASK NAME...' : 'PROJECT NAME...'}
                className="flex-1 min-w-0 bg-transparent border-none outline-none
                           text-[11px] font-bold tracking-[0.08em] uppercase
                           text-[#EDEDED] placeholder:text-white/20 px-3"
              />

              {/* Confirm */}
              <button type="button"
                onClick={handleSubmit}
                disabled={!inputVal.trim()}
                className="flex items-center justify-center w-11 flex-shrink-0
                           bg-[#C8F135] text-[#0A0A0A]
                           border-l border-black/20
                           hover:opacity-85 disabled:opacity-25 disabled:cursor-not-allowed
                           transition-opacity duration-100 outline-none cursor-pointer">
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Main bar ── */}
      <div className="flex justify-between items-stretch h-11">

        {/* START SPRINT */}
        <button
          type="button"
          onClick={onStartSprint}
          className="flex items-center gap-2 px-5 flex-shrink-0 w-auto
                     bg-[#C8F135] text-[#0A0A0A]
                     text-[11px] font-black tracking-[0.2em] uppercase leading-none
                     border-r border-black/20
                     hover:opacity-85 active:opacity-70
                     transition-opacity duration-100 outline-none cursor-pointer"
        >
          <Zap size={12} strokeWidth={3} />
          START SPRINT
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* SUPER ADD */}
        <button
          type="button"
          onClick={() => { setUserOpen(false); addOpen ? closeAdd() : openAdd(); }}
          className={[
            'flex items-center justify-center w-11 h-11 flex-shrink-0',
            'border-l border-white/[0.07]',
            'transition-all duration-100 outline-none cursor-pointer',
            addOpen
              ? 'bg-[#C8F135] text-[#0A0A0A]'
              : 'text-white/30 hover:text-[#C8F135] hover:bg-[#C8F135]/10',
          ].join(' ')}
          title="Add task or project"
        >
          {addOpen
            ? <X size={13} strokeWidth={3} />
            : <Plus size={13} strokeWidth={3} />
          }
        </button>

        {/* USER */}
        <div className="relative flex-shrink-0" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => { closeAdd(); setUserOpen((v) => !v); }}
            className={[
              'flex items-center justify-center w-11 h-11',
              'border-l border-white/[0.07]',
              'transition-all duration-100 outline-none cursor-pointer',
              userOpen
                ? 'bg-[#C8F135]/10 text-[#C8F135]'
                : 'text-white/25 hover:text-[#C8F135] hover:bg-[#C8F135]/10',
            ].join(' ')}
            title="Account"
          >
            <User size={13} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
};