# 04 — playground hono 连接器参考服务

**What to build:** playground 内置 hono + TS 服务，按契约实现 test/describe/query 三端点（`mysql2`/`pg` 真实驱动，playground devDependencies，不进任何发布产物）；随 dev 联动启动，前端经 vite proxy 访问；不内置任何默认连接（演示者自行在 UI 输入）。不可用连接返回业务错误，真实连接返回真实数据。该服务同时是契约的活体文档（ADR-0003 决策 3）。

**Blocked by:** 03 — 报表纯 TS 内核 + DataConnector 入包（契约已定稿）

**Status:** ready-for-agent

- [x] 三端点按契约响应；连不上/SQL 报错返回 200 + `{ ok: false, error: { code, message } }`
- [x] dev 启动时服务联动可用，前端经 proxy 可达
- [x] 负责人用真实 MySQL 与 PG 连接手动冒烟通过（test/describe/query 各一次）

## MySQL 演练记录（2026-08-12，issue 08 补齐）

环境：本机 `mysql@8.4`（Homebrew），`demo` 库，`127.0.0.1:3306`，用户 `root` 无密码；参考服务 `REPORT_SERVER_PORT=8788`。

| 端点 | SQL / 场景 | 结果 |
| --- | --- | --- |
| `POST /test` | 连接 `demo` | `{ ok: true }` |
| `POST /describe` | `SELECT ... WHERE status = ${status}` | `fields` 含 `is_paid` → `type: string`（TINYINT 对齐 PG bool） |
| `POST /describe` | `WITH cte AS (...)` | `SQL_ERROR`，可读提示「MySQL 下 describe 不支持 CTE」 |
| `POST /query` | `${status}` 参数查询 | 返回 `paid` 行 |
| `POST /query` | 字面量 `'${status}'` + 真实 `${status}` 并存 | 仅替换占位符，不误伤字面量（返回 1 行 `paid`，不含字面量 `${status}` 行） |

PostgreSQL 路径已在 productization 阶段验证通过，本票未重复演练。
