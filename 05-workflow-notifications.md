# 05 — 工作流与通知流

> 把 `01-requirements.md` 的 e/f/g 落成「动作 → 状态变更 → 通知」的明确链路。
> 通知通过 `notifications` 表（见 `02-data-model.md`）+ 客户端实时订阅实现。

---

## 一、关键动作链路

### 1. 创建任务（admin）
- `tasks` INSERT，`created_by = admin.id`，`status='todo'`。
- 对每个 `target_user_ids` 成员发 `type='assigned'` 通知。

### 2. 截止日期提醒
- 由定时任务（Supabase Cron / Edge Function，每日扫 `deadline`）在到期前 N 天触发。
- 向 `target_user_ids` 发 `type='deadline_reminder'`。

### 3. 「我需要更多时间」（被针对 worker 或 admin）
- 校验触发者 ∈ `target_user_ids` 或 `role='admin'`（RLS 兜底）。
- `deadline += 3 天`（默认），`status` 保持 `todo`。
- 向 admin 发 `type='need_more_time'`（payload 含新截止日期）。
- **admin 可随后任意调整 deadline**（写权限仅 admin），调整后向原 target 发 `type='deadline_changed'`。

### 4. 「完成」（被针对 worker 或 admin）
- `status='completed'`，`completed_at = now()`。
- 向 admin 发 `type='completed'`。

### 5. 无回应 / 过期（admin 视角）
- 若 `deadline` 已过且仍为 `todo`，可标记 `type='overdue'` 通知 admin（对应需求 g.2 的「无回应」）。
- 可由定时任务或 admin 手动查看得出。

### 6. 已完成任务的表情鼓励
- 窗口期内任意用户对 `status='completed'` 任务 `reactions` INSERT（emoji）。
- 向该任务 `target_user_ids`（被鼓励的人）发 `type='encouraged'`（payload 含 emoji 与回应者）。

---

## 二、N 天展示窗口（需求 e.1）

- 入窗条件：`status='completed'` 且 `completed_at > now() - N`（N 默认建议 3–7 天，建议作为配置项）。
- 实现：任务墙查询加 `WHERE status='todo' OR (status='completed' AND completed_at > now() - N)`。
- 窗口过期后：不在主视图返回（非硬删除，数据保留，可进「历史 / 归档」视图）。

---

## 三、通知收件箱映射（需求 g）

| 接收方 | 通知 type | 触发 |
|---|---|---|
| admin | `assigned`（反向：谁被分了什么，可选） | 任务创建 |
| admin | `completed` | 被针对者完成 |
| admin | `need_more_time` | 被针对者延期 |
| admin | `overdue` | 过期未响应 |
| worker | `assigned` | 自己被新分配 |
| worker | `deadline_reminder` | 到期前 N 天 |
| worker | `deadline_changed` | admin 改了日期 |
| worker（被针对者） | `encouraged` | 别人对其已完成任务表情鼓励 |

> 本期通知走应用内 `notifications` 表 + 实时订阅；不强求独立收件箱页面，也不强求 IM 推送（如需可后续接 Supabase + 飞书/邮件，但不在本期范围）。
