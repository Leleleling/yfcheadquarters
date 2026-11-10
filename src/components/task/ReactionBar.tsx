import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToggleReaction } from '../../hooks/queries/useTaskActions';
import type { TaskWithRelations } from '../../types/database';
import { cn } from '../ui/cn';

const QUICK_EMOJIS = ['👍', '🎉', '🔥', '❤️', '😂', '👀'];

export function ReactionBar({ task }: { task: TaskWithRelations }) {
  const { profile } = useAuth();
  const toggle = useToggleReaction();
  const [open, setOpen] = useState(false);

  if (task.status !== 'completed' || !profile) return null;

  const grouped = task.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {Object.entries(grouped).map(([emoji, count]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => toggle.mutate({ taskId: task.id, emoji, userId: profile.id })}
          className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-sm transition-colors hover:bg-brand/15"
        >
          <span>{emoji}</span>
          <span className="text-xs font-medium text-gray-600">{count}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/5',
        )}
        aria-label="添加表情"
      >
        ＋
      </button>
      {open && (
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-lift ring-1 ring-black/5">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                toggle.mutate({ taskId: task.id, emoji: e, userId: profile.id });
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-black/5"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
