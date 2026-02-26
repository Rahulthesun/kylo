//This is not used for anything right now — just a placeholder for the collapsed state of the toolbar, and to hold shared styles between the collapsed and expanded toolbars.

import { CheckSquare, Clock, Sparkles } from 'lucide-react';

interface CollapsedToolbarProps {
  onExpand: () => void;
}

export const CollapsedToolbar = ({ onExpand }: CollapsedToolbarProps) => {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                 flex items-center relative
                 bg-[#0A0A0A] border border-white/[0.07]
                 shadow-[0_0_0_1px_rgba(200,241,53,0.12),0_8px_32px_rgba(0,0,0,0.6)]"
    >
      {/* Expand — acid yellow pill */}
      <button
        onClick={onExpand}
        className="flex items-center gap-2 h-11 px-4
                   bg-[#C8F135] text-[#0A0A0A]
                   text-[11px] font-black tracking-[0.18em] uppercase leading-none
                   border-r border-black/20
                   hover:opacity-85 transition-opacity duration-100
                   outline-none cursor-pointer flex-shrink-0"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
          <rect x="0" y="0" width="5" height="5" />
          <rect x="7" y="0" width="5" height="5" />
          <rect x="0" y="7" width="5" height="5" />
          <rect x="7" y="7" width="5" height="5" />
        </svg>
        KYLO
      </button>

      {/* Tasks */}
      <button
        className="flex items-center justify-center w-11 h-11
                   text-white/25 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                   border-r border-white/[0.07]
                   transition-all duration-100 outline-none cursor-pointer"
        title="Tasks"
      >
        <CheckSquare size={14} strokeWidth={2.5} />
      </button>

      {/* Timer */}
      <button
        className="flex items-center justify-center w-11 h-11
                   text-white/25 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                   border-r border-white/[0.07]
                   transition-all duration-100 outline-none cursor-pointer"
        title="Timer"
      >
        <Clock size={14} strokeWidth={2.5} />
      </button>

      {/* AI */}
      <button
        className="flex items-center justify-center w-11 h-11
                   text-white/25 hover:text-[#C8F135] hover:bg-[#C8F135]/10
                   transition-all duration-100 outline-none cursor-pointer"
        title="AI"
      >
        <Sparkles size={14} strokeWidth={2.5} />
      </button>

      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-[6px] h-[6px] border-t-[1.5px] border-l-[1.5px] border-[#C8F135] pointer-events-none" />
      <span className="absolute top-0 right-0 w-[6px] h-[6px] border-t-[1.5px] border-r-[1.5px] border-[#C8F135] pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-[6px] h-[6px] border-b-[1.5px] border-l-[1.5px] border-[#C8F135] pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-[6px] h-[6px] border-b-[1.5px] border-r-[1.5px] border-[#C8F135] pointer-events-none" />
    </div>
  );
};