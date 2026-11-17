import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

function useInvalidateTasks() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['tasks'] });
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return '操作失败，请重试';
}

export function useClaimTask() {
  const invalidate = useInvalidateTasks();
  const toast = useToast();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('claim_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidateTasks();
  const toast = useToast();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(errMsg(e)),
  });
}

export function useDelayTask() {
  const invalidate = useInvalidateTasks();
  const toast = useToast();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.rpc('delay_task', { p_task_id: taskId });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('已申请更多时间，等待管理员或组长调整截止日期');
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}

/** 修改任务截止日期：管理员或负责人组长，调用后端 change_deadline RPC。 */
export function useChangeDeadline() {
  const invalidate = useInvalidateTasks();
  const toast = useToast();
  return useMutation({
    mutationFn: async ({ taskId, newDueAt }: { taskId: string; newDueAt: string }) => {
      const { error } = await supabase.rpc('change_deadline', {
        p_task_id: taskId,
        p_new_due_at: newDueAt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('截止日期已更新，相关成员将收到通知');
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  const toast = useToast();
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
    onError: (e) => toast.error(errMsg(e)),
  });
}
