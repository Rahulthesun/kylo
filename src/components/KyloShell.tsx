// @ts-nocheck
import { useEffect, useState } from 'react';
import { ProjectList } from './ProjectList';
import { TaskList } from './TaskList';
import { CommandBar } from './CommandBar';
import { FloatingBottomToolbar } from './FloatingBottomToolbar';
import { ActiveTask, Task, Project } from '../types';
import { Minimize } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { FocusMode } from './FocusMode';
import { useTimer } from '../hooks/useTimer';
import { usePersistentMusic } from '../hooks/usePersistentMusic';

export const KyloShell = ({ user }: { user: User }) => {
  const [isExpanded, setIsExpanded]           = useState(true);
  const [tasks, setTasks]                     = useState<Task[]>([]);
  const [projects, setProjects]               = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const timer = useTimer();
  const music = usePersistentMusic();

  const activeTaskFull = timer.timerState
    ? tasks.find(t => t.id === timer.timerState?.taskId) ?? {
        id: timer.timerState.taskId,
        title: timer.timerState.taskTitle ?? '',
        estimated_minutes: Math.round(timer.timerState.totalSeconds / 60),
        subtasks: [],
      }
    : null;

  let isMounted = true;

  const fetchAll = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (projectsError) { console.error(projectsError); return; }
      if (!isMounted) return;
      setProjects(projectsData ?? []);
      if (!projectsData || projectsData.length === 0) { await ensureDefaultProject(user.id); return; }
      const activeProjectId = selectedProjectId ?? projectsData?.[0]?.id ?? null;
      if (!selectedProjectId && activeProjectId) setSelectedProjectId(activeProjectId);
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks').select(`id, user_id, project_id, title, estimated_minutes, deadline, important, done, created_at, subtasks ( id, task_id, title, done, created_at )`)
        .eq('user_id', user.id).order('created_at', { ascending: false });
      if (tasksError) { console.error(tasksError); return; }
      if (!isMounted) return;
      setTasks(tasksData ?? []);
    } catch (err) { console.error(err); }
  };

  const ensureDefaultProject = async (userId: string) => {
    const { data, error } = await supabase.from('projects').insert({ user_id: userId, name: 'Inbox' }).select().single();
    if (!error && data) { setProjects([data]); setSelectedProjectId(data.id); }
  };

  useEffect(() => { if (!user?.id) return; fetchAll(); }, [user?.id]);

  // ── Task actions ──────────────────────────────────────────────────────────

  const handleFocusTask = (task: Task) => {
    timer.start(task.id, task.title, task.estimated_minutes ?? 25, 1);
  };

  const handleCloseTask = () => { timer.stop(); };

  const filteredTasks = selectedProjectId
    ? tasks.filter(t => t.project_id === selectedProjectId)
    : tasks;

  // Tasks that can still be sprinted (not done) in current project
  const pendingTasks = filteredTasks.filter(t => !t.done);
  const hasNoTasks   = pendingTasks.length === 0;

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleAddTask = async (input: { title: string; estimated_minutes?: number; deadline?: string; important?: boolean; }) => {
    if (!selectedProjectId || !user?.id) return;
    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id, project_id: selectedProjectId, title: input.title,
      estimated_minutes: input.estimated_minutes ?? 25, deadline: input.deadline ?? null,
      important: input.important ?? false, done: false,
    }).select().single();
    if (error) { console.error(error); return; }
    setTasks(prev => [data, ...prev]);
  };

  const handleAddSubtask = async (task_id: string, title: string) => {
    const { data, error } = await supabase.from('subtasks').insert({ task_id, title, done: false }).select().single();
    if (!error) setTasks(prev => prev.map(t => t.id === task_id ? { ...t, subtasks: [...(t.subtasks ?? []), data] } : t));
  };

  const handleToggleTaskDone = async (taskId: string, currentDone: boolean) => {
    const { error } = await supabase.from('tasks').update({ done: !currentDone }).eq('id', taskId);
    if (error) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !currentDone } : t));
  };

  const handleToggleImportant = async (taskId: string, currentImportant: boolean) => {
    const { error } = await supabase.from('tasks').update({ important: !currentImportant }).eq('id', taskId);
    if (error) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, important: !currentImportant } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleToggleSubtaskDone = async (taskId: string, subtaskId: string, currentDone: boolean) => {
    const { error } = await supabase.from('subtasks').update({ done: !currentDone }).eq('id', subtaskId);
    if (error) return;
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t, subtasks: t.subtasks?.map(st => st.id === subtaskId ? { ...st, done: !currentDone } : st)
    }));
  };

  const handleFocusSubtaskToggle = async (subtaskId: string, currentDone: boolean) => {
    if (!activeTaskFull?.id) return;
    await handleToggleSubtaskDone(activeTaskFull.id, subtaskId, currentDone);
  };

  // Called by FocusMode Done button — marks the active task itself as done
  const handleFocusTaskDone = async () => {
    if (!activeTaskFull?.id) return;
    const taskId    = activeTaskFull.id;
    const task      = tasks.find(t => t.id === taskId);
    if (!task || task.done) return;
    const { error } = await supabase.from('tasks').update({ done: true }).eq('id', taskId);
    if (error) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true } : t));
  };

  const handleAddProject = async (input: { name: string; color: string }) => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('projects').insert({ user_id: user.id, name: input.name, color: input.color }).select().single();
    if (!error && data) { setProjects(prev => [data, ...prev]); setSelectedProjectId(data.id); }
  };

  // ── Minimized view ────────────────────────────────────────────────────────

  if (!isExpanded) {
    return (
      <FloatingBottomToolbar
        onExpand={() => { setIsExpanded(true); window.windowAPI?.expand(); }}
        secondsLeft={timer.isActive ? timer.secondsLeft : null}
        isRunning={timer.isRunning}
        onTogglePlay={timer.togglePlay}
        music={music}
        onReset={timer.reset}
      />
    );
  }

  // ── Start sprint guard ────────────────────────────────────────────────────
  // Only start if there are pending tasks in this project
  const handleStartSprint = () => {
    const first = pendingTasks[0];
    if (!first) return; // guard — button is disabled anyway but safety first
    handleFocusTask(first);
  };

  // ── Expanded view ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] text-[#EDEDED] font-['Barlow_Condensed',Arial_Black,sans-serif] flex flex-col overflow-hidden">

      {/* TOP BAR */}
      <div className="h-[46px] flex items-center justify-between px-4 border-b border-white/10 mt-6">
        <span className="text-[22px] font-black tracking-[0.1em] uppercase">KYLO</span>
        <div className="flex items-center gap-2">
          {activeTaskFull && (
            <button
              onClick={() => setIsExpanded(false)}
              title="Active focus session"
              className="flex items-center gap-2 bg-[#C8F135] text-black text-[12px] font-black tracking-[0.12em] px-3 py-[4px] uppercase hover:opacity-80 transition"
            >
              {timer.isRunning && <span className="w-[6px] h-[6px] bg-black animate-pulse" />}
              {String(Math.floor(timer.secondsLeft / 60)).padStart(2, '0')}:
              {String(timer.secondsLeft % 60).padStart(2, '0')}
            </button>
          )}
          <button
            onClick={() => { setIsExpanded(false); window.windowAPI?.minimize(); }}
            className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-[#C8F135] hover:border-[#C8F135] transition"
          >
            <Minimize size={14} stroke='#C8F135' />
          </button>
        </div>
      </div>

      {/* SCROLL AREA */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 border-b border-white/10 text-[10px] font-extrabold tracking-[0.22em] text-white/40 uppercase">Projects</div>
        <ProjectList projects={projects} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} onAddProject={handleAddProject} />
        <div className="px-4 py-2 border-b border-white/10 flex justify-between text-[10px] font-extrabold tracking-[0.22em] uppercase">
          <span className="text-white/40">Tasks</span>
          <span className="text-[#C8F135]/60">{pendingTasks.length} Remaining</span>
        </div>
        <TaskList
          tasks={filteredTasks}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskDone={handleToggleTaskDone}
          onToggleSubtaskDone={handleToggleSubtaskDone}
          onToggleTaskImportant={handleToggleImportant}
          onAddSubtask={handleAddSubtask}
          onFocusTask={handleFocusTask}
        />
      </div>

      {/* COMMAND BAR */}
      <div className="border-t border-white/10 bg-[#0D0F12]">
        <CommandBar
          onSignOut={handleSignOut}
          userEmail={user?.email}
          // ── Sprint guard: disabled + dimmed when no pending tasks ──
          onStartSprint={hasNoTasks ? undefined : handleStartSprint}
          sprintDisabled={hasNoTasks}
          onAddTask={(title) => handleAddTask({ title })}
          onAddProject={(name) => handleAddProject({ name, color: '#C8F135' })}
        />
      </div>

      {/* FOCUS OVERLAY */}
      {activeTaskFull && (
        <div className="absolute inset-0 z-[60] bg-[#0A0A0A] animate-[slideUp_0.26s_cubic-bezier(0.22,1,0.36,1)_both]">
          <FocusMode
            activeTask={activeTaskFull}
            onClose={handleCloseTask}
            onMinimize={() => { setIsExpanded(false); window.windowAPI?.minimize(); }}
            onDone={() => { handleCloseTask(); }}
            onNextTask={pendingTasks.length > 1 ? () => {
              // Find next pending task that isn't the current one
              const next = pendingTasks.find(t => t.id !== activeTaskFull.id);
              if (next) { handleCloseTask(); setTimeout(() => handleFocusTask(next), 80); }
            } : undefined}
            onToggleSubtaskDone={handleFocusSubtaskToggle}
            onToggleTaskDone={handleFocusTaskDone}
            secondsLeft={timer.secondsLeft}
            setSecondsLeft={() => {}}
            isRunning={timer.isRunning}
            setIsRunning={(v) => { if (typeof v === 'function' ? v(timer.isRunning) : v) timer.resume(); else timer.pause(); }}
            onTogglePlay={timer.togglePlay}
            music={music}
            onReset={timer.reset}
          />
        </div>
      )}
    </div>
  );
};