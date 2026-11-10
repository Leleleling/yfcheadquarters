import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Message } from '../../types/database';

export function useChatMessages(conversationKey: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['messages', conversationKey],
    enabled: !!conversationKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_key', conversationKey!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    if (!conversationKey) return;
    const channel = supabase
      .channel(`messages:${conversationKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_key=eq.${conversationKey}`,
        },
        (payload) => {
          qc.setQueryData<Message[]>(['messages', conversationKey], (old = []) => {
            const incoming = payload.new as Message;
            if (old.some((m) => m.id === incoming.id)) return old;
            return [...old, incoming];
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationKey, qc]);

  return query;
}

export async function sendMessage(input: {
  conversationKey: string;
  senderId: string;
  content: string | null;
  type: Message['type'];
  mediaUrl?: string | null;
}) {
  const { error } = await supabase.from('messages').insert({
    conversation_key: input.conversationKey,
    sender_id: input.senderId,
    content: input.content,
    type: input.type,
    media_url: input.mediaUrl ?? null,
  });
  if (error) throw error;
}
