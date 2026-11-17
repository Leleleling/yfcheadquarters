import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '../hooks/queries/useNotifications';
import { cn } from '../components/ui/cn';
import { formatDueShort } from '../lib/format';
import type { AppNotification, NotificationType } from '../types/database';

const TYPE_META: Record<NotificationType, { label: string; dot: string }> = {
  overdue: { label: '任务逾期', dot: 'bg-red-500' },
  deadline_reminder: { label: '截止提醒', dot: 'bg-amber-500' },
  assigned: { label: '新任务分配', dot: 'bg-blue-500' },
  need_more_time: { label: '需要更多时间', dot: 'bg-amber-400' },
  completed: { label: '任务已完成', dot: 'bg-emerald-500' },
  encouraged: { label: '收到鼓励', dot: 'bg-pink-500' },
  deadline_changed: { label: '截止日期变更', dot: 'bg-violet-500' },
};

/** 排序权重：逾期 > 提醒 > 分配 > 延期 > 完成 > 鼓励。 */
const TYPE_ORDER: Record<NotificationType, number> = {
  overdue: 0,
  deadline_reminder: 1,
  assigned: 2,
  need_more_time: 3,
  completed: 4,
  encouraged: 5,
  deadline_changed: 2,
};

/** 按已确认模板生成第二行小字（任务名已是标题，不重复）。 */
function buildDetail(n: AppNotification): string {
  const p = n.payload ?? {};
  const actor = p.actor_name ?? '有人';
  const owner = p.owner_name ?? '';
  switch (n.type) {
    case 'assigned':
      return `${actor} 指派给你${p.due_at ? ` · 截止 ${formatDueShort(p.due_at)}` : ''}`;
    case 'completed':
      if (!owner) return `${actor} 完成了这个任务`;
      if (actor === owner) return `你完成了 ${owner} 的任务`;
      return `${actor}（代完成）完成了 ${owner} 的任务`;
    case 'encouraged': {
      const emoji = p.emoji ?? '👍';
      if (p.times_count && p.times_count > 1) return `${actor} 等给你点了 ${emoji}×${p.times_count}`;
      if (p.people_count && p.people_count > 1) return `${actor} 等 ${p.people_count} 人给你点了 ${emoji}`;
      return `${actor} 给你点了 ${emoji}`;
    }
    case 'need_more_time':
      return `${actor} 申请了更多时间，请调整截止日期`;
    case 'deadline_changed': {
      const oldD = p.old_due_at ? formatDueShort(p.old_due_at) : '';
      const newD = p.new_due_at ? formatDueShort(p.new_due_at) : '';
      return oldD && newD
        ? `截止时间已调整：${oldD} → ${newD}（${actor}）`
        : `${actor} 调整了任务截止时间`;
    }
    case 'overdue':
      return `已逾期${p.overdue_text ? ` ${p.overdue_text}` : ''}`;
    case 'deadline_reminder':
      return `还有${p.remain_text ? ` ${p.remain_text}` : '不到 1 小时'}到期`;
    default:
      return '';
  }
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return '今天';
  if (sameDay(d, yesterday)) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function Notifications() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: list = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unread = list.filter((n) => !n.read).length;

  // 未读块 → 类型权重 → 时间（updated_at 新者优先）倒序
  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const oa = TYPE_ORDER[a.type as NotificationType] ?? 9;
      const ob = TYPE_ORDER[b.type as NotificationType] ?? 9;
      if (oa !== ob) return oa - ob;
      return new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime();
    });
  }, [list]);

  const groups = useMemo(() => {
    const out: { label: string; items: AppNotification[] }[] = [];
    for (const n of sorted) {
      const label = dayLabel(n.created_at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [sorted]);

  const openTask = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.task_id) navigate(`/?focus=${n.task_id}`);
  };

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
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-xs font-medium text-gray-400">{g.label}</p>
              <div className="space-y-2">
                {g.items.map((n) => {
                  const p = n.payload ?? {};
                  const meta = TYPE_META[n.type as NotificationType];
                  const isTimer = n.type === 'overdue' || n.type === 'deadline_reminder';
                  const ts = isTimer ? n.updated_at : n.created_at;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openTask(n)}
                      className={cn(
                        'w-full rounded-2xl border p-4 text-left transition-colors',
                        n.read ? 'bg-white' : 'bg-brand-soft ring-1 ring-brand/30',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn('h-2 w-2 shrink-0 rounded-full', meta?.dot ?? 'bg-gray-400')}
                        />
                        <span
                          className="min-w-0 flex-1 truncate font-semibold text-gray-900"
                          title={p.task_title}
                        >
                          {p.task_title ?? meta?.label ?? n.type}
                        </span>
                        <span
                          className="shrink-0 text-xs text-gray-400"
                          title={new Date(ts).toLocaleString('zh-CN')}
                        >
                          {isTimer
                            ? `更新于 ${formatDistanceToNow(new Date(ts))}`
                            : formatDistanceToNow(new Date(ts), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-3 pl-4">
                        <span className="text-sm text-gray-500">{buildDetail(n)}</span>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {meta?.label ?? n.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
