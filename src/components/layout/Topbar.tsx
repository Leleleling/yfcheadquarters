import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { ROLE_LABEL } from '../../types/database';

const PAGE_TITLES: Record<string, string> = {
  '/': '任务墙',
  '/chat': '即时通讯',
  '/notifications': '通知',
  '/admin': '管理面板',
  '/settings': '个人设置',
};

export function Topbar() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'YFC 任务台';

  async function handleLogout() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/5 bg-white px-6">
      <h1 className="text-lg font-bold tracking-tight text-gray-900">{title}</h1>
      {profile && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              {profile.display_name}
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-deep">
                {ROLE_LABEL[profile.role]}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
              {profile.talents?.map((t) => (
                <span key={t}>{t}</span>
              ))}
              {!profile.talents?.length && <span>暂无天赋贴纸</span>}
            </div>
          </div>
          <UserAvatar user={profile} size={40} />
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-black/5 hover:text-brand"
            aria-label="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      )}
    </header>
  );
}
