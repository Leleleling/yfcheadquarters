import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/database';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">加载中…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
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
