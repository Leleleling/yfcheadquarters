# m03 — Notion 证据化调研

> 证据源：Notion Help《Database buttons》及公开文档检索。
> 结论：字段灵活性最高，但自动化深度、权限粒度、表情回应均偏弱，不适合作为该系统的最终运行时。

---

## 1. 数据库按钮（关键缺口）

- **[观察]** 谁可创建/编辑按钮：拥有数据库 `Full access` 或 `Can edit` 权限者。
- **[观察]** ⚠️ **谁可点击按钮**：拥有 `Full access`、`Can edit` 或 `Can edit content` 权限者**均可点击**。
  > 原文：「If someone has Full access, Can edit, or Can edit content permissions in a database, they can click database buttons.」
- **[推断]** 这意味着只要有人能编辑内容，就能点**任意**按钮（含「完成」「我需要更多时间」），**无按人/按针对关系的按钮可见性隔离**。本项目最难满足的点之一。

## 2. 按钮可触发的动作

- **[观察]** 动作含：`Edit property`（改属性）、`Add page to` / `Edit pages in`、`Send notification to`、`Send mail to`（付费）、`Send webhook`（付费）、`Show confirmation`、`Open page or URL`、`Send Slack notification to`（Plus/Business/Enterprise）、`Define variables`。
- **[观察]** ✅ `Send notification to` 可发给「工作区内最多 20 人」或「数据库中某 People 属性关联的人」。
  > 原文：「Your recipient can be up to 20 people in your workspace, or people who are associated with a certain People property in your database.」
- **[观察]** ⚠️ **通知收件人上限 20 人/次** —— 稍大团队不适合。

## 3. 动态颜色派生 —— [观察] 不支持

- **[观察]** 条件格式/着色基于字段值或公式，**不基于查看者身份**。无法让同一行因人而异换色。
- **[推断]** 可用 formula 拼出显示文本（如状态 emoji），但仍非「按查看者动态派生」。

## 4. 自动化（数据库规则）

- **[观察]** Notion 提供「数据库规则/automations」：状态变更时发通知、日期临近时提醒等（公开文档检索确认）。
- **[推断]** 能力可覆盖「完成→通知 admin」「到期前提醒」，但深度与 monday 的 recipe 体系相比有限。

## 5. 表情回应

- **[观察]** 页面/评论有 emoji，但**对数据库条目（已完成任务）的轻量 emoji reaction 不是原生交互**。

## 6. 用户级时间状态 / 天赋贴纸

- **[未知]** 无原生四档时间状态。
- **[推断]** 可在用户 Profile 加 select/multi-select 存时间状态/天赋，但「全局显示在任务上」需手工关联。

## 7. 适配判断

- **[推断]** Notion 适合作为原型或内部约定文档载体，**不适合作为本系统的最终运行时**（权限粒度、按钮隔离、表情回应三处均不满足）。

---

### 出处
- https://www.notion.com/help/database-buttons
- （检索确认）Notion 数据库规则/automations 公开文档
