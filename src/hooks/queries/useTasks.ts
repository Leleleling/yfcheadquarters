import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { deriveColor, COLOR_ORDER } from '../../lib/deriveColor';
import type { Profile, Reaction, Task, TaskClaimant, TaskWithRelations } from '../../types/database';

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export function useTasks() {
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const [tasksRes, claimantsRes, reactionsRes, profilesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('due_at', { ascending: true }),
        supabase.from('task_claimants').select('*'),
        supabase.from('reactions').select('*'),
        supabase.from('profiles').select('*'),
      ]);
      if (tasksRes.error) throw tasksRes.error;
      if (claimantsRes.error) throw claimantsRes.error;
      if (reactionsRes.error) throw reactionsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profilesById = new Map<string, Profile>(
        (profilesRes.data as Profile[]).map((p) => [p.id, p]),
      );

      const claimantsByTask = new Map<string, TaskClaimant[]>();
      (claimantsRes.data as TaskClaimant[]).forEach((c) => {
        const arr = claimantsByTask.get(c.task_id) ?? [];
        arr.push(c);
        claimantsByTask.set(c.task_id, arr);
      });

      const reactionsByTask = new Map<string, Reaction[]>();
      (reactionsRes.data as Reaction[]).forEach((r) => {
        const arr = reactionsByTask.get(r.task_id) ?? [];
        arr.push(r);
        reactionsByTask.set(r.task_id, arr);
      });

      const now = Date.now();
      const visible = (tasksRes.data as Task[]).filter((t) => {
        if (t.status === 'open') return true;
        if (t.completed_at && now - new Date(t.completed_at).getTime() <= FIVE_DAYS_MS) return true;
        return false;
      });

      const tasks: TaskWithRelations[] = visible.map((t) => {
        const claims = claimantsByTask.get(t.id) ?? [];
        const claimantIds = claims.map((c) => c.user_id);
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

      return { tasks, profilesById };
    },
  });

  return query;
}

/** 供任务墙排序：先按颜色权重（红>蓝>绿>灰），再按截止日期升序。 */
export function sortTasks(
  tasks: TaskWithRelations[],
  meId: string,
  myGroupId: string | null,
): TaskWithRelations[] {
  return [...tasks].sort((a, b) => {
    const ca = deriveColor({
      claimantIds: a.claimantIds,
      meId,
      claimantGroupIds: a.claimants.map((c) => c.group_id ?? '').filter(Boolean),
      myGroupId,
    });
    const cb = deriveColor({
      claimantIds: b.claimantIds,
      meId,
      claimantGroupIds: b.claimants.map((c) => c.group_id ?? '').filter(Boolean),
      myGroupId,
    });
    const orderDiff = COLOR_ORDER[ca] - COLOR_ORDER[cb];
    if (orderDiff !== 0) return orderDiff;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
}
