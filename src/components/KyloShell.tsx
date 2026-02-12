import { useEffect, useState } from 'react';
import { TopBar } from './Topbar';
import { ProjectList } from './ProjectList';
import { TaskList } from './TaskList';
import { TaskExecutionPanel } from './TaskExecutionPanel';
import { CommandBar } from './CommandBar';
import { FloatingBottomToolbar } from './FloatingBottomToolbar';
import { ActiveTask  , Task , Project} from '../types';
import { ChevronDown } from 'lucide-react';

import { supabase } from '../lib/supabase';

import type { User } from '@supabase/supabase-js';


export const KyloShell = ({ user }: { user: User }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);


 


  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    //Function To Ensure Inbox is the Default Project if there's no other project!!
    const ensureDefaultProject = async () => {
        if (projects.length > 0 || !user?.id) return;

        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: 'Inbox',
          })
          .select()
          .single();

        if (!error && data) {
          setProjects([data]);
          setSelectedProjectId(data.id);
        }
    };

    const fetchAll = async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          return;
        }

        if (!isMounted) return;

        setProjects(projectsData ?? []);
        
        //If No Projects , Inbox is Created & Selected as Default Project
        if (!projectsData || projectsData.length === 0) {
          await ensureDefaultProject();
          return;
        }

        // Auto-select first project if none selected
        const activeProjectId =
          selectedProjectId ?? projectsData?.[0]?.id ?? null;

        if (!selectedProjectId && activeProjectId) {
          setSelectedProjectId(activeProjectId);
        }

        // Fetch tasks
        const { data: tasksData, error:tasksError } = await supabase
          .from('tasks')
          .select(`
            id,
            user_id,
            project_id,
            title,
            estimated_minutes,
            deadline,
            important,
            done,
            created_at,
            subtasks (
              id,
              task_id,
              title,
              done,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          return;
        }

        if (!isMounted) return;

        setTasks(tasksData ?? []);
      } catch (err) {
        console.error('Unexpected fetch error:', err);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [user.id]);

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

      if (error) {
        console.error(error);
        return;
      }

      // data is already in the correct shape
      setTasks(prev => [data, ...prev]);
    };

    /* ---------------- ADD SUBTASK ---------------- */
    const handleAddSubtask = async (task_id: string, title: string) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id,
          title,
          done: false,
        })
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

  /* ---------------- TOGGLE TASK DONE ---------------- */

  const handleToggleTaskDone = async (
    taskId: string,
    currentDone: boolean
  ) => {
    const { error } = await supabase
      .from('tasks')
      .update({ done: !currentDone })
      .eq('id', taskId);

    if (error) {
      console.error('Toggle task done failed:', error);
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, done: !currentDone }
          : task
      )
    );
  };

  /* ---------------- TOGGLE TASK IMPORTANT ---------------- */

  const handleToggleImportant = async (
    taskId: string,
    currentImportant: boolean
  ) => {
    const { error } = await supabase
      .from('tasks')
      .update({ important: !currentImportant })
      .eq('id', taskId);

    if (error) {
      console.error('Toggle important failed:', error);
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, important: !currentImportant }
          : task
      )
    );
  };

  /* ---------------- DELETE TASK ---------------- */

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Delete task failed:', error);
      return;
    }

    setTasks(prev => prev.filter(task => task.id !== taskId));
  };


  

  /* ---------------- TOGGLE SUBTASK DONE ---------------- */

  const handleToggleSubtaskDone = async (
    taskId: string,
    subtaskId: string,
    currentDone: boolean
  ) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ done: !currentDone })
      .eq('id', subtaskId);

    if (error) {
      console.error('Toggle subtask done failed:', error);
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id !== taskId
          ? task
          : {
              ...task,
              subtasks: task.subtasks?.map(st =>
                st.id === subtaskId
                  ? { ...st, done: !currentDone }
                  : st
              ),
            }
      )
    );
  };

  /* ---------------- DELETE SUBTASK ---------------- */

  const handleDeleteSubtask = async (
    taskId: string,
    subtaskId: string
  ) => {
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId);

    if (error) {
      console.error('Delete subtask failed:', error);
      return;
    }

    setTasks(prev =>
      prev.map(task =>
        task.id !== taskId
          ? task
          : {
              ...task,
              subtasks: task.subtasks?.filter(
                st => st.id !== subtaskId
              ),
            }
      )
    );
  };

  const handleAddProject = async (input: { name: string; color: string }) => {
  if (!user?.id) return;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color,
    })
    .select()
    .single();

  if (!error && data) {
    setProjects(prev => [data, ...prev]);
    setSelectedProjectId(data.id);
  }
};

  

  if (!isExpanded) {
    return <FloatingBottomToolbar onExpand={() => {
      setIsExpanded(true);
      window.windowAPI?.expand();
    }} />;
  }

  return (
    <div className="fixed w-full z-50 animate-float-in">
      <div className="relative w-full h-screen bg-[#0B0D10]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        <button
          onClick={() => {
             setIsExpanded(false);
             window.windowAPI?.minimize();
          }}
          className="absolute right-0 w-7 h-7 rounded-md bg-white/[0.05] backdrop-blur-xl flex items-center justify-center text-[#9AA0A6] hover:text-[#EDEDED] hover:bg-white/5 transition-all duration-200 z-50 mt-3 mr-5"
          title="Collapse"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <TopBar />
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddProject={handleAddProject}
        />
        <TaskList
          tasks={filteredTasks}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskDone={handleToggleTaskDone}
          onToggleSubtaskDone={handleToggleSubtaskDone}
          onToggleTaskImportant={handleToggleImportant}
          onAddSubtask={handleAddSubtask}
        />
        
        <CommandBar 
          onSignOut={handleSignOut}
          userEmail={user?.email}
        />

        {activeTask && (
          <TaskExecutionPanel activeTask={activeTask} onClose={handleCloseTask} />
        )}
      </div>
    </div>
  );
};
