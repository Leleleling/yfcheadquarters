# 06 — 技术约束与选型理由

> 硬约束：零费用、零自建服务器。后端 = **Supabase**，前端托管 = **Vercel 或 Cloudflare Pages**。
> 本期不做 Google 登录；身份用「选名字登录」。

---

## 一、为什么是 Supabase 自建，而不是现成工具

前期对比 Lark / monday.com / Notion / ClickUp / Wrike 的结论（仅作背景，不引入这些工具到本项目）：

- **一级缺口（破坏产品表达，不可妥协）**：
  1. **按查看者动态派生颜色**：现成工具的条件格式基于「字段值」，不是「当前用户与目标的关系」，无法让同一行在 A 眼里红、B 眼里灰。
  2. **按钮级可见性隔离**：「完成 / 我需要更多时间」无法原生只对「被针对者」可见。
- 上述两点任何现成工具都无法同时原生满足；而 **Supabase + 前端派生 + RLS** 能原生补齐：
  - 颜色：`deriveColor(viewer, task)` 在渲染时算（见 `04-dynamic-display.md`）。
  - 隔离：RLS 强制「仅 target_user / admin 可改状态」（见 `03-access-control.md`）。
- 因此选择自建，总复杂度低于「在通用工具权限模型里反复做减法」。

> 参考系价值：Wrike 的「用户档案自定义字段（skills / hidden talents）」告诉我们用户级扩展字段应属于用户档案而非任务表——本项目据此把时间状态 / 天赋放在 `profiles`（见 `02-data-model.md`）。但**不采用 Wrike**。

---

## 二、免费技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 数据库 | Supabase Postgres（免费层） | 存 tasks / profiles / reactions / notifications |
| 权限 | Supabase RLS | 行级权限兜底（见 `03`） |
| 身份 | Supabase Auth（本期简化） | 见下「身份模型」 |
| 实时 | Supabase Realtime | 任务墙 / 通知即时更新 |
| 定时 | Supabase Cron / Edge Function | 截止提醒、过期检测 |
| 前端 | 现有 Vite + React 项目（根目录 `src/`） | 不改源码，仅后续实现 |
| 托管 | Vercel **或** Cloudflare Pages | 静态站点，免费层足够 |

---

## 三、身份模型（本期 MVP）

- **用户名 / 分组由 admin 在 Supabase 后台或管理页创建**（`profiles` / `groups` / `group_members`）。
- **登录方式 = 选名字**：用户从预置名单选择自己的 `display_name` 即视为登录，前端持有其 `user_id` 作为当前身份。
- **安全说明（须明确）**：纯「选名字」无密码，任何人可冒选他人。对早期内网 / 可信团队可接受；RLS 仍按所选 `user_id` 执行，保证「非针对者改不了状态」。
- **后续升级（本期不做）**：接入 **Google 登录**（Supabase Auth 的 OAuth Provider），把 `profiles.id` 绑定到真实 Google 账号，消除冒选风险。文档预留 `auth.users` 对接位，不在本期实现。

---

## 四、本期边界（不做的）

- 不实现密码 / OAuth（除预留接口）。
- 不引入 Asana / Trello / Airtable 等任何未在需求中出现的工具。
- 不做独立 IM 推送（通知留在应用内）。
- 不重写 `src/` 现有代码；本文件与同批文档仅为后续实现提供逻辑与数据边界。
