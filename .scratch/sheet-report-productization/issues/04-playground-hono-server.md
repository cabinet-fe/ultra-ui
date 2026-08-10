# 04 — playground hono 连接器参考服务

**What to build:** playground 内置 hono + TS 服务，按契约实现 test/describe/query 三端点（`mysql2`/`pg` 真实驱动，playground devDependencies，不进任何发布产物）；随 dev 联动启动，前端经 vite proxy 访问；不内置任何默认连接（演示者自行在 UI 输入）。不可用连接返回业务错误，真实连接返回真实数据。该服务同时是契约的活体文档（ADR-0003 决策 3）。

**Blocked by:** 03 — 报表纯 TS 内核 + DataConnector 入包（契约已定稿）

**Status:** ready-for-agent

- [ ] 三端点按契约响应；连不上/SQL 报错返回 200 + `{ ok: false, error: { code, message } }`
- [ ] dev 启动时服务联动可用，前端经 proxy 可达
- [ ] 负责人用真实 MySQL 与 PG 连接手动冒烟通过（test/describe/query 各一次）
