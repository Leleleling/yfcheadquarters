import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { deriveColor, COLOR_ORDER, COLOR_META, claimantGroupIds } from '../lib/deriveColor';
import { TASK_TYPE_OPTIONS, type Profile, type Reaction, type Task } from '../types/database';
import { usePinnedTasks } from '../hooks/usePinnedTasks';
import { TaskCard } from '../components/task/TaskCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function TaskWall() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('all');
  const { pinned, isPinned, toggle } = usePinnedTasks();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').order('due_at', { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: claimants = [] } = useQuery({
    queryKey: ['task_claimants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('task_claimants').select('*');
      if (error) throw error;
      return data as { task_id: string; user_id: string }[];
    },
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ['reactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('reactions').select('*');
      if (error) throw error;
      return data as Reaction[];
    },
  });

  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const claimantsByTask = useMemo(() => {
    const m = new Map<string, string[]>();
    claimants.forEach((c) => {
      const arr = m.get(c.task_id) ?? [];
      arr.push(c.user_id);
      m.set(c.task_id, arr);
    });
    return m;
  }, [claimants]);
  const reactionsByTask = useMemo(() => {
    const m = new Map<string, Reaction[]>();
    reactions.forEach((r) => {
      const arr = m.get(r.task_id) ?? [];
      arr.push(r);
      m.set(r.task_id, arr);
    });
    return m;
  }, [reactions]);

  const sorted = useMemo(() => {
    const visible = (data ?? []).filter((t) => {
      const isDone = t.status === 'done';
      if (isDone) {
        const completed = t.completed_at ? new Date(t.completed_at).getTime() : 0;
        if (Date.now() - completed > 5 * 86_400_000) return false;
      }
      return true;
    });

    const filtered = visible.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        if (!(t.title.toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q))) return false;
      }
      return true;
    });

    const enriched = filtered.map((t) => {
      const claimantIds = claimantsByTask.get(t.id) ?? [];
      const claimants = claimantIds
        .map((id) => profilesById.get(id))
        .filter((p): p is Profile => !!p);
      return {
        ...t,
        claimantIds,
        claimants,
        targetUser: t.target_user_id ? (profilesById.get(t.target_user_id) ?? null) : null,
        reactions: reactionsByTask.get(t.id) ?? [],
      };
    });

    enriched.sort((a, b) => {
      const ca = deriveColor({
        claimantIds: a.claimantIds,
        meId: profile!.id,
        claimantGroupIds: claimantGroupIds(a.claimants),
        myGroupId: profile!.group_id,
      });
      const cb = deriveColor({
        claimantIds: b.claimantIds,
        meId: profile!.id,
        claimantGroupIds: claimantGroupIds(b.claimants),
        myGroupId: profile!.group_id,
      });
      const colorDiff = COLOR_ORDER[ca] - COLOR_ORDER[cb];
      if (colorDiff !== 0) return colorDiff;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

    const pinnedList = enriched.filter((t) => isPinned(t.id));
    const rest = enriched.filter((t) => !isPinned(t.id));
    return [...pinnedList, ...rest];
  }, [data, profiles, claimants, reactions, profile, cat, search, pinned]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索任务标题或备注…"
          className="sm:max-w-xs"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="tp-surface tp-border h-11 rounded-lg border px-3 text-sm"
        >
          <option value="all">全部种类</option>
          {TASK_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {(search || cat !== 'all') && (
          <Button variant="ghost" onClick={() => { setSearch(''); setCat('all'); }}>
            清除筛选
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-400">加载中…</div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center text-gray-400">暂无任务</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              me={profile}
              pinned={isPinned(task.id)}
              onTogglePin={() => toggle(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
