import { Hash, Users, User as UserIcon } from 'lucide-react';
import type { Conversation } from '../../lib/conversation';
import { cn } from '../ui/cn';

interface ConversationListProps {
  conversations: Conversation[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function ConversationList({ conversations, selectedKey, onSelect }: ConversationListProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-black/5 bg-white">
      <div className="border-b border-black/5 px-4 py-3 text-sm font-semibold text-gray-700">会话</div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect(c.key)}
            className={cn(
              'mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
              selectedKey === c.key
                ? 'bg-brand text-white'
                : 'text-gray-700 hover:bg-black/5',
            )}
          >
            {c.kind === 'group' ? (
              <Users className="h-4 w-4 shrink-0" />
            ) : (
              <UserIcon className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{c.label}</span>
            {c.kind === 'group' && <Hash className="ml-auto h-3.5 w-3.5 opacity-50" />}
          </button>
        ))}
      </div>
    </aside>
  );
}
