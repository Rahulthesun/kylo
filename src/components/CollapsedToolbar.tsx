import { LayoutGrid, CheckSquare, Clock, Sparkles } from 'lucide-react';

interface CollapsedToolbarProps {
  onExpand: () => void;
}

export const CollapsedToolbar = ({ onExpand }: CollapsedToolbarProps) => {
  return (
    <div className="h-full w-14 bg-[#111216]/90 backdrop-blur-xl border-l border-white/10 flex flex-col items-center py-6 gap-6">
      <button
        onClick={onExpand}
        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#EDEDED] transition-all duration-200"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col items-center gap-4">
        <button className="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#9AA0A6] hover:text-[#EDEDED] transition-all duration-200">
          <CheckSquare className="w-5 h-5" />
        </button>

        <button className="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#9AA0A6] hover:text-[#EDEDED] transition-all duration-200">
          <Clock className="w-5 h-5" />
        </button>

        <button className="w-10 h-10 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#9AA0A6] hover:text-[#EDEDED] transition-all duration-200">
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
