# 02 — 数据模型（Supabase / Postgres）

> 表结构草案，用于承载 `01-requirements.md` 的字段与关系。所有表开启 RLS（策略见 `03-access-control.md`）。
> 颜色**不建列**，由前端按查看者派生（见 `04-dynamic-display.md`）。

---

## `profiles`（用户档案，= auth.users 扩展）

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid (PK, = auth.users.id) | 用户唯一标识 |
| display_name | text | 管理员设定的展示名（登录时选的名字） |
| role | text | `'admin'` / `'worker'` |
| time_status | text | `'特别忙'` / `'比较忙'` / `'有时间'` / `'空闲'`（可空） |
| talents | text[] | 天赋贴纸 id / 标签数组 |
| created_by | uuid | 创建该用户的管理员（FK → profiles.id） |

## `groups`（分组）

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid (PK) | 组标识 |
| name | text | 组名 |

## `group_members`（用户-组 多对多）

| 列 | 类型 | 说明 |
|---|---|---|
| group_id | uuid (FK) | 组 |
| user_id | uuid (FK) | 用户 |

## `tasks`（任务，7 字段落点）

| 列 | 类型 | 对应需求 | 说明 |
|---|---|---|---|
| id | uuid (PK) | — | 任务标识 |
| title | text | b.6 | 项目 / 视频名称 |
| type | text | b.5 | `'剪辑'` / `'配音'` / `'脚本'` / `'审核'` |
| deadline | timestamptz | b.2 | 截止日期 |
| status | text | b.1 | `'todo'` / `'completed'` |
| target_user_ids | uuid[] | b.3 | 针对的用户（可多个） |
| target_group_ids | uuid[] | b.3 | 针对的组（可多个） |
| notes | text | b.7 | 详细介绍 |
| created_by | uuid (FK) | — | 创建任务的管理员 |
| completed_at | timestamptz (nullable) | e.1 | 完成时间，用于 N 天窗口计算 |
| created_at | timestamptz | — | 创建时间 |

> **颜色不在此表**：由 `deriveColor(viewer, task)` 在渲染时计算。

## `reactions`（已完成任务的表情鼓励）

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid (PK) | — |
| task_id | uuid (FK → tasks.id) | 被鼓励的任务（须 status='completed'） |
| user_id | uuid (FK) | 回应者 |
| emoji | text | 表情 |
| created_at | timestamptz | — |

唯一约束建议：`(task_id, user_id, emoji)`，支持用户切换 / 取消同一表情。

## `notifications`（通知）

| 列 | 类型 | 说明 |
|---|---|---|
| id | uuid (PK) | — |
| recipient_id | uuid (FK) | 接收者（profiles.id） |
| type | text | 见下 |
| task_id | uuid (FK, nullable) | 关联任务 |
| payload | jsonb | 附加信息（如旧/新截止日期、reaction emoji） |
| read | boolean | 是否已读 |
| created_at | timestamptz | — |

`type` 取值：`'assigned'`（新分配）、`'deadline_reminder'`（截止提醒）、`'deadline_changed'`（日期变更）、`'completed'`（已完成）、`'need_more_time'`（需要更多时间）、`'overdue'`（无回应/过期）、`'encouraged'`（被鼓励）。

---

## 关系图（文字版）

```
profiles 1──* group_members *──1 groups
profiles 1──* tasks (created_by)
profiles *──* tasks (target_user_ids[])
groups    *──* tasks (target_group_ids[])
tasks    1──* reactions
tasks    1──* notifications (task_id)
profiles 1──* notifications (recipient_id)
```
