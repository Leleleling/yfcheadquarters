# m04 — ClickUp 证据化调研

> 证据源：ClickUp Help《Manage Custom Role permissions》《Use Automation Actions》及公开检索。
> 结论：自定义字段与自动化很强，评论可 emoji react；但 granular permissions 配置复杂度被评测者认为对小团队过重，且无专门「完成任务」权限开关。

---

## 1. 自定义角色权限（粒度与缺口）

- **[观察]** 计划要求：Business Plus 仅 **1 个**自定义角色；Enterprise/Max **无限**自定义角色。
  > 原文：「One custom role is available on our Business Plus Plan.」「Unlimited custom role permissions are available on our Enterprise and Max Plans.」
- **[观察]** 粒度以「工作区角色 → 功能开关」为主，**非**单个任务/空间/列表单独设权。
- **[观察]** 仅「删除物品（Delete Items）」可通过「Only if created」限制到物品级（含任务/列表/空间）。
- **[观察]** ⚠️ **无专门控制「完成任务 / 关闭任务」的自定义权限开关**；相关权限仅 `Edit Statuses`（管理状态定义，非改单任务状态）、`Delete Items`。
  > 原文未提供对 complete/close task 动作的剥夺或授予。
- **[观察]** 默认仅 Workspace owner 可创建自定义角色；可下放给 custom admins。权限项 20+，手动配置有一定繁琐度。

## 2. 自动化

- **[观察]** 原生自动化：触发（Triggers）+ 条件 + 动作（Actions）。
- **[观察]** 公开检索确认常见 recipe：到期前提醒、状态变更→通知负责人、due date 变更→通知。
  > 例：「When a due date shifts, notify …」「When a task is marked Blocked, notify the project owner」
- **[推断]** 可覆盖「我需要更多时间 +3 天 + 通知 admin」「完成→通知」等链路，但按钮级权限仍弱。

## 3. 动态颜色派生 —— [观察] 不支持

- **[观察]** 条件着色基于单元格值/状态，**不基于查看者身份**。

## 4. 表情回应

- **[观察]** 任务内评论区支持 emoji react（公开检索与产品常识确认）。
- **[推断]** 可满足「对已完成任务表情鼓励」，但非独立轻量 emoji picker 层。

## 5. 用户级时间状态 / 天赋贴纸

- **[未知]** 无原生四档时间状态。
- **[推断]** 可用 custom field 模拟，但非用户级默认属性，显示在名旁不原生。

## 6. 适配判断

- **[推断]** 本项目只需两种角色 + 一条「被针对才能操作」规则，在 ClickUp 里反而要穿过大量权限层级才能落地，对小型内容团队**过重**。
- **[推断]** 若一级缺口（动态派生 + 按钮隔离）不可妥协，ClickUp 自定义成本不比自建低。

---

### 出处
- https://help.clickup.com/hc/en-us/articles/6310020641175-Custom-Roles-overview
- https://help.clickup.com/hc/en-us/articles/6312097314199 （Use Automation Actions）
- （检索确认）ClickUp 自动化/到期提醒/评论 reaction 公开资料
