import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '../hooks/queries/useNotifications';
import { cn } from '../components/ui/cn';

const TYPE_LABEL: Record<string, string> = {
  assigned: '新任务分配',
  completed: '任务已完成',
  need_more_time: '需要更多时间',
  overdue: '任务已逾期',
  encouraged: '收到鼓励',
  deadline_reminder: '截止提醒',
  deadline_changed: '截止日期变更',
};

export default function Notifications() {
  const { profile } = useAuth();
  const { data: list = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">通知</h2>
          <p className="text-sm text-gray-500">{unread} 条未读</p>
        </div>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={!unread}
          className="rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5 disabled:opacity-40"
        >
          全部标为已读
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">加载中…</p>
      ) : list.length === 0 ? (
        <div className="tp-surface rounded-2xl border p-10 text-center text-gray-400">暂无通知</div>
      ) : (
        <div className="space-y-2">
          {list.map((n) => {
            const payload = (n.payload ?? {}) as Record<string, string>;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => !n.read && markRead.mutate(n.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition-colors',
                  n.read ? 'bg-white' : 'bg-brand-soft ring-1 ring-brand/30',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-900">{TYPE_LABEL[n.type] ?? n.type}</span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                {payload.task_title && (
                  <p className="mt-1 text-sm text-gray-600">任务：{payload.task_title}</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
