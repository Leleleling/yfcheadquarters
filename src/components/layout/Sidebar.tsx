import { NavLink } from 'react-router-dom';
import { LayoutGrid, MessagesSquare, Bell, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/cn';

const NAV_ITEMS = [
  { to: '/', label: '任务墙', icon: LayoutGrid, end: true },
  { to: '/chat', label: '聊天', icon: MessagesSquare },
  { to: '/notifications', label: '通知', icon: Bell },
  { to: '/settings', label: '个人设置', icon: Settings },
] as const;

export function Sidebar() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'L1_admin' || profile?.role === 'L0_super';

  const items = isAdmin
    ? [...NAV_ITEMS.slice(0, 3), { to: '/admin', label: '管理面板', icon: Shield }, ...NAV_ITEMS.slice(3)]
    : NAV_ITEMS;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-black/5 bg-white p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
          Y
        </div>
        <span className="text-base font-bold tracking-tight">YFC 任务台</span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 hover:bg-black/5 hover:text-brand',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-2 text-xs text-gray-400">v0.1 · YFC Headquarters</div>
    </aside>
  );
}
