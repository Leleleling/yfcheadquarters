import type { Profile } from '../types/database';

export type TaskColor = 'red' | 'blue' | 'green' | 'gray';

export interface DeriveColorInput {
  claimantIds: string[];
  meId: string;
  claimantGroupIds: string[];
  myGroupId: string | null;
}

/**
 * 纯函数：根据「当前用户与任务认领者的关系」派生颜色。
 * 红=仅我认领；蓝=我认领且多人合作；绿=同组他人认领；灰=无关。
 */
export function deriveColor({
  claimantIds,
  meId,
  claimantGroupIds,
  myGroupId,
}: DeriveColorInput): TaskColor {
  const iAmClaimant = claimantIds.includes(meId);
  if (iAmClaimant) {
    return claimantIds.length > 1 ? 'blue' : 'red';
  }
  const sameGroup = claimantGroupIds.some((g) => !!g && g === myGroupId);
  return sameGroup ? 'green' : 'gray';
}

export const COLOR_ORDER: Record<TaskColor, number> = {
  red: 0,
  blue: 1,
  green: 2,
  gray: 3,
};

export const COLOR_META: Record<TaskColor, { bar: string; label: string }> = {
  red: { bar: 'bg-[#E5484D]', label: '我的任务' },
  blue: { bar: 'bg-[#3B82F6]', label: '合作任务' },
  green: { bar: 'bg-[#22C55E]', label: '组内任务' },
  gray: { bar: 'bg-[#9CA3AF]', label: '其他任务' },
};

/** 由认领者档案推算其 group_id 列表，供颜色派生使用。 */
export function claimantGroupIds(claimants: Profile[]): string[] {
  return claimants.map((c) => c.group_id ?? '').filter(Boolean);
}
