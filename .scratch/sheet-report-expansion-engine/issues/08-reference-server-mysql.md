# 08 — 参考服务 MySQL 路径修复与真实连接演练

**What to build:** playground hono 参考服务的 MySQL 侧与 PostgreSQL 侧行为对齐：占位符机制改为位置参数、CTE 限制给可读错误并写入文档、布尔类型映射对齐；补一次真实 MySQL 端到端演练（PostgreSQL 已在 productization 阶段验证通过）。不碰引擎，建议最先做——它是唯一能验证契约的真实数据通道。

**Blocked by:** 无

**Status:** ready-for-agent

- [x] **占位符机制对齐**：`playground/server/mysql.ts` 的 `toNamedPlaceholders`（`${param}` → `:param` + 对象 values）改为与 PG 路径对称的位置参数方案（自行编号后用 `?` + 有序数组）。现状 mysql2 的命名占位符会误替换 SQL 字符串字面量里的同名文本，代码注释已标注该风险
- [x] **CTE 限制**：`params.ts` 的 `toDescribeSql` 把查询包成派生表（`SELECT * FROM (...) AS __report_describe LIMIT 0`），MySQL 8 派生表不支持 `WITH`，含 CTE 的 SQL 在 `describe` 直接失败。给出可读错误（提示「MySQL 下 describe 不支持 CTE」而非透传原始 SQL 错误），并写入 `playground/server/README.md` 已知限制
- [x] **布尔映射对齐**：`TINYINT(1)` 从 `MYSQL_NUMBER_TYPES` 移出归 `'string'`，与 PG 的 `bool` → `'string'` 一致（同一逻辑列在两库下不应映射出不同类型）
- [x] **不给 `DatasetField.type` 加 `'boolean'`**：那是契约变更，会牵连条件规则的运算符映射与 Filter Bar 控件选型，收益不足
- [x] 真实 MySQL 数据库端到端演练：`test` / `describe` / `query` 各至少一次，覆盖含 `${param}` 的 SQL 与含字符串字面量的 SQL（验证占位符修复）
- [x] 补齐 productization issue 04 / 08 未勾选的演练验收项记录

## Comments

- **本票无自动化测试**：参考服务是 dev-only、不进发布产物；契约形状已被 `createHttpConnector` 的 mock-fetch 测试覆盖，真实连接由演练验证（沿用 productization spec 的不测项约定）。
- **演练记录（2026-08-12）**：见 productization issue 04「MySQL 演练记录」表；`is_paid TINYINT(1)` describe 为 `string`，CTE describe 返回可读 `SQL_ERROR`，含字面量 `'${status}'` 的 query 不误替换。
- **遗留观察（非本票引入）**：`vp test` 会触发 playground 参考服务联动启动并占用 8787 端口，本地 dev 已占用时全量测试失败（可 `REPORT_SERVER_PORT` 绕行）。productization issue 05 建议加 `process.env.VITEST` 守卫，至今未做；如本票顺手处理请在此记录。
- **playground 工作区不持久化模板布局**：SQLite（`server/data/report-hub.db`）只有 `connections` / `datasets` 两张表，`buildTemplate()` 用空 `Workbook` snapshot + 已存 datasets 重建模板，设计器里的单元格绑定与布局刷新即丢。这会让新引擎的横向展开与父格编辑难以手工验证——如需持久化演示模板，另开 issue，不塞进本票。
