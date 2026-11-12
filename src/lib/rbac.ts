import type { Profile, TaskWithRelations } from '../types/database';

export function isAdmin(p: Profile | null | undefined): boolean {
  return p?.role === 'L1_admin' || p?.role === 'L0_super';
}

/**
 * 完成：与后端 complete_task 校验对齐。
 * 管理员可完成任意任务；指派给个人→被指派人；指派给组→该组组长；全员任务→仅管理员。
 */
export function canComplete(task: TaskWithRelations, me: Profile): boolean {
  if (isAdmin(me)) return true;
  if (task.target_user_id) return task.target_user_id === me.id;
  if (task.target_group_id) {
    return me.role === 'L2_leader' && me.group_id === task.target_group_id;
  }
  return false;
}

/**
 * 延期（我需要更多时间）：与后端 delay_task 校验对齐。
 * 仅「指派给个人」任务的被指派人本人可操作；管理员与其他角色均不可代点。
 */
export function canDelay(task: TaskWithRelations, me: Profile): boolean {
  return !!task.target_user_id && task.target_user_id === me.id;
}

/**
 * 认领：功能已停用（UI 不再渲染认领按钮），规则保留在此以便日后恢复。
 * 恢复方法见 git 历史提交 c874470 的 TaskCard 按钮区。
 */
export function canClaim(task: TaskWithRelations, me: Profile): boolean {
  if (isAdmin(me)) return true;
  if (task.claimantIds.includes(me.id)) return false;
  if (task.target_user_id && task.target_user_id !== me.id) return false;
  if (task.target_group_id === null) return true;
  return task.target_group_id === me.group_id;
}

/** 建任务：管理员可建任意；组长仅可建本组任务。 */
export function canCreateForGroup(targetGroupId: string | null, me: Profile): boolean {
  if (isAdmin(me)) return true;
  if (me.role === 'L2_leader') return targetGroupId === me.group_id;
  return false;
}
