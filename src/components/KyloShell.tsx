// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { ProjectList } from './ProjectList';
import { TaskList } from './TaskList';
import { CommandBar } from './CommandBar';
import { FloatingBottomToolbar } from './FloatingBottomToolbar';
import { ActiveTask, Task, Project } from '../types';
import { ChevronDown } from 'lucide-react';

import { supabase } from '../lib/supabase';

import type { User } from '@supabase/supabase-js';
import { FocusMode } from './FocusMode';

const TOTAL_SESSIONS = 4;

export const KyloShell = ({ user }: { user: User }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  let isMounted = true;

  const fetchAll = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) { console.error('Error fetching projects:', projectsError); return; }
      if (!isMounted) return;

      setProjects(projectsData ?? []);

      if (!projectsData || projectsData.length === 0) {
        await ensureDefaultProject(user.id);
        return;
      }

      const activeProjectId = selectedProjectId ?? projectsData?.[0]?.id ?? null;
      if (!selectedProjectId && activeProjectId) setSelectedProjectId(activeProjectId);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id, user_id, project_id, title, estimated_minutes, deadline,
          important, done, created_at,
          subtasks ( id, task_id, title, done, created_at )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) { console.error('Error fetching tasks:', tasksError); return; }
      if (!isMounted) return;

      setTasks(tasksData ?? []);
    } catch (err) {
      console.error('Unexpected fetch error:', err);
    }
  };

  const ensureDefaultProject = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: 'Inbox' })
      .select()
      .single();

    if (!error && data) {
      setProjects([data]);
      setSelectedProjectId(data.id);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchAll();
  }, [user?.id]);

  useEffect(() => {
    if (isRunning && secondsLeft !== null) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s === null || s <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [isRunning]);

  const handleFocusTask = (task: Task) => {
    setActiveTask(task);
    setSecondsLeft((task.estimated_minutes ?? 25) * 60);
    setSession(1);
    setIsRunning(true);
  };

  const handleCloseTask = () => {
    setActiveTask(null);
    setIsRunning(false);
    setSecondsLeft(null);
    setSession(1);
    clearInterval(intervalRef.current!);
  };

  const filteredTasks = selectedProjectId
    ? tasks.filter(task => task.project_id === selectedProjectId)
    : tasks;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTask = async (input: {
    title: string;
    estimated_minutes?: number;
    deadline?: string;
    important?: boolean;
  }) => {
    if (!selectedProjectId || !user?.id) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        project_id: selectedProjectId,
        title: input.title,
        estimated_minutes: input.estimated_minutes ?? 25,
        deadline: input.deadline ?? null,
        important: input.important ?? false,
        done: false,
      })
      .select()
      .single();

    if (error) { console.error(error); return; }
    setTasks(prev => [data, ...prev]);
  };

  const handleAddSubtask = async (task_id: string, title: string) => {
    const { data, error } = await supabase
      .from('subtasks')
      .insert({ task_id, title, done: false })
      .select()
      .single();

    if (!error) {
      setTasks(prev =>
        prev.map(task =>
          task.id === task_id
            ? { ...task, subtasks: [...(task.subtasks ?? []), data] }
            : task
        )
      );
    }
  };

  const handleToggleTaskDone = async (taskId: string, currentDone: boolean) => {
    const { error } = await supabase.from('tasks').update({ done: !currentDone }).eq('id', taskId);
    if (error) { console.error('Toggle task done failed:', error); return; }
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, done: !currentDone } : task));
  };

  const handleToggleImportant = async (taskId: string, currentImportant: boolean) => {
    const { error } = await supabase.from('tasks').update({ important: !currentImportant }).eq('id', taskId);
    if (error) { console.error('Toggle important failed:', error); return; }
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, important: !currentImportant } : task));
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) { console.error('Delete task failed:', error); return; }
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleToggleSubtaskDone = async (taskId: string, subtaskId: string, currentDone: boolean) => {
    const { error } = await supabase.from('subtasks').update({ done: !currentDone }).eq('id', subtaskId);
    if (error) { console.error('Toggle subtask done failed:', error); return; }
    setTasks(prev =>
      prev.map(task =>
        task.id !== taskId ? task : {
          ...task,
          subtasks: task.subtasks?.map(st => st.id === subtaskId ? { ...st, done: !currentDone } : st),
        }
      )
    );
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
    if (error) { console.error('Delete subtask failed:', error); return; }
    setTasks(prev =>
      prev.map(task =>
        task.id !== taskId ? task : {
          ...task,
          subtasks: task.subtasks?.filter(st => st.id !== subtaskId),
        }
      )
    );
  };

  const handleAddProject = async (input: { name: string; color: string }) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: input.name, color: input.color })
      .select()
      .single();

    if (!error && data) {
      setProjects(prev => [data, ...prev]);
      setSelectedProjectId(data.id);
    }
  };

  if (!isExpanded) {
    return (
      <FloatingBottomToolbar
        onExpand={() => {
          setIsExpanded(true);
          window.windowAPI?.expand();
        }}
      />
    );
  }

  const timerMins = secondsLeft !== null ? String(Math.floor(secondsLeft / 60)).padStart(2, '0') : null;
  const timerSecs = secondsLeft !== null ? String(secondsLeft % 60).padStart(2, '0') : null;
  const remainingCount = filteredTasks.filter(t => !t.done).length;

  return (
  <div className="fixed inset-0 z-50 bg-[#0A0A0A] text-[#EDEDED] font-['Barlow_Condensed',Arial_Black,sans-serif] flex flex-col overflow-hidden">

    {/* ───────────────── TOP BAR ───────────────── */}
    <div className="h-[46px] flex items-center justify-between px-4 border-b border-white/10 mt-6">

      <span className="text-[22px] font-black tracking-[0.1em] uppercase ">
        KYLO
      </span>

      <div className="flex items-center gap-2">

        {activeTask && secondsLeft !== null && (
          <button
            title="Active focus session"
            className="flex items-center gap-2 bg-[#C8F135] text-black text-[12px] font-black tracking-[0.12em] px-3 py-[4px] uppercase hover:opacity-80 transition"
          >
            {isRunning && (
              <span className="w-[6px] h-[6px] bg-black animate-pulse" />
            )}

            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
            {String(secondsLeft % 60).padStart(2, '0')}
          </button>
        )}

        <button
          onClick={() => {
            setIsExpanded(false);
            window.windowAPI?.minimize();
          }}
          className="w-7 h-7 flex items-center justify-center border border-white/10 text-white/40 hover:text-[#C8F135] hover:border-[#C8F135] transition"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>

    {/* ───────────────── SCROLL AREA ───────────────── */}
    <div className="flex-1 overflow-y-auto">

      {/* PROJECTS LABEL */}
      <div className="px-4 py-2 border-b border-white/10 text-[10px] font-extrabold tracking-[0.22em] text-white/40 uppercase">
        Projects
      </div>

      <ProjectList
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        onAddProject={handleAddProject}
      />

      {/* TASKS LABEL */}
      <div className="px-4 py-2 border-b border-white/10 flex justify-between text-[10px] font-extrabold tracking-[0.22em] uppercase">
        <span className="text-white/40">Tasks</span>
        <span className="text-[#C8F135]/60">
          {filteredTasks.filter(t => !t.done).length} Remaining
        </span>
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

    {/* ───────────────── COMMAND BAR ───────────────── */}
    <div className="border-t border-white/10 bg-[#0D0F12]">
      <CommandBar
              onSignOut={handleSignOut}
              userEmail={user?.email}
              onStartSprint={() => {
                const first = filteredTasks.find((t) => !t.done);
                if (first) handleFocusTask(first);
              }}
              onAddTask={(title) => handleAddTask({ title })}
              onAddProject={(name) => handleAddProject({ name, color: '#C8F135' })}
      />
    </div>

    {/* ───────────────── FOCUS OVERLAY ───────────────── */}
    {activeTask && (
      <div className="absolute inset-0 z-[60] bg-[#0A0A0A] animate-[slideUp_0.26s_cubic-bezier(0.22,1,0.36,1)_both]">
        <FocusMode
          activeTask={activeTask}
          onClose={handleCloseTask}
          secondsLeft={secondsLeft!}
          setSecondsLeft={setSecondsLeft}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
          session={session}
          setSession={setSession}
          totalSessions={TOTAL_SESSIONS}
        />
      </div>
    )}
  </div>
);
}