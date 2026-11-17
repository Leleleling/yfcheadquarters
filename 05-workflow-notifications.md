# 05 — 工作流与通知流（现行实现版）

> **2026-11 通知系统改造后的现行契约**。历史规划稿（`target_user_ids`、`deadline`、`completed`、延期自动 +3 天、仅通知 admin）
> 已与代码和后端实现不符，被本文替代；需要查阅早期规划请看 git 历史。
> 前端实现入口：`src/pages/Notifications.tsx`（文案/排序/跳转）、`src/components/task/TaskCard.tsx`（改截止弹窗）、
> `src/hooks/queries/useTaskActions.ts`（RPC 调用）、`src/lib/rbac.ts`（canChangeDeadline）。
> 后端契约：Supabase RPC + 触发器 + pg_cron（见第 2、3 节），通知统一写入 `notifications` 表。

---

## 一、领域字段（现行，对齐 `src/types/database.ts`）

- 角色：`L0_super` / `L1_admin`（两者统称管理员）/ `L2_leader`（组长）/ `L3_member`（组员）。
- 任务：`status ∈ {open, done}`；截止字段为 `due_at`；指派为单值 `target_user_id`（个人）或 `target_group_id`（组），二者皆空 = 全员任务；创建者 = `created_by`（历史上未被前端使用，现主要服务于通知路由）。
- 「负责人」= 个人任务的 `target_user_id`；组任务/全员任务无个人负责人。
- 「相关组长」= 负责人所在组的 `L2_leader`。

## 二、动作 → 通知 契约（7 类，type 值即契约）

| # | type | 触发与写入方 | 接收人（去重、不含操作人自己） | payload 关键字段 |
|---|---|---|---|---|
| 1 | `assigned` | 建任务 RPC/触发器 | 负责人（=创建者时不发） | actor_*, task_title, due_at |
| 2 | `completed` | `complete_task` RPC | 创建者 + 负责人的相关组长 | actor_*, owner_*, task_title |
| 3 | `encouraged` | `reactions` INSERT 触发器 | 负责人（自发不通知） | actor_*, task_title, emoji[, people_count/times_count] |
| 4 | `need_more_time` | `delay_task` RPC（**不再自动改期**） | 创建者 + 负责人的相关组长 | actor_*, owner_*, task_title |
| 5 | `deadline_changed` | `change_deadline` RPC（新） | 负责人（=操作人时不发） | actor_*, task_title, old_due_at, new_due_at |
| 6 | `overdue` | pg_cron（每 15 分钟 upsert） | 负责人 + 创建者 + 相关组长 | task_title, overdue_text |
| 7 | `deadline_reminder` | pg_cron（每 15 分钟 upsert） | 同上 | task_title, remain_text |

规则要点：
- `overdue` / `deadline_reminder` **每任务全局仅一条**，在原记录上更新 `updated_at` 与文本（≥1 天显示"n 天"，<1 天显示"X 小时"；提醒同理分钟/小时），任务完成后不再更新。
- 写权限：通知仅由 SECURITY DEFINER 函数/触发器插入；`authenticated` 只能 SELECT/UPDATE（read）本人行。
- `delay_task` 语义已变更：只表达"申请人希望延期"，**新截止日期由管理员/组长通过 `change_deadline` 手动设定**，形成 4→5 的闭环。
- 权限矩阵（前端 rbac 与后端 RPC 双向对齐）：完成 = 管理员任意 / 个人任务被指派人 / 组任务本组组长；延期 = 仅个人任务被指派人本人；改截止 = 管理员任意 open / 组长本组组任务。

## 三、通知页展示逻辑（`Notifications.tsx`）

1. **两行卡片**：第一行 = 任务标题（粗体）+ 类型色点 + 时间；第二行 = 关系小字（不重复任务名）+ 类型标签。
2. **小字模板**：assigned「{操作人} 指派给你 · 截止…」／completed「{操作人} 完成了 {负责人} 的任务」／encouraged「{操作人} 给你点了 👍（等 N 人 / ×M）」／need_more_time「{操作人} 申请了更多时间，请调整截止日期」／deadline_changed「截止时间已调整：旧 → 新（操作人）」／overdue「已逾期…」／deadline_reminder「还有…到期」。
   接收人视角下涉及自己时渲染为「你」。
3. **排序**：未读块 → 类型权重（overdue > deadline_reminder > assigned/deadline_changed > need_more_time > completed > encouraged）→ `updated_at`（计时类）或 `created_at` 新者优先。
4. **分组**：按天（今天/昨天/更早）。计时类时间显示「更新于 X 前」，悬停出绝对时间。
5. **交互**：点击通知 = 标记已读 + 跳转 `/?focus=<taskId>`；任务墙收到 focus 参数后清空搜索/种类/范围筛选，滚动定位到卡片（id 锚点 `task-card-<id>`）并高亮闪烁 3 秒，随后清理 URL。

## 四、N 天展示窗口（保留）

- 主视图隐藏完成超 5 天的任务；豁免：任务墙范围筛选选「已完成的全部」「未完成的全部」时不隐藏。
