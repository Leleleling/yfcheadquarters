import { useCallback, useState } from 'react';

const KEY = 'yfc:pinned-tasks';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** 本地置顶：用 localStorage 记住用户置顶的任务 id，不做后端改动。 */
export function usePinnedTasks() {
  const [pinned, setPinned] = useState<string[]>(() => read());

  const toggle = useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { pinned, isPinned: (id: string) => pinned.includes(id), toggle };
}
