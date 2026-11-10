import type { Profile } from '../types/database';

/** 私聊 key：两 uid 按字母序拼接，保证双向一致。 */
export function dmKey(a: string, b: string): string {
  return `dm:${[a, b].sort().join(':')}`;
}

export function groupKey(groupId: string): string {
  return `group:${groupId}`;
}

export const TOTAL_GROUP = 'group:all';
export const ADMIN_GROUP = 'group:admin';

export interface Conversation {
  key: string;
  label: string;
  kind: 'group' | 'dm';
}

/** 私聊权限：L3 仅同组；L2 本组+其他组长+管理员；L1/L0 所有人。 */
export function canDm(me: Profile, other: Profile): boolean {
  if (me.role === 'L1_admin' || me.role === 'L0_super') return true;
  if (me.role === 'L2_leader') {
    return (
      other.group_id === me.group_id ||
      other.role === 'L2_leader' ||
      other.role === 'L1_admin' ||
      other.role === 'L0_super'
    );
  }
  return other.group_id === me.group_id;
}

export function buildConversations(me: Profile, all: Profile[]): Conversation[] {
  const list: Conversation[] = [{ key: TOTAL_GROUP, label: '总群（全员）', kind: 'group' }];

  if (me.role === 'L1_admin' || me.role === 'L0_super' || me.role === 'L2_leader') {
    list.push({ key: ADMIN_GROUP, label: '管理员群', kind: 'group' });
  }

  if (me.group_id) {
    const myGroup = all.find((p) => p.id === me.group_id);
    list.push({
      key: groupKey(me.group_id),
      label: myGroup ? `${myGroup.display_name} 组群` : '本组群',
      kind: 'group',
    });
  }

  all
    .filter((p) => p.id !== me.id && canDm(me, p))
    .forEach((other) => {
      list.push({ key: dmKey(me.id, other.id), label: other.display_name, kind: 'dm' });
    });

  return list;
}
