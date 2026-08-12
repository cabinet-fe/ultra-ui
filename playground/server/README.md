# playground 契约参考服务（report connector）

`@veltra/sheet` DataConnector HTTP 契约（[ADR-0003 决策 3](../../docs/adr/0003-sheet-report-productization.md)）的 dev-only 参考实现：hono + TS，`mysql2` / `pg` 真实驱动。

- 只存在于 playground（devDependencies），**不进任何发布产物**。
- 查询代理无状态：每次调用按请求携带的 connection 新建短连接，不内置默认连接。
- **工作区持久化**（playground 演示专用）：`GET|PUT /workspace` 将连接与数据集存入本地 SQLite（`playground/server/data/report-hub.db`，可用 `REPORT_HUB_DB` 覆盖）。
- 前端经 vite proxy 访问：`createHttpConnector({ endpoint: '/report-api' })`（vite dev 自动转发到本服务）。

## 启动

- **推荐（报表演示）**：`cd playground && bun run dev` — 并行拉起本服务（默认 8787）与前端（7788）。
- **仅契约服务**：`bun run server`（`server/dev.ts`，Bun 运行，含 SQLite 工作区）。
- **仅前端**：`bun run dev:web`；报表页需另开 `bun run server`，或改用 `bun run dev`。
- 端口：`REPORT_SERVER_PORT` 环境变量覆盖（默认 8787）。

## 端点（无版本段）

| 端点 | 请求体 | 成功 | 业务错误 |
| --- | --- | --- | --- |
| `POST /test` | `{ connection }` | `{ ok: true }` | `200 + { ok: false, error: { code, message } }` |
| `POST /describe` | `{ connection, sql }` | `{ ok: true, fields: [{ name, type? }] }` | 同上 |
| `POST /query` | `{ connection, sql, values }` | `{ ok: true, fields, rows }` | 同上 |
| `GET /workspace` | — | `{ ok: true, connections, datasets }` | — |
| `PUT /workspace` | `{ connections, datasets }` | `{ ok: true }` | `400` 形状不合法 |
| `GET /` | — | 契约活体文档（JSON） | — |

`connection`：`{ id, label, type: 'mysql' | 'postgresql', host, port, database, username, password }`。

传输层错误（请求形状不合法、类型不支持）用 HTTP 400；业务错误一律 200。

## 错误码

| code | HTTP | 含义 |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | 请求体 / 连接对象形状不合法 |
| `UNSUPPORTED_TYPE` | 400 | 连接类型不是 mysql / postgresql |
| `CONNECTION_FAILED` | 200 | 数据库不可达 / 认证失败 / 连接被拒 |
| `SQL_ERROR` | 200 | SQL 语法或执行报错 |
| `MISSING_PARAM` | 200 | SQL 引用了 `${param}` 但未提供对应值 |

## 手动冒烟（真实连接）

```bash
# test：可用连接
curl -X POST http://localhost:8787/test -H "Content-Type: application/json" \
  -d '{"connection":{"id":"c1","label":"本地 PG","type":"postgresql","host":"127.0.0.1","port":5432,"database":"demo","username":"postgres","password":""}}'

# describe：只取字段 schema（${param} 占位符无需传值）
curl -X POST http://localhost:8787/describe -H "Content-Type: application/json" \
  -d '{"connection":{...同上...},"sql":"SELECT id, name, amount FROM orders WHERE status = ${status}"}'

# query：${param} 与 values 一一对应
curl -X POST http://localhost:8787/query -H "Content-Type: application/json" \
  -d '{"connection":{...同上...},"sql":"SELECT id, name, amount FROM orders WHERE status = ${status}","values":{"status":"paid"}}'

# 错误路径（不可达连接）
curl -X POST http://localhost:8787/test -H "Content-Type: application/json" \
  -d '{"connection":{"id":"c2","label":"死主机","type":"mysql","host":"127.0.0.1","port":1,"database":"x","username":"root","password":""}}'
# → 200 {"ok":false,"error":{"code":"CONNECTION_FAILED","message":"..."}}
```

验收：test / describe / query 各一次，用真实 MySQL 与 PostgreSQL 连接。

## 已知限制

### MySQL describe 不支持 CTE

`describe` 会把 SQL 包成 `SELECT * FROM (...) AS __report_describe LIMIT 0` 派生表以只取字段元数据。MySQL 8 的派生表不支持 `WITH`（CTE），因此以 `WITH` 开头的 SQL 在 MySQL 连接上调用 `describe` 会直接返回可读业务错误（`SQL_ERROR`），提示改写为子查询或改用 `query`。PostgreSQL 无此限制。

### MySQL 布尔列类型映射

`TINYINT(1)`（协议类型 TINY）映射为 `string`，与 PostgreSQL `bool` → `string` 一致；不会为布尔列单独引入 `DatasetField.type: 'boolean'`（契约不变）。mysql2 协议类型无法区分 `TINYINT(1)` 与普通 `TINYINT`，因此所有 TINY 列均映射为 `string`。

## PostgreSQL 演示数据

`demo-data/` 提供建表 + 种子数据 SQL（7 张业务表，对齐原 mock Data Hub），连接串占位符见 `demo-data/README.md`。
