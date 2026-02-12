import { useState } from 'react';
import { Task } from '../types';
import {
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Circle,
  CheckCircle2,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];

  onAddTask: (task: {
    title: string;
    estimatedMinutes?: number;
    deadline?: string;
    important?: boolean;
  }) => void;

  onDeleteTask?: (taskId: string) => void;
  onToggleTaskDone?: (taskId: string) => void;
  onToggleTaskImportant?: (taskId: string) => void;
  onToggleSubtaskDone?: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
}

export const TaskList = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTaskDone,
  onToggleTaskImportant,
  onToggleSubtaskDone,
  onAddSubtask,
}: TaskListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState(25);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState('');

  return (
    <div className="px-4 py-3 flex-1 overflow-y-auto">
      <h2 className="text-xs font-medium text-[#9AA0A6] uppercase tracking-wider mb-2 px-2">
        Tasks
      </h2>

      <div className="space-y-2">

        {/* ADD TASK */}
        {isAdding ? (
          <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 space-y-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title…"
              className="w-full bg-transparent text-sm text-white outline-none"
            />

            <div className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-14 bg-white/5 rounded px-2 py-1"
              />
              min
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-white/40"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!title.trim()) return;
                  onAddTask({ title, estimatedMinutes: minutes });
                  setTitle('');
                  setMinutes(25);
                  setIsAdding(false);
                }}
                className="text-xs text-blue-400"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-3 py-2 text-sm text-white/50 border border-dashed border-white/10 rounded-md hover:bg-white/5"
          >
            + Add task
          </button>
        )}

        {/* TASKS */}
        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;

          return (
            <div
              key={task.id}
              className="relative px-3 py-2 rounded-md bg-white/5 border border-white/5"
            >
              {/* TASK HEADER */}
              <div className="flex gap-3">
                <button
                  onClick={() => onToggleTaskDone?.(task.id)}
                  className="pt-[2px]"
                >
                  {task.done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/40" />
                  )}
                </button>

                <div className="flex-1">
                  <h3
                    className={`text-sm leading-tight ${
                      task.done
                        ? 'line-through text-white/40'
                        : 'text-[#EDEDED]'
                    }`}
                  >
                    {task.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#9AA0A6] mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedMinutes} min</span>
                  </div>
                </div>
              </div>

              {/* SUBTASKS (between header & actions) */}
              {isExpanded && (
                <div className="mt-2 space-y-2 pl-6">
                  {(task.subtasks || []).map((st) => (
                    <div key={st.id} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() =>
                            onToggleSubtaskDone?.(task.id, st.id)
                          }
                        >
                          {st.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-white/30" />
                          )}
                        </button>

                        <span
                          className={
                            st.done
                              ? 'line-through text-white/40'
                              : 'text-white/70'
                          }
                        >
                          {st.title}
                        </span>
                      </div>

                      {st.done && (
                        <div className="h-[2px] bg-white/10 rounded">
                          <div className="h-full w-full bg-green-400/60 rounded" />
                        </div>
                      )}
                    </div>
                  ))}

                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtask.trim()) {
                        onAddSubtask?.(task.id, newSubtask.trim());
                        setNewSubtask('');
                      }
                    }}
                    placeholder="Add sub-task…"
                    className="w-full bg-transparent text-xs text-white/50 outline-none"
                  />
                </div>
              )}

              {/* ACTIONS (bottom-left) */}
              <div className="my-2 flex items-center gap-2 pl-6">
                <button className="p-1 rounded hover:bg-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-white/40" />
                </button>

                <button
                  onClick={() => onToggleTaskImportant?.(task.id)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <Flag
                    className={`w-3.5 h-3.5 ${
                      task.important
                        ? 'text-red-400'
                        : 'text-white/40'
                    }`}
                  />
                </button>

                <button
                  onClick={() =>
                    setExpandedTaskId(isExpanded ? null : task.id)
                  }
                  className="p-1 rounded hover:bg-white/10"
                >
                  <Plus className="w-3.5 h-3.5 text-white/40" />
                </button>

                <button
                  onClick={() => onDeleteTask?.(task.id)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>

              {/* MINIMISE BUTTON (center of bottom border) */}
              <button
                onClick={() =>
                  setExpandedTaskId(isExpanded ? null : task.id)
                }
                className="absolute left-1/2 -translate-x-1/2 -bottom-3 bg-[#0B0D10] border border-white/10 rounded-full p-1 hover:bg-white/10"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 text-white/50" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-white/50" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};