Status: done

# 07 — 数据连接与 SQL 数据集模型（报表的数据基座）

**What to build:**
重构 `dataset-hub/` 为「数据连接 + SQL 数据集」模型，让数据集成为报表运行的基础和核心：

- **数据连接（Data Connection）**为一等概念：可增删改（类型 mysql/postgresql/api + host/port/库名/账号表单 + 模拟「测试连接」），所有连接共享同一套 mock 表（克制版模拟，不模拟多库内容差异）。
- **数据集（Dataset）= 连接 + SQL**：`SELECT ... FROM ... WHERE ...` 子集，支持 `${param}` 占位符（类 FineReport）。字段 schema 从 SELECT 列解析，查询参数从 `${param}` 自动提取并支持元数据覆盖（label/类型/默认值/选项）。
- 微型 SQL 解析器（自写，不引依赖）：`= != > >= < <= BETWEEN IN LIKE AND/OR`、括号、`AS` 别名、`SELECT *`；空参数值的谓词跳过（等价"全部"）。`BETWEEN ${x}` 自动推断 `date-range` 参数类型。
- `DataHub` 接口：连接 CRUD / 数据集 CRUD / `describe(sql)` / `query(datasetId, values)`，带 subscribe 通知；render 引擎与 UI 只依赖该接口，未来可整体下沉。

**Blocked by:** None — can start immediately.

- [x] 重写 `dataset-hub/types.ts`：DataConnection / DatasetDef / QueryParamDef / TableSchema / DataHub
- [x] 实现 `dataset-hub/sql.ts` 微型解析器与执行器（含 `${param}` 提取与参数类型推断）
- [x] `dataset-hub/database.ts`：mock 库表（复用 seeds 行数据，snake_case 表名 + 列 schema）
- [x] `dataset-hub/hub.ts` + `defaults.ts`：默认连接「演示业务库」+ 预置 SQL 数据集
- [x] 改造 binding.ts / template.ts / params.ts / index.vue 数据流（filter-bar 参数来源改为实际绑定的数据集）
- [x] 重写 dataset-hub 测试（解析器 + 执行 + 参数提取），更新 runtime/render 测试
