import { useChatMessages } from '../../hooks/queries/useChat';
import type { Profile } from '../../types/database';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  conversationKey: string;
  label: string;
  me: Profile;
  profilesById: Map<string, Profile>;
  forward?: { title: string; onSend: () => void } | null;
}

export function ChatWindow({ conversationKey, label, me, profilesById, forward }: ChatWindowProps) {
  const { data: messages = [], isLoading } = useChatMessages(conversationKey);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="border-b border-black/5 bg-white px-4 py-3 text-sm font-semibold text-gray-800">
        {label}
      </header>

      {forward && (
        <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-brand-soft px-4 py-2 text-sm text-brand-deep">
          <span className="truncate">📋 转发任务：{forward.title}</span>
          <button
            type="button"
            onClick={forward.onSend}
            className="shrink-0 rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white"
          >
            发送
          </button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-gray-400">加载消息…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400">还没有消息，开始聊天吧</p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              sender={profilesById.get(m.sender_id) ?? null}
              meId={me.id}
            />
          ))
        )}
      </div>

      <MessageInput conversationKey={conversationKey} me={me} />
    </div>
  );
}
