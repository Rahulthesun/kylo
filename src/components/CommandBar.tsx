import { useState, useRef, useEffect } from 'react';
import { Command, User, LogOut, Settings, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CommandBarProps {
  onSignOut: () => void;
  userEmail?: string;
  userId: string;
  selectedProjectId: string | null;
  onTasksCreated?: () => void;
}

export const CommandBar = ({
  onSignOut,
  userEmail,
  userId,
  selectedProjectId,
  onTasksCreated,
}: CommandBarProps) => {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !selectedProjectId || loading) return;

    setLoading(true);

    await createTasksFromAI(input, userId, selectedProjectId);

    setInput('');
    setLoading(false);

    if (onTasksCreated) onTasksCreated();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const createTasksFromAI = async (
  prompt: string,
  userId: string,
  projectId: string
    ) => {
      const { data, error } = await supabase.functions.invoke("ai", {
        body: { prompt },
      });

      if (error) {
        console.error("AI function error:", error);
        return;
      }

      if (!data?.content) {
        console.error("No content returned from AI");
        return;
      }

      let parsed;

      try {
        parsed = JSON.parse(data.content);
      } catch {
        console.error("AI returned invalid JSON:", data.content);
        return;
      }

      if (!parsed.tasks) return;

      for (const task of parsed.tasks) {
        const { data: insertedTask, error: insertError } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            project_id: projectId,
            title: task.title,
            estimated_minutes: task.estimated_minutes ?? 25,
            important: false,
            done: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error(insertError);
          continue;
        }

        if (task.subtasks?.length) {
          const subtaskRows = task.subtasks.map((st: string) => ({
            task_id: insertedTask.id,
            title: st,
            done: false,
          }));

          await supabase.from("subtasks").insert(subtaskRows);
        }
      }
    };

  return (
    <div className="px-4 py-3 border-t border-white/5 relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center gap-2">
          {/* Command input */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA0A6]">
              <Command className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Create task, switch project, ask AI..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-[#EDEDED] placeholder:text-[#9AA0A6] focus:outline-none focus:border-[#3B82F6]/50 focus:bg-white/8 transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* User button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
            >
              <User className="w-4 h-4" />
            </button>

            {open && (
              <div className="absolute right-0 bottom-12 w-56 bg-[#0B0D10] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-white/40">Signed in as</p>
                  <p className="text-sm text-white truncate">
                    {userEmail?.split('@')[0] ?? 'User'}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm text-white/70 hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-white/10"
                    onClick={() => {
                      setOpen(false);
                      onSignOut();
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};