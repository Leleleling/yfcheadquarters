import { useMemo } from 'react';
import { deriveColor, COLOR_META } from '../../lib/deriveColor';
import { canComplete, canDelay } from '../../lib/rbac';
import { useCompleteTask, useDelayTask } from '../../hooks/queries/useTaskActions';
import { UserAvatar } from '../common/UserAvatar';
import { ReactionBar } from './ReactionBar';
import { renderSimpleMarkdown } from '../../lib/markdown';
import { daysOverdue, formatDateTime } from '../../lib/format';
import { cn } from '../ui/cn';
import type { Profile, TaskWithRelations } from '../../types/database';

export function TaskCard({
  task,
  me,
  pinned,
  onTogglePin,
}: {
  task: TaskWithRelations;
  me: Profile;
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  const color = useMemo(
    () =>
      deriveColor({
        targetUserId: task.target_user_id,
        targetGroupId: task.target_group_id,
        targetUserGroupId: task.targetUser?.group_id ?? null,
        meId: me.id,
        myGroupId: me.group_id,
        myRole: me.role,
      }),
    [task, me],
  );

  const isOverdue = task.status !== 'done' && new Date(task.due_at).getTime() < Date.now();
  const overdueDays = daysOverdue(task.due_at);

  const complete = useCompleteTask();
  const delay = useDelayTask();

  const canCompleteTask = canComplete(task, me);
  const canDelayTask = canDelay(task, me);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm',
        task.status === 'done' && 'opacity-70',
      )}
    >
      <span
        className={cn('absolute left-0 top-4 h-[calc(100%-2rem)] w-1.5 rounded-full', COLOR_META[color].bar)}
      />
      <div className="mb-2 flex items-start gap-2 pl-2">
        <button
          type="button"
          onClick={onTogglePin}
          className={cn(
            'mt-0.5 text-lg leading-none',
            pinned ? 'text-brand' : 'text-gray-300 hover:text-gray-400',
          )}
          aria-label="置顶任务"
        >
          📌
        </button>
        <h3
          className="min-w-0 flex-1 truncate text-base font-semibold text-gray-800"
          title={task.title}
        >
          {task.title}
        </h3>
        <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-gray-500">
          {task.category}
        </span>
      </div>

      <div className="mb-2 pl-2 text-xs text-gray-500">
        <div>
          截止：{formatDateTime(task.due_at)}
          {isOverdue && (
            <span className="ml-1 font-medium text-red-500">
              已逾期{overdueDays > 0 ? ` ${overdueDays} 天` : ''}
            </span>
          )}
        </div>
        {task.targetUser && <div>指派给 {task.targetUser.display_name}</div>}
        {task.target_group_id === null && task.target_user_id === null && (
          <div className="text-gray-400">· 全员可见</div>
        )}
      </div>

      {task.notes && (
        <div className="mb-3 line-clamp-3 pl-2 text-sm text-gray-500">
          {renderSimpleMarkdown(task.notes)}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 pl-2">
        <div className="flex -space-x-2">
          {task.claimants.length === 0 ? (
            <span className="text-xs text-gray-400">暂无认领者</span>
          ) : (
            task.claimants.map((c) => (
              <UserAvatar key={c.id} user={c} size={28} className="ring-2 ring-white" />
            ))
          )}
        </div>
        {task.claimants[0]?.talents?.length ? (
          <span className="text-xs text-gray-400">{task.claimants[0].talents.join(' ')}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
        {canCompleteTask && task.status !== 'done' && (
          <button
            onClick={() => complete.mutate(task.id)}
            disabled={complete.isPending}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            完成
          </button>
        )}
        {canDelayTask && task.status !== 'done' && (
          <button
            onClick={() => delay.mutate(task.id)}
            disabled={delay.isPending}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            我需要更多时间
          </button>
        )}
        {task.status === 'done' && <span className="text-xs text-emerald-600">已完成</span>}
      </div>

      <ReactionBar task={task} />
    </div>
  );
}
