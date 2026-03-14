// src/components/SyncBadge.tsx
// Shows a small indicator in the top bar:
//   • Green pulse = syncing
//   • Amber count = N changes pending
//   • Nothing = fully synced

interface Props {
  pending: number;
}

export const SyncBadge = ({ pending }: Props) => {
  if (pending === 0) return null;

  return (
    <div
      title={`${pending} change${pending === 1 ? '' : 's'} pending sync`}
      className="flex items-center gap-1.5 px-2 py-[3px] border border-amber-400/40 text-amber-400"
    >
      <span className="w-[5px] h-[5px] rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase">
        {pending} pending
      </span>
    </div>
  );
};