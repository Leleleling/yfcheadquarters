import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types/database';
import { UserAvatar } from '../components/common/UserAvatar';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ROLE_LABEL } from '../types/database';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [selected, setSelected] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  async function handleSubmit() {
    if (!selected) return;
    if (!/^[A-Za-z0-9]{6}$/.test(pin)) {
      setError('请输入 6 位字母或数字 PIN 码');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signIn(selected.email, pin);
      navigate('/');
    } catch {
      setError('PIN 错误，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
          Y
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">YFC 任务台</h1>
        <p className="mt-1 text-sm text-gray-500">选择你的名字，输入 PIN 登录</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">加载人员名单…</p>
      ) : (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelected(p);
                setPin('');
                setError('');
              }}
              className="tp-surface flex items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-brand/40 hover:bg-brand/5"
            >
              <UserAvatar user={p} size={40} />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{p.display_name}</div>
                <div className="text-xs text-gray-500">{ROLE_LABEL[p.role]}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`登录为 ${selected?.display_name ?? ''}`}
        subtitle="请输入 6 位 PIN 码"
      >
        <Input
          autoFocus
          maxLength={6}
          placeholder="••••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="text-center text-2xl tracking-[0.5em]"
        />
        {error && <p className="mt-2 text-sm text-brand">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSelected(null)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '登录中…' : '登录'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
