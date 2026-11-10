import type { Message, Profile } from '../../types/database';
import { UserAvatar } from '../common/UserAvatar';
import { cn } from '../ui/cn';

interface MessageBubbleProps {
  message: Message;
  sender: Profile | null;
  meId: string;
}

export function MessageBubble({ message, sender, meId }: MessageBubbleProps) {
  const mine = message.sender_id === meId;

  return (
    <div className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {sender && <UserAvatar user={sender} size={30} />}
      <div
        className={cn(
          'max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine ? 'bg-brand text-white' : 'bg-white text-gray-800',
        )}
      >
        {message.type === 'text' || message.type === 'emoji' ? (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        ) : message.type === 'voice' ? (
          <a href={message.media_url ?? '#'} target="_blank" rel="noreferrer" className="underline">
            🎤 语音消息
          </a>
        ) : (
          <a href={message.media_url ?? '#'} target="_blank" rel="noreferrer" className="underline">
            📎 文件
          </a>
        )}
      </div>
    </div>
  );
}
