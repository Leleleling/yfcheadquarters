import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/database';
import { isAdmin } from '../lib/rbac';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, profile, loading, refreshProfile } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">加载中…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) {
    // 已登录但档案加载失败：不放行页面，避免下游空值崩溃；提供重试与重新加载。
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-gray-500">
        <p className="text-base font-medium">用户信息加载失败</p>
        <p className="text-sm text-gray-400">可能是网络波动，可先重试；若仍失败请重新加载页面。</p>
        <div className="flex gap-3">
          <button
            onClick={() => void refreshProfile()}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-black/5"
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">加载中…</div>;
  }
  if (!profile || (profile.role !== role && profile.role !== 'L0_super')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/** 管理员路由守卫：L1_admin 与 L0_super 均可访问（统一走 isAdmin）。 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">加载中…</div>;
  }
  if (!profile || !isAdmin(profile)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
