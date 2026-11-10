import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  TIME_STATUS_OPTIONS,
  TALENT_OPTIONS,
  type TimeStatus,
} from '../types/database';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/cn';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<TimeStatus | null>(profile?.time_status ?? null);
  const [talents, setTalents] = useState<string[]>(profile?.talents ?? []);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  function toggleTalent(t: string) {
    setTalents((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ time_status: status, talents })
      .eq('id', profile!.id);
    setSaving(false);
    if (error) {
      console.error('[settings] 保存失败', error);
      return;
    }
    qc.invalidateQueries({ queryKey: ['profiles'] });
    await refreshProfile();
  }

  const selectClass = 'tp-surface tp-border h-11 w-full border px-3 text-sm outline-none';

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-5 text-xl font-bold text-gray-900">个人设置</h2>

      <div className="tp-surface space-y-6 rounded-2xl border p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">姓名</label>
          <div className="text-base font-semibold text-gray-900">{profile.display_name}</div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">时间状态</label>
          <select
            className={selectClass}
            value={status ?? ''}
            onChange={(e) => setStatus((e.target.value || null) as TimeStatus | null)}
          >
            <option value="">未设置</option>
            {TIME_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">天赋贴纸</label>
          <div className="flex flex-wrap gap-2">
            {TALENT_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTalent(t)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all',
                  talents.includes(t)
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-black/5 hover:bg-black/10',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
}
