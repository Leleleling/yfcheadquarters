import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../lib/rbac';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { TASK_TYPE_OPTIONS, type Group, type Profile, type TaskType } from '../../types/database';
import { cn } from '../ui/cn';

type AssignMode = 'group' | 'user';

export function TaskCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('剪辑');
  const [deadline, setDeadline] = useState('');
  const [assignMode, setAssignMode] = useState<AssignMode>('group');
  const [targetGroup, setTargetGroup] = useState('');
  const [targetUser, setTargetUser] = useState('');
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

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const admin = isAdmin(profile);
  const myGroupId = profile?.group_id ?? null;
  // L2 组长仅限本组：组选项只剩本组，个人候选只剩本组成员
  const groupOptions = admin ? groups : groups.filter((g) => g.id === myGroupId);
  const userCandidates = admin ? profiles : profiles.filter((p) => p.group_id === myGroupId);

  async function handleSubmit() {
    if (!profile || !title.trim() || !deadline) return;
    if (assignMode === 'user' && !targetUser) {
      alert('请先选择要指派的人员');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        category: type,
        due_at: new Date(deadline).toISOString(),
        target_group_id: assignMode === 'group' ? (targetGroup ? targetGroup : null) : null,
        target_user_id: assignMode === 'user' ? (targetUser ? targetUser : null) : null,
        notes: notes.trim() || null,
        created_by: profile.id,
        status: 'todo',
        completed_at: null,
        min_claimants: 1,
        max_claimants: 1,
      });
      if (error) {
        alert('创建任务失败：' + error.message);
        return;
      }
      void qc.invalidateQueries({ queryKey: ['tasks'] });
      setTitle('');
      setNotes('');
      setDeadline('');
      setTargetGroup('');
      setTargetUser('');
      setAssignMode('group');
      onClose();
    } catch (e) {
      alert('创建任务失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass = 'tp-surface tp-border h-11 w-full border px-3 text-sm outline-none';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新建任务"
      subtitle={admin ? '可分配给全员 / 任意组' : '组长仅限本组'}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">任务标题</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="项目 / 视频名称" />
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
            <label className="mb-1 block text-sm font-medium text-gray-700">截止日期</label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">指派对象</label>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAssignMode('group');
                setTargetUser('');
              }}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm',
                assignMode === 'group' ? 'border-brand bg-brand-soft text-brand-deep' : 'border-black/10 text-gray-600'
              )}
            >
              指派给组
            </button>
            <button
              type="button"
              onClick={() => {
                setAssignMode('user');
                setTargetGroup('');
              }}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm',
                assignMode === 'user' ? 'border-brand bg-brand-soft text-brand-deep' : 'border-black/10 text-gray-600'
              )}
            >
              指派给个人
            </button>
          </div>
          {assignMode === 'group' ? (
            <select
              className={selectClass}
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
            >
              <option value="">全员（任意可认领）</option>
              {groupOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              className={selectClass}
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            >
              <option value="">请选择人员</option>
              {userCandidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">详细说明（notes）</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !deadline || (assignMode === 'user' && !targetUser)}
          >
            {submitting ? '创建中…' : '创建任务'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
