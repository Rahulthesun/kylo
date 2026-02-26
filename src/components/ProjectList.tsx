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
  '#C8F135', // acid yellow (kylo primary)
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#A855F7', // purple
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') setIsAdding(false);
  };

  return (
    <div>
      {/* ── Horizontal chip row ── */}
      <div
        className="flex items-stretch overflow-x-auto border-b border-white/[0.07]"
        style={{ scrollbarWidth: 'none' }}
      >
        {projects.map((project) => {
          const isActive = selectedProjectId === project.id;
          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              style={{
                borderBottomColor: isActive ? '#C8F135' : 'transparent',
              }}
              className={[
                'flex items-center gap-[7px] px-3.5 py-2.5 flex-shrink-0',
                'border-r border-white/[0.07] border-b-2',
                'text-[11px] font-extrabold tracking-[0.14em] uppercase whitespace-nowrap',
                'transition-all duration-100 outline-none cursor-pointer',
                isActive
                  ? 'text-[#C8F135] bg-[#C8F135]/10'
                  : 'text-white/40 bg-transparent hover:text-[#EDEDED] hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <span
                className="w-[7px] h-[7px] flex-shrink-0 inline-block"
                style={{ backgroundColor: project.color ?? '#C8F135' }}
              />
              {project.name}
            </button>
          );
        })}

        {/* Add button */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            title="New project"
            className="flex items-center justify-center px-3.5 py-2.5 flex-shrink-0
                       border-r border-white/[0.07] border-b-2 border-b-transparent
                       text-white/40 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                       transition-all duration-100 outline-none cursor-pointer"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {/* ── Inline add form ── */}
      {isAdding && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-white/[0.07] bg-[#111316]">

          {/* Live color swatch */}
          <span
            className="w-2 h-2 flex-shrink-0 inline-block"
            style={{ backgroundColor: color }}
          />

          {/* Name input */}
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="PROJECT NAME"
            className="flex-1 min-w-0 bg-transparent border-none outline-none
                       text-[#EDEDED] text-xs font-bold tracking-[0.1em] uppercase
                       placeholder:text-white/30"
          />

          {/* Color swatches */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={[
                  'w-3 h-3 flex-shrink-0 outline-none border-none cursor-pointer',
                  'hover:scale-125 transition-transform duration-100',
                  color === c
                    ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#111316]'
                    : '',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-3.5 bg-white/[0.07] flex-shrink-0" />

          {/* Cancel */}
          <button
            onClick={() => setIsAdding(false)}
            className="text-[10px] font-extrabold tracking-[0.12em] uppercase
                       text-white/30 hover:text-white/60 transition-colors
                       outline-none bg-transparent border-none cursor-pointer whitespace-nowrap"
          >
            ESC
          </button>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="px-2.5 py-1 bg-[#C8F135] text-[#0A0A0A]
                       text-[10px] font-black tracking-[0.12em] uppercase
                       border-none outline-none cursor-pointer flex-shrink-0
                       hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed
                       transition-opacity whitespace-nowrap"
          >
            ADD
          </button>
        </div>
      )}
    </div>
  );
};