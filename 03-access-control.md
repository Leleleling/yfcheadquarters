# 03 — 访问控制与行级权限（RLS）

> 核心原则：**前端隐藏按钮只是体验，RLS 才是底线**。即使有人绕过 UI，数据库也只允许「被针对者」改状态。
> 角色来源：`profiles.role`（`'admin'` / `'worker'`）。本期身份见 `06-tech-constraints.md`。

---

## 角色能力矩阵

| 动作 | admin | worker（被针对） | worker（未被针对） |
|---|---|---|---|
| 创建任务 | ✅ | ❌ | ❌ |
| 编辑任务字段（标题/种类/对象/notes） | ✅ | ❌ | ❌ |
| 调整截止日期 | ✅（任意） | ❌ | ❌ |
| 点「完成」 | ✅ | ✅（仅限自己被针对的任务） | ❌（按钮隐藏） |
| 点「我需要更多时间」(+3天) | ✅ | ✅（仅限自己被针对的任务） | ❌（按钮隐藏） |
| 设自己的时间状态 / 天赋 | ❌（不是自己） | ✅（仅自己） | ✅（仅自己） |
| 对已完成任务表情鼓励 | ✅ | ✅ | ✅ |
| 查看任务墙 | ✅ | ✅ | ✅ |

---

## RLS 策略要点（Postgres / Supabase）

### `profiles`
- **读**：所有已登录用户可读（需展示名字 / 时间状态 / 天赋）。
- **写**：仅 admin 可 INSERT（创建用户/分组）；用户只能 UPDATE 自己的 `time_status` / `talents`。

### `tasks`
- **INSERT**：`auth.uid()` 对应的 `role = 'admin'`。
- **SELECT**：所有已登录用户可读（任务墙对所有人生效，颜色靠前端派生区分）。
- **UPDATE（status / completed_at）**：`role='admin'` **或** `auth.uid() = ANY(target_user_ids)`。
- **UPDATE（deadline）**：仅 `role='admin'`（「我需要更多时间」的 +3 天由有权限的 worker 触发，但落库的 deadline 改写仍须受控——可由 Edge Function 在校验「触发者是 target_user」后执行，避免 worker 直接任意改日期）。
- **UPDATE（其他字段）**：仅 `role='admin'`。

### `reactions`
- **INSERT**：任何已登录用户，但任务须 `status='completed'`（用子查询校验）。
- **SELECT**：所有已登录可读。
- 可选：限制「只能给自己没反应过的 emoji 增删」，由唯一约束 + UPSERT 实现。

### `notifications`
- **SELECT**：仅 `recipient_id = auth.uid()`。
- **INSERT**：由系统（Edge Function / 触发器）写入，不开放客户端直写。

---

## 为什么不能只靠「前端隐藏按钮」

需求要求「按钮只对针对者可见」，但前端隐藏可被绕过（改请求 / 直接调 API）。因此：
1. UI 层按 `deriveColor` / `isTargeted(viewer, task)` 隐藏按钮（体验）。
2. 数据库层用 RLS 强制「只有 target_user 或 admin 能改状态」（安全底线）。

这与前期调研结论一致：现成工具的「按钮级可见性隔离」是缺口，而自建 RLS 能原生补齐（见 `06-tech-constraints.md`）。
