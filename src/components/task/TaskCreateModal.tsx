import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { TASK_TYPE_OPTIONS, type Group, type TaskType } from '../../types/database';
import { cn } from '../ui/cn';

export function TaskCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('剪辑');
  const [deadline, setDeadline] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').order('name');
      if (error) throw error;
      return data as Group[];
    },
  });

  async function handleSubmit() {
    if (!profile || !title.trim() || !deadline) return;
    setSubmitting(true);
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      type,
      due_at: new Date(deadline).toISOString(),
      target_group_id: targetGroup ? targetGroup : null,
      notes: notes.trim() || null,
      created_by: profile.id,
      status: 'todo',
      completed_at: null,
    });
    setSubmitting(false);
    if (error) {
      console.error('[task] 创建失败', error);
      return;
    }
    void qc.invalidateQueries({ queryKey: ['tasks'] });
    setTitle('');
    setNotes('');
    setDeadline('');
    setTargetGroup('');
    onClose();
  }

  const selectClass = 'tp-surface tp-border h-11 w-full border px-3 text-sm outline-none';

  return (
    <Modal open={open} onClose={onClose} title="新建任务" subtitle="管理员可分配给全员，组长仅限本组">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">任务标题</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="项目 / 视频名称"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">种类</label>
            <select
              className={selectClass}
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
            >
              {TASK_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">针对组</label>
            <select
              className={selectClass}
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              <option value="">全员（任意可认领）</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">截止日期</label>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">详细说明（notes）</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div className={cn('flex justify-end gap-2')}>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !deadline}>
            {submitting ? '创建中…' : '创建任务'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
