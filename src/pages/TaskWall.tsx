import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks, sortTasks } from '../hooks/queries/useTasks';
import { isAdmin } from '../lib/rbac';
import { TaskCard } from '../components/task/TaskCard';
import { TaskCreateModal } from '../components/task/TaskCreateModal';
import { Button } from '../components/ui/Button';

export default function TaskWall() {
  const { profile } = useAuth();
  const { data, isLoading } = useTasks();
  const [createOpen, setCreateOpen] = useState(false);

  const sorted = useMemo(() => {
    if (!data?.tasks || !profile) return [];
    return sortTasks(data.tasks, profile.id, profile.group_id);
  }, [data, profile]);

  const canCreate = !!profile && (isAdmin(profile) || profile.role === 'L2_leader');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">任务墙</h2>
          <p className="text-sm text-gray-500">红=我的活 · 蓝=合作 · 绿=组内 · 灰=其他</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-5 w-5" />
            新建任务
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">加载任务中…</p>
      ) : sorted.length === 0 ? (
        <div className="tp-surface rounded-2xl border p-10 text-center text-gray-400">
          当前没有可显示的任务
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <TaskCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
