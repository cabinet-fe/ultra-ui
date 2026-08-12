# playground 契约参考服务（report connector）

`@veltra/sheet` DataConnector HTTP 契约（[ADR-0003 决策 3](../../docs/adr/0003-sheet-report-productization.md)）的 dev-only 参考实现：hono + TS，`mysql2` / `pg` 真实驱动。

- 只存在于 playground（devDependencies），**不进任何发布产物**。
- **通用契约**（供 BYO 对齐）：`POST /test|describe|query` 仍接受完整 `connection` + `sql`。
- **playground Hub**（报表演示实际使用）：连接与数据集（含 SQL）持久化于 SQLite；取数只传 `datasetId` + `values`，凭据与 SQL 不出网。
- 前端经 vite proxy 访问：`createHubConnector({ endpoint: '/report-api' })`（vite dev 自动转发到本服务）。

## 启动

- **推荐（报表演示）**：`cd playground && bun run dev` — 并行拉起本服务（默认 8787）与前端（7788）。
- **仅契约服务**：`bun run server`（`server/dev.ts`，Bun 运行，含 SQLite 工作区）。
- **仅前端**：`bun run dev:web`；报表页需另开 `bun run server`，或改用 `bun run dev`。
- 端口：`REPORT_SERVER_PORT` 环境变量覆盖（默认 8787）。

## 端点

### Hub（playground 报表演示）

| 端点 | 请求体 | 成功 | 说明 |
| --- | --- | --- | --- |
| `GET /workspace` | — | `{ ok: true, connections, datasets }` | 读取工作区 |
| `PUT /workspace` | `{ connections, datasets }` | `{ ok: true }` | 全量保存工作区 |
| `POST /connections/:id/test` | — | `{ ok: true }` | 凭据从 SQLite 读取 |
| `POST /datasets/:id/describe` | — | `{ ok: true, fields }` | SQL 与连接从 SQLite 读取 |
| `POST /datasets/:id/query` | `{ values? }` | `{ ok: true, fields, rows }` | 只传查询参数 |
| `GET|POST|PUT|DELETE /templates` | — | — | 模板入库时剥离 connection/sql，读取时由工作区回填 |

`WorkspaceDataset`：`{ id, connectionId, label, sql, paramOverrides?, fieldOverrides? }`。

### 通用契约（ADR-0003，BYO 对齐）

| 端点 | 请求体 | 成功 | 业务错误 |
| --- | --- | --- | --- |
| `POST /test` | `{ connection }` | `{ ok: true }` | `200 + { ok: false, error: { code, message } }` |
| `POST /describe` | `{ connection, sql }` | `{ ok: true, fields: [{ name, label?, type? }] }` | 同上 |
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

## 手动冒烟（Hub 路径）

```bash
# 先 PUT /workspace 写入连接与数据集，再：

# 测试连接（不传凭据）
curl -X POST http://localhost:8787/connections/c1/test

# 解析字段（不传 SQL）
curl -X POST http://localhost:8787/datasets/ds-orders/describe

# 取数（只传 values）
curl -X POST http://localhost:8787/datasets/ds-orders/query \
  -H "Content-Type: application/json" \
  -d '{"values":{"status":"paid"}}'
```

通用契约冒烟示例见 `GET /` 返回的 `usage.example.legacyTest`。

## 已知限制

### MySQL describe 不支持 CTE

`describe` 会把 SQL 包成 `SELECT * FROM (...) AS __report_describe LIMIT 0` 派生表以只取字段元数据。MySQL 8 的派生表不支持 `WITH`（CTE），因此以 `WITH` 开头的 SQL 在 MySQL 连接上调用 `describe` 会直接返回可读业务错误（`SQL_ERROR`），提示改写为子查询或改用 `query`。PostgreSQL 无此限制。

### MySQL 布尔列类型映射

`TINYINT(1)`（协议类型 TINY）映射为 `string`，与 PostgreSQL `bool` → `string` 一致；不会为布尔列单独引入 `DatasetField.type: 'boolean'`（契约不变）。mysql2 协议类型无法区分 `TINYINT(1)` 与普通 `TINYINT`，因此所有 TINY 列均映射为 `string`。

## PostgreSQL 演示数据

`demo-data/` 提供建表 + 种子数据 SQL（7 张业务表，对齐原 mock Data Hub），连接串占位符见 `demo-data/README.md`。
