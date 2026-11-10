# 04 — 动态显示逻辑（4 色派生 + 时间状态 + 天赋贴纸）

> 本文档定义「同一任务在不同人眼里颜色不同」的派生规则，以及用户级字段如何随用户名处处带出。
> 颜色是**查看者派生量**，不落库（表结构见 `02-data-model.md`）。

---

## 一、4 色派生规则 `deriveColor(viewer, task)`

输入：当前登录者 `viewer`（含其所属组集合）、任务 `task`（含 `target_user_ids`、`target_group_ids`）。

```
viewerGroups = groupsOf(viewer)
isTargeted   = viewer.id ∈ task.target_user_ids
targetsMeOnly= isTargeted AND (task.target_user_ids 长度 == 1)
isCoop       = isTargeted AND (task.target_user_ids 长度 > 1)   // 合作/多人
sameGroup    = (viewerGroups ∩ task.target_group_ids) ≠ ∅

if isCoop:            -> 蓝色（合作：如开会、需多人完成）
else if isTargeted:   -> 红色（自己）
else if sameGroup:    -> 绿色（组内他人）
else:                 -> 灰色（其他组，均不涉及此组工作）
```

规则要点：
- **红 vs 蓝** 的区分：被单独针对 = 红；被作为多人之一针对 = 蓝（合作）。
- **绿**：不在 target_user 里，但属于某个被针对的组。
- **灰**：既不被针对，也不在任何被针对的组里。
- 颜色在**渲染时**计算，每行对每个查看者独立得出，无需为每人建视图（这正是现成工具做不到、而自建前端能原生做到的点）。

## 二、用户级「时间状态」

- 存于 `profiles.time_status`（`'特别忙'` / `'比较忙'` / `'有时间'` / `'空闲'`）。
- 用户登录后自选；显示在任务卡片中该用户名旁，用于协作时判断对方档期。
- 不需要「贴在任务表上」——是用户档案固有属性，查看时带出（`SELECT` 关联 profiles 即可）。

## 三、用户级「天赋贴纸」

- 存于 `profiles.talents`（text[]，贴纸 id / 标签）。
- 显示在用户名旁（与时间状态并列）。
- 设计参考：Wrike 的用户档案自定义字段思路——扩展属性属于「用户」而非「任务」，分配 / 查看时自动带出（详见 `06-tech-constraints.md` 的参考系说明，但本项目不采用 Wrike）。

## 四、显示约定（前端）

- 任务墙每行 / 每张卡片：左侧色条或底色 = `deriveColor` 结果；右上角显示类型（剪辑/配音/脚本/审核）。
- 任何出现用户名的地方（任务针对对象、反应者、鼓励者）都附带其时间状态 + 天赋贴纸。
- 已完成任务在 N 天窗口内保留，并以不同视觉（如淡化 / 角标「已完成」）区分未完成项。
