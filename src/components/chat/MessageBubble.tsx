import type { Message, Profile } from '../../types/database';
import { UserAvatar } from '../common/UserAvatar';
import { getSignedUrl } from '../../lib/storage';
import { formatTime } from '../../lib/format';
import { cn } from '../ui/cn';

interface MessageBubbleProps {
  message: Message;
  sender: Profile | null;
  meId: string;
}

export function MessageBubble({ message, sender, meId }: MessageBubbleProps) {
  const mine = message.sender_id === meId;

  async function handleOpenMedia() {
    if (!message.content) return;
    try {
      const url = await getSignedUrl(message.content);
      window.open(url, '_blank');
    } catch (e) {
      console.error('[chat] 获取签名链接失败', e);
    }
  }

  return (
    <div className={cn('flex items-end gap-2', mine ? 'flex-row-reverse' : 'flex-row')}>
      {sender && <UserAvatar user={sender} size={30} />}
      <div
        className={cn(
          'max-w-[72%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine ? 'bg-brand text-white' : 'bg-white text-gray-800',
        )}
      >
        {message.content_type === 'text' || message.content_type === 'emoji' ? (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        ) : message.content_type === 'voice' ? (
          <button type="button" onClick={handleOpenMedia} className="underline">
            🎤 语音消息
          </button>
        ) : (
          <button type="button" onClick={handleOpenMedia} className="underline">
            📎 文件
          </button>
        )}
        <div className={cn('mt-1 text-right text-[10px]', mine ? 'text-white/70' : 'text-gray-400')}>
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
