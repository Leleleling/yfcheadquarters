import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../types/database';

export function useChat(conversationKey: string) {
  const qc = useQueryClient();
  const [connTick, setConnTick] = useState(0);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_key', conversationKey)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  // Realtime 订阅 + 断线自动重连
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationKey}`);
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_key=eq.${conversationKey}`,
        },
        (payload) => {
          const row = payload.new as Message;
          qc.setQueryData<Message[]>(['messages', conversationKey], (old = []) => {
            if (old.some((m) => m.id === row.id)) return old;
            return [...old, row];
          });
        },
      )
      .subscribe((status) => {
        // 断线或出错时，延时后触发重新订阅
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          setTimeout(() => setConnTick((t) => t + 1), 1500);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationKey, qc, connTick]);

  // 网络恢复后重新拉取最新消息
  useEffect(() => {
    const onOnline = () => qc.invalidateQueries({ queryKey: ['messages', conversationKey] });
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [conversationKey, qc]);

  return { messages, isLoading };
}

export async function sendMessage(input: {
  conversationKey: string;
  senderId: string;
  content: string | null;
  content_type: Message['content_type'];
  referenced_task_id?: string | null;
  queryClient?: QueryClient;
}) {
  const payload = {
    conversation_key: input.conversationKey,
    sender_id: input.senderId,
    content: input.content,
    content_type: input.content_type,
    ...(input.referenced_task_id ? { referenced_task_id: input.referenced_task_id } : {}),
  };
  console.log('[chat] insert payload', payload);
  const { data, error } = await supabase.from('messages').insert(payload).select().single();
  if (error) throw error;
  // 主动把新消息写入缓存，发送者无需等待 Realtime 即可立即看到
  input.queryClient?.setQueryData<Message[]>(['messages', input.conversationKey], (old = []) => {
    const row = data as Message;
    if (old.some((m) => m.id === row.id)) return old;
    return [...old, row];
  });
}
