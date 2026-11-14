import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/queries/useTasks';
import { TaskCard } from '../components/task/TaskCard';
import { TaskCreateModal } from '../components/task/TaskCreateModal';
import { Button } from '../components/ui/Button';

export default function Admin() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useTasks();

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">管理面板</h2>
          <p className="text-sm text-gray-500">
            管理员 {profile?.display_name} · 可分配任意组的任务
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-5 w-5" />
          新建任务
        </Button>
      </div>

      {data?.tasks.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tasks.map((t) => (
            <TaskCard key={t.id} task={t} me={profile!} />
          ))}
        </div>
      ) : (
        <div className="tp-surface rounded-2xl border p-10 text-center text-gray-400">
          还没有任务，点击右上角新建
        </div>
      )}

      <TaskCreateModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
