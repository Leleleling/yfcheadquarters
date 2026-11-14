export type TaskColor = 'red' | 'blue' | 'green' | 'gray';

export interface DeriveColorInput {
  /** 任务表 target_user_id：指派给个人时有值 */
  targetUserId: string | null;
  /** 任务表 target_group_id：指派给组时有值 */
  targetGroupId: string | null;
  /** 被指派个人所在组 id（由 profiles 关联得到）；仅指派给个人时有意义 */
  targetUserGroupId: string | null;
  meId: string;
  myGroupId: string | null;
}

/**
 * 纯函数：根据「任务与当前用户的指派关系」派生颜色。
 * 红=指派给我；蓝=集体任务（全员任务，或指派给我所在组的组任务）；
 * 绿=组内同事的任务（指派给本组他人的个人任务）；灰=其他组的任务。
 * 认领机制停用后不再参与颜色计算；所有任务对所有人可见，颜色只表达与我的关系。
 */
export function deriveColor({
  targetUserId,
  targetGroupId,
  targetUserGroupId,
  meId,
  myGroupId,
}: DeriveColorInput): TaskColor {
  if (targetUserId && targetUserId === meId) return 'red';
  if (!targetUserId && !targetGroupId) return 'blue';
  if (!!myGroupId && targetGroupId === myGroupId) return 'blue';
  if (!!myGroupId && !!targetUserId && targetUserGroupId === myGroupId) return 'green';
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
  blue: { bar: 'bg-[#3B82F6]', label: '集体任务（全员/本组）' },
  green: { bar: 'bg-[#22C55E]', label: '组内同事的任务' },
  gray: { bar: 'bg-[#9CA3AF]', label: '其他组的任务' },
};
