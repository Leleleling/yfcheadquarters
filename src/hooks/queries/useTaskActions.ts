import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['tasks'] });
}

export function useClaimTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('claim_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDelayTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('delay_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      emoji,
      userId,
    }: {
      taskId: string;
      emoji: string;
      userId: string;
    }) => {
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({ task_id: taskId, user_id: userId, emoji });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
