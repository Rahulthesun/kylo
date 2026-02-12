import { useState } from 'react';
import { Project } from '../types';
import { Plus } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddProject: (input: { name: string; color: string }) => void;
}

const COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#A855F7', // purple
  '#14B8A6', // teal
];

export const ProjectList = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
}: ProjectListProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onAddProject({ name: name.trim(), color });
    setName('');
    setColor(COLORS[0]);
    setIsAdding(false);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xs font-medium text-[#9AA0A6] uppercase tracking-wider">
          Projects
        </h2>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded hover:bg-white/10 text-white/40"
            title="Add project"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        {/* ADD PROJECT (MINIMIZED) */}
        {isAdding && (
          <div className="px-2 py-2 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name…"
              className="
                w-full bg-transparent text-sm text-white
                placeholder:text-white/30 outline-none
              "
            />

            {/* Color picker */}
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                  w-4 h-4 rounded-full
                  ${color === c ? 'ring-2 ring-white/60' : ''}
                `}
                style={{ backgroundColor: c }}
              />
            ))}

              <div className="flex-1" />

              <button
                onClick={() => setIsAdding(false)}
                className="text-xs text-white/30 hover:text-white/50"
              >
                Cancel
              </button>

              <button
                onClick={submit}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* PROJECT LIST */}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`
              w-full px-3 py-2.5 rounded-lg text-left transition
              ${
                selectedProjectId === project.id
                  ? 'bg-white/10'
                  : 'hover:bg-white/5'
              }
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm text-[#EDEDED] truncate">
                {project.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};