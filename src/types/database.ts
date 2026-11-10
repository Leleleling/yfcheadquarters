// 领域类型定义：与 Supabase 已部署的表结构对齐。
// 后端已 100% 部署（Auth / RLS / RPC / Storage / profiles.email）。

export type Role = 'L0_super' | 'L1_admin' | 'L2_leader' | 'L3_member';

export type TimeStatus = '特别忙' | '比较忙' | '有时间' | '空闲';

export type TaskType = '剪辑' | '配音' | '脚本' | '审核';

export type TaskStatus = 'todo' | 'completed';

export type MessageType = 'text' | 'emoji' | 'voice' | 'file';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  group_id: string | null;
  time_status: TimeStatus | null;
  talents: string[] | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  deadline: string;
  status: TaskStatus;
  completed_at: string | null;
  target_group_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface TaskClaimant {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  task_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  type: string;
  task_id: string | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_key: string;
  sender_id: string;
  content: string | null;
  type: MessageType;
  media_url: string | null;
  created_at: string;
}

// 任务墙查询后在前端组装的聚合结构
export interface TaskWithRelations extends Task {
  claimantIds: string[];
  claimants: Profile[];
  reactions: Reaction[];
}

export const ROLE_LABEL: Record<Role, string> = {
  L0_super: '超级管理员',
  L1_admin: '管理员',
  L2_leader: '组长',
  L3_member: '组员',
};

export const TIME_STATUS_COLOR: Record<TimeStatus, string> = {
  特别忙: '#E5484D',
  比较忙: '#F5A623',
  有时间: '#22C55E',
  空闲: '#3B82F6',
};

export const TASK_TYPE_OPTIONS: TaskType[] = ['剪辑', '配音', '脚本', '审核'];

export const TIME_STATUS_OPTIONS: TimeStatus[] = ['特别忙', '比较忙', '有时间', '空闲'];

export const TALENT_OPTIONS: string[] = [
  '🎬',
  '🎙️',
  '✍️',
  '🔍',
  '💡',
  '🛠️',
  '⚡',
  '🔥',
  '🌟',
  '🧠',
];
