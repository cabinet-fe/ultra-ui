# ADR-0002: 数据连接与 SQL 数据集模型（数据集为报表基座）

* **状态**: Accepted (已通过)
* **日期**: 2026-08-09
* **领域 Context**: Sheet Report (`packages/sheet-core/CONTEXT.md`)

---

## 背景与问题 (Context & Problem Statement)

ADR-0001 落地的 Mock Data Hub 把数据集硬编码在 `dataset-hub/catalog.ts`（7 个数据集 schema + 种子行），查询参数硬编码在 `dataset-hub/params.ts`。暴露的产品问题：

1. **数据集缺乏"连接数据库"的真实感**——没有数据连接概念，数据集凭空出现，无法表达"数据集是报表运行的基础"。
2. **过滤条件无配置入口**——参数定义写死在代码里，UI 只有填值没有定义。
3. 参数与数据集的关系靠 `appliesTo` 手工维护，与模板实际绑定脱节。

---

## 决策事项 (Decision Drivers & Choices)

### 决策 1：数据连接（Data Connection）为一等概念

数据集不再凭空存在：`Dataset = DataConnection + SQL`。连接可增删改（类型 mysql/postgresql/api + host/port/库名/账号表单 + 模拟测试连接），但**所有连接共享同一套 mock 表**（克制版模拟：连接流程完整，不模拟多库内容差异）。

### 决策 2：数据集由 SQL 定义，`${param}` 自动提取查询参数

- 数据集 SQL 走微型解析器（自写、零依赖）：`SELECT ... FROM ... WHERE ...` 子集，支持 `= != > >= < <= BETWEEN IN LIKE AND/OR`、括号、`AS` 别名、`SELECT *`。
- 字段 schema 从 SELECT 列 + mock 表结构解析；查询参数从 `${param}` 占位符自动提取，可在数据集编辑器中覆盖元数据（label/类型/默认值/选项）。
- 参数类型体系：`text | number | date | date-range | select`；`BETWEEN ${x}` 自动推断 `date-range`，filter-bar 按类型映射 `UInput / UNumberInput / UDatePicker / UDateRangePicker / USelect`。
- **空参数值的谓词整体跳过**（等价"全部"语义），保持演示流畅。

### 决策 3：抽象留在 playground，接口保持干净

与 CONTEXT-MAP 既定约束一致（首期渲染引擎放 playground，sheet-core 只提供 Cell Meta 扩展面）。`DataConnection` / `DatasetDef` / `DataHub` 设计为纯净接口，render 引擎与 UI 只依赖接口，未来产品化时可整体下沉为独立包，本次不改 `sheet-core` / `sheet` 包 API。

### 决策 4：filter-bar 参数来源 = 实际绑定的数据集

预览态筛选栏展示的参数，从"模板 preset 声明的 datasetIds"改为"网格中实际绑定涉及的数据集的参数并集"（同名参数合并，先见为准）。绑定即真相，无需手工维护关联。

---

## 后续影响 (Consequences)

### 正向影响 (Positive)

- 数据集获得"连接 → 表 → SQL → 参数"的完整产品叙事，过滤条件有了天然配置位置（SQL 的 `${param}` + 数据集编辑器参数表）。
- `dataset-hub` 成为框架无关的纯净模块（可在 vitest 无头测试），UI 与数据层解耦。

### 潜在风险与应对 (Risks & Mitigation)

- **SQL 解析器只支持子集**：预置数据集的 SQL 控制在子集内；超出的语法在编辑器中即时报错提示，不静默失败。
- **同名参数合并的歧义**：两个数据集引用 `${region}` 会在筛选栏合并为一个控件——这正是期望行为（类 BI 工具的全局参数）；元数据冲突时以先见数据集为准。
