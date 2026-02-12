import { useState, useRef, useEffect } from 'react';
import { Command, User, LogOut, Settings } from 'lucide-react';

interface CommandBarProps {
  onSignOut: () => void;
  userEmail?: string;
}

export const CommandBar = ({ onSignOut, userEmail }: CommandBarProps) => {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInput('');
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
              className="
                w-full pl-10 pr-4 py-2.5
                bg-white/5 border border-white/10
                rounded-lg
                text-sm text-[#EDEDED]
                placeholder:text-[#9AA0A6]
                focus:outline-none focus:border-[#3B82F6]/50
                focus:bg-white/8
                transition-all
              "
            />
          </div>

          {/* User button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="
                w-9 h-9 rounded-lg
                bg-white/5 border border-white/10
                flex items-center justify-center
                text-white/50
                hover:text-white
                hover:bg-white/10
                transition
              "
              title="User settings"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Dropdown */}
            {open && (
              <div
                className="
                  absolute right-0 bottom-12
                  w-56
                  bg-[#0B0D10]
                  border border-white/10
                  rounded-xl
                  shadow-2xl
                  overflow-hidden
                  z-50
                "
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-xs text-white/40">Signed in as</p>
                  <p className="text-sm text-white truncate">
                    {userEmail?.split('@')[0] ?? 'User'}
                  </p>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    type="button"
                    className="
                      w-full px-4 py-2
                      flex items-center gap-2
                      text-sm text-white/70
                      hover:bg-white/10
                    "
                    onClick={() => {
                      setOpen(false);
                      // future: open settings
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <button
                    type="button"
                    className="
                      w-full px-4 py-2
                      flex items-center gap-2
                      text-sm text-red-400
                      hover:bg-white/10
                    "
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