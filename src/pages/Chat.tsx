import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { buildConversations, TOTAL_GROUP, type Conversation } from '../lib/conversation';
import { sendMessage } from '../hooks/queries/useChat';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';
import type { Profile } from '../types/database';

export default function Chat() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const forwardId = searchParams.get('forward');

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const profilesById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const conversations = useMemo<Conversation[]>(
    () => (profile ? buildConversations(profile, profiles) : []),
    [profile, profiles],
  );

  const { data: forwardTask } = useQuery({
    queryKey: ['task', forwardId],
    enabled: !!forwardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', forwardId!)
        .single();
      if (error) throw error;
      return data as { title: string };
    },
  });

  if (!profile) return null;

  const activeKey = selected ?? (forwardId ? TOTAL_GROUP : conversations[0]?.key ?? null);
  const activeConv = conversations.find((c) => c.key === activeKey) ?? null;

  async function sendForward() {
    if (!forwardTask || !activeKey) return;
    await sendMessage({
      conversationKey: activeKey,
      senderId: profile!.id,
      content: `📋 转发任务：${forwardTask.title}`,
      content_type: 'text',
      referenced_task_id: forwardId,
      queryClient: qc,
    });
    searchParams.delete('forward');
    setSearchParams(searchParams);
  }

  return (
    <div className="flex h-full overflow-hidden rounded-2xl border border-black/5 bg-white">
      <ConversationList conversations={conversations} selectedKey={activeKey} onSelect={setSelected} />
      {activeKey ? (
        <ChatWindow
          conversationKey={activeKey}
          label={activeConv?.label ?? ''}
          me={profile}
          profilesById={profilesById}
          forward={forwardTask ? { title: forwardTask.title, onSend: sendForward } : null}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          选择一个会话开始聊天
        </div>
      )}
    </div>
  );
}
