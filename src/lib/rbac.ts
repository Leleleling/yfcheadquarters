import type { Profile, TaskWithRelations } from '../types/database';

export function isAdmin(p: Profile | null | undefined): boolean {
  return p?.role === 'L1_admin' || p?.role === 'L0_super';
}

/** 认领：管理员可认领任意任务；指名给某个人时仅本人可认领；否则按组可见性。 */
export function canClaim(task: TaskWithRelations, me: Profile): boolean {
  if (isAdmin(me)) return true;
  if (task.claimantIds.includes(me.id)) return false;
  if (task.target_user_id && task.target_user_id !== me.id) return false;
  if (task.target_group_id === null) return true;
  return task.target_group_id === me.group_id;
}

/** 完成/延期：认领者或管理员。 */
export function canComplete(task: TaskWithRelations, me: Profile): boolean {
  return isAdmin(me) || task.claimantIds.includes(me.id);
}

export function canDelay(task: TaskWithRelations, me: Profile): boolean {
  return canComplete(task, me);
}

/** 建任务：管理员可建任意；组长仅可建本组任务。 */
export function canCreateForGroup(targetGroupId: string | null, me: Profile): boolean {
  if (isAdmin(me)) return true;
  if (me.role === 'L2_leader') return targetGroupId === me.group_id;
  return false;
}
