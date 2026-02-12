import { useState } from 'react';
import { ActiveTask, ChecklistItem } from '../types';
import { X, Circle, CheckCircle2, Clock } from 'lucide-react';

interface TaskExecutionPanelProps {
  activeTask: ActiveTask;
  onClose: () => void;
}

export const TaskExecutionPanel = ({ activeTask, onClose }: TaskExecutionPanelProps) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(activeTask.checklist);

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <div className="absolute inset-0 bg-[#0B0D10]/95 backdrop-blur-xl z-10 flex flex-col">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium text-[#EDEDED] mb-1 truncate">
            {activeTask.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#9AA0A6]">
            <Clock className="w-3 h-3" />
            <span>{activeTask.estimatedMinutes} min</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-[#9AA0A6] hover:text-[#EDEDED] transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#9AA0A6] uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs text-[#EDEDED]">
              {completedCount} / {checklist.length}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-[#9AA0A6] uppercase tracking-wider mb-3">
            AI-Generated Checklist
          </h3>
          <div className="space-y-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/8 transition-all duration-200 border border-white/5 text-left"
              >
                <div className="flex items-start gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#9AA0A6] flex-shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-sm transition-all duration-200 ${
                      item.completed
                        ? 'text-[#9AA0A6] line-through'
                        : 'text-[#EDEDED]'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
