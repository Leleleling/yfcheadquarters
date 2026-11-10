import { useNavigate } from 'react-router-dom';
import { Clock, UserPlus, Check, Hourglass, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deriveColor, COLOR_META } from '../../lib/deriveColor';
import { canClaim, canComplete } from '../../lib/rbac';
import { UserAvatar } from '../common/UserAvatar';
import { Button } from '../ui/Button';
import { ReactionBar } from './ReactionBar';
import { useClaimTask, useCompleteTask, useDelayTask } from '../../hooks/queries/useTaskActions';
import type { TaskWithRelations, TaskType } from '../../types/database';

const TYPE_BADGE: Record<TaskType, string> = {
  剪辑: 'bg-purple-100 text-purple-700',
  配音: 'bg-sky-100 text-sky-700',
  脚本: 'bg-amber-100 text-amber-700',
  审核: 'bg-emerald-100 text-emerald-700',
};

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskCard({ task }: { task: TaskWithRelations }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const claim = useClaimTask();
  const complete = useCompleteTask();
  const delay = useDelayTask();

  if (!profile) return null;

  const color = deriveColor({
    claimantIds: task.claimantIds,
    meId: profile.id,
    claimantGroupIds: task.claimants.map((c) => c.group_id ?? '').filter(Boolean),
    myGroupId: profile.group_id,
  });
  const meta = COLOR_META[color];
  const isOverdue = task.status === 'todo' && new Date(task.due_at).getTime() < Date.now();

  return (
    <div className="tp-surface overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-lift">
      <div className={`h-1.5 w-full ${meta.bar}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug text-gray-900">{task.title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[task.type]}`}>
            {task.type}
          </span>
        </div>

        {task.notes && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{task.notes}</p>}

        <div className="mt-3 flex items-center gap-2">
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

        <div className={`mt-3 flex items-center gap-1.5 text-sm ${isOverdue ? 'text-brand' : 'text-gray-500'}`}>
          <Clock className="h-4 w-4" />
          {formatDeadline(task.due_at)}
          {isOverdue && <span className="font-medium">· 已逾期</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canClaim(task, profile) && (
            <Button
              size="sm"
              variant="soft"
              disabled={claim.isPending}
              onClick={() => claim.mutate(task.id)}
            >
              <UserPlus className="h-4 w-4" />
              认领
            </Button>
          )}
          {canComplete(task, profile) && (
            <>
              <Button
                size="sm"
                disabled={complete.isPending}
                onClick={() => complete.mutate(task.id)}
              >
                <Check className="h-4 w-4" />
                完成
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={delay.isPending}
                onClick={() => delay.mutate(task.id)}
              >
                <Hourglass className="h-4 w-4" />
                需要更多时间
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/chat?forward=${task.id}`)}
          >
            <Share2 className="h-4 w-4" />
            转发
          </Button>
        </div>

        <ReactionBar task={task} />
      </div>
    </div>
  );
}
