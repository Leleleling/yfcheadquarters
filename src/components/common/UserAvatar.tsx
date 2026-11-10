import type { Profile } from '../../types/database';
import { TIME_STATUS_COLOR } from '../../types/database';
import { cn } from '../ui/cn';

interface UserAvatarProps {
  user: Pick<Profile, 'display_name' | 'time_status'>;
  size?: number;
  className?: string;
}

/** 圆形首字母头像，右下角叠加时间状态色点（若有）。 */
export function UserAvatar({ user, size = 32, className }: UserAvatarProps) {
  const initial = user.display_name.slice(0, 1);
  return (
    <div
      className={cn('relative inline-flex shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-deep"
        style={{ fontSize: size * 0.42 }}
      >
        {initial}
      </div>
      {user.time_status && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
          style={{ backgroundColor: TIME_STATUS_COLOR[user.time_status] }}
          title={user.time_status}
        />
      )}
    </div>
  );
}
