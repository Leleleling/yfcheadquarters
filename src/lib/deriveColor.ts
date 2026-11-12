import type { Role } from '../types/database';

export type TaskColor = 'red' | 'blue' | 'green' | 'gray';

export interface DeriveColorInput {
  /** 任务表 target_user_id：指派给个人时有值 */
  targetUserId: string | null;
  /** 任务表 target_group_id：指派给组时有值 */
  targetGroupId: string | null;
  meId: string;
  myGroupId: string | null;
  myRole: Role;
}

/**
 * 纯函数：根据「任务与当前用户的指派关系」派生颜色。
 * 红=指派给我；蓝=本组组任务（我是组长，可完成）；绿=本组组任务（普通视角）；灰=其他任务。
 * 认领机制停用后不再参与颜色计算。
 */
export function deriveColor({
  targetUserId,
  targetGroupId,
  meId,
  myGroupId,
  myRole,
}: DeriveColorInput): TaskColor {
  if (targetUserId && targetUserId === meId) return 'red';
  if (targetGroupId && targetGroupId === myGroupId) {
    return myRole === 'L2_leader' ? 'blue' : 'green';
  }
  return 'gray';
}

export const COLOR_ORDER: Record<TaskColor, number> = {
  red: 0,
  blue: 1,
  green: 2,
  gray: 3,
};

export const COLOR_META: Record<TaskColor, { bar: string; label: string }> = {
  red: { bar: 'bg-[#E5484D]', label: '指派给我' },
  blue: { bar: 'bg-[#3B82F6]', label: '本组任务（组长可完成）' },
  green: { bar: 'bg-[#22C55E]', label: '本组任务' },
  gray: { bar: 'bg-[#9CA3AF]', label: '其他任务' },
};
