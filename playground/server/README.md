# playground 契约参考服务（report connector）

`@veltra/sheet` DataConnector HTTP 契约（[ADR-0003 决策 3](../../docs/adr/0003-sheet-report-productization.md)）的 dev-only 参考实现：hono + TS，`mysql2` / `pg` 真实驱动。

- 只存在于 playground（devDependencies），**不进任何发布产物**。
- 服务无状态：不内置任何默认连接，每次调用按请求携带的 connection 新建短连接。
- 前端经 vite proxy 访问：`createHttpConnector({ endpoint: '/report-api' })`（vite dev 自动转发到本服务）。

## 启动

- **随 dev 联动**：`cd playground && vp dev`，`reportServerPlugin` 自动拉起服务（默认端口 8787）。
- **独立启动**：`bun run server`（playground/server/dev.ts）。
- 端口：`REPORT_SERVER_PORT` 环境变量覆盖（默认 8787）。

## 端点（无版本段）

| 端点 | 请求体 | 成功 | 业务错误 |
| --- | --- | --- | --- |
| `POST /test` | `{ connection }` | `{ ok: true }` | `200 + { ok: false, error: { code, message } }` |
| `POST /describe` | `{ connection, sql }` | `{ ok: true, fields: [{ name, type? }] }` | 同上 |
| `POST /query` | `{ connection, sql, values }` | `{ ok: true, fields, rows }` | 同上 |
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
