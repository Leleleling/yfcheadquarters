# m05 — Wrike 证据化调研（参考系，不推荐采用）

> 证据源：Wrike Help Center《Creating Custom Fields in User Profiles》。
> 结论：Wrike 整体模型比本项目需求重得多，**不采用**；但其「用户档案自定义字段」是五个工具里最接近「用户级时间状态 + 天赋贴纸」的设计参考。

---

## 1. 用户档案自定义字段（设计参考）

- **[观察]** 可在用户档案加任意属性与技能（skills、location、availability、hidden talents 等），字段类型由管理员选择。
  > 原文：「change the settings of any existing custom field so that you can start using it in user profiles to track unique attributes and skills.」
- **[观察]** 创建入口：`Account Management → Users → User Fields`，可选字段类型、共享设置、是否用于 work item 的 assignee 推荐。
- **[观察]** 若设为 assignee requirement（勾选），则在分配任务时**自动推荐具备匹配属性的负责人**：
  > 原文：「define which attributes are needed to complete each task … Wrike will automatically suggest assignees that have matching attributes in their user profiles」
- **[观察]** 若仅保留在用户档案（不勾选），则只在 User settings / Workload Filter / Dashboards 可见，**不能用于推荐负责人**。
- **[观察]** 默认仅 account owners / admins 可创建编辑；权限可下放给其他合格用户类型（Collaborators/Contributors 除外）。

## 2. 计划可用性

- **[观察]** 该功能仅 **Pinnacle / Apex** 计划开放；Free / Team / Business **不可用**。

## 3. 对本项目的参考价值（仅此）

- **[推断]** Wrike 告诉我们「用户级扩展字段」在产品上**应长什么样**：不是任务表里的一列，而是**用户档案的固有属性**，在分配和查看时自动带出。
- **[推断]** 这一设计思路可直接迁移到自建方案的数据模型（`profiles.time_status` / `profiles.talents`，见 `02-data-model.md`），无需采用 Wrike 本身。

## 4. 为何不采用 Wrike

- **[观察]** Wrike 整体为企业级重量模型，权限/工作流复杂度远超本项目「两种角色 + 一条操作规则」的需求。
- **[推断]** 引入 Wrike 的运维与学习成本高于自建 Supabase。

---

### 出处
- https://help.wrike.com/hc/en-us/articles/23962541165719 （Creating Custom Fields in User Profiles）
- （关联）https://help.wrike.com/hc/en-us/articles/... （Custom Fields in User Profiles 系列：技能/地点/可用性匹配）
