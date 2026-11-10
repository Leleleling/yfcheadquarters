# m02 — monday.com 证据化调研

> 证据源：monday.com Support《Board permissions》《Alerts and Reminders with Automations》《The Updates Section》及 Developers API。
> 结论：协作手感（Updates + emoji reaction）最好，自动化成熟；但行级操作隔离是 board 级、动态派生颜色不支持。

---

## 1. 看板权限（行级隔离近似）

- **[观察]** 非所有者有 4 种权限集：Edit everything / Only edit content / Only edit assigned items / View and comment。
  > 原文：「Permission sets range from wide open to highly restrictive and apply to everyone except the board owners.」
- **[观察]** ✅ **Only edit assigned items**：非所有者只能查看整板，但只能编辑**分配给他们本人**的 item 与 subitem（按 People 列定义分配）。
  > 原文：「Non-owners can view the board and edit only items and subitems assigned to them. (Available on the Pro plan and above).」
  > 配置：「choose Only edit assigned items, then select Customize … pick the People Column that defines the assignment.」
- **[观察]** ⚠️ 该能力 **Pro 计划及以上**才可用；且「board owners 绕过 board 权限」。
- **[观察]** 本页未提供单列/单状态字段级独立人员限制；结构编辑权限只能整体开关。Enterprise 有更细角色（未展开）。
- **[观察]** 最严格规则优先：「account role, workspace role, and board permissions … The strictest rule applies.」

## 2. 动态颜色派生 —— [观察] 不支持

- **[观察]** 状态列自带调色板，条件着色基于单元格值/公式结果，**不基于查看者身份**。无法让同一行在 A 眼里红、B 眼里灰，除非为不同人建不同视图分别配色。

## 3. 自动化（截止提醒 / 状态变更通知）

- **[观察]** 原生 automation recipe：基于日期列触发。
  > 原文模板：「When date arrives, notify someone.」「When date arrives and status is something, notify someone」
- **[观察]** 过期提醒：自动化在日期**午夜之后**运行，**不回溯**。
  > 原文：「When a date has passed … the automation will run at midnight after the date has passed, the template will not work retroactively」
- **[观察]** 每日检查模板（如「每日，若到期且状态未变则通知」）**无法用自定义自动化构建器创建**。
- **[观察]** notify 限制：不支持 HTML；Formula/Auto Number/Progress/Dependency/Link to Item 列不可用于 notify；日期列仅欧洲格式。

## 4. 表情回应（亮点）

- **[观察]** ✅ Updates Section 是 item 内的社交流评论，支持 @mention、文件、编辑历史。
- **[观察]** ✅ 开发者 API 的 updates 对象含 reaction/like 元数据（`Like` 含 `creator`、`created_at`），证明 Updates 原生支持 emoji reactions。
  > 出处：https://developer.monday.com/api-reference/reference/updates-other-types

## 5. 用户级时间状态 / 天赋贴纸

- **[未知]** 无原生四档「忙碌/空闲」状态。
- **[推断]** 可加 custom column 到 team member 或单独 board 模拟，但「全局显示在任务上」需手工关联，非用户档案固有属性。

## 6. 适配判断

- **[推断]** 若愿弱化「动态派生颜色」和「按钮级可见性」，接受颜色靠视图/条件格式近似、操作靠流程约定，monday 是协作体验最好的选项。
- **[推断]** 若这两条是产品核心表达，monday 的自定义成本并不比自建低（需拆 board 或第三方权限应用）。

---

### 出处
- https://support.monday.com/hc/en-us/articles/115005315809-Board-permissions
- https://support.monday.com/hc/en-us/articles/360000227739-Due-Date-Alerts-and-Reminders-with-Automations
- https://support.monday.com/hc/en-us/articles/115005900249-The-Updates-Section
- https://developer.monday.com/api-reference/reference/updates-other-types
