import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/queries/useChat';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import type { Profile } from '../../types/database';

interface ChatWindowProps {
  conversationKey: string;
  label: string;
  me: Profile;
  profilesById: Map<string, Profile>;
  members?: Profile[];
  forward?: { title: string; onSend: () => void } | null;
}

export function ChatWindow({
  conversationKey,
  label,
  me,
  profilesById,
  members = [],
  forward,
}: ChatWindowProps) {
  const { messages } = useChat(conversationKey);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // 仅当用户停留在底部时才自动滚动；向上翻历史时不强行拽到底部
  useEffect(() => {
    if (atBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, atBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(nearBottom);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-14 items-center border-b border-black/5 px-4 font-medium">{label}</div>
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            sender={profilesById.get(m.sender_id) ?? null}
            meId={me.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      {forward && (
        <div className="flex items-center gap-2 border-t border-black/5 bg-amber-50 px-4 py-2 text-sm">
          <span className="flex-1 truncate">转发：{forward.title}</span>
          <button
            onClick={forward.onSend}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white"
          >
            发送
          </button>
        </div>
      )}
      <MessageInput conversationKey={conversationKey} me={me} members={members} />
    </div>
  );
}
