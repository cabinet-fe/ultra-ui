# 04 — 展开与填充：新 renderReport 上线、旧引擎删除

**What to build:** 消费 03 的坐标系产出 Filled Report 快照：聚合求值（含索引）、样式解析、合并单元格、列宽继承；`renderReport` 编排换新实现，旧 `render.ts` 整体删除，不与新引擎并存。

**Blocked by:** 03 — 扩展坐标系（纯计算层）

**Status:** ready-for-agent

- [ ] `render/aggregate.ts`：`list` / `group` / `sum` / `avg` / `count` / `max` / `min` 求值；按分组字段建索引，替代交叉展开里 O(行值数 × 列值数 × 记录数) 的重复 `filterRows`
- [ ] 修现有 bug：`avg` 空集返回空值而非 `0`（`sum` 空集仍为 `0`）
- [ ] `render/style-resolver.ts`：静态样式经 `StylePool` 复用 + 条件样式打平（ADR-0001 决策 2 的导出打平机制不变，仍写进 `SheetSnapshot.styles`）
- [ ] `render/builder.ts`：Filled Report 快照组装——按物理区间写格、`mergeSpan !== false` 时把实例跨度合并为单个单元格（否则逐格重复填值）、静态格按映射后的位置输出
- [ ] 横向展开出的列继承其列方向父格所在模板列的宽度（`ReportColWidthEntry` 链路）
- [ ] `render/index.ts`：`renderReport(template, data)` 编排，签名与返回类型不变（仍为纯函数、仍返回 `SheetSnapshot`）
- [ ] **删除** `packages/sheet/src/report/render.ts` 及其全部启发式：`detectMatrixLayout`、`MatrixLayout`、`expandMatrixReport`、`isMatrixTemplateRow`、`classifyTemplateRow`、`expansionBlocks`、`isBlockChildRow`、`blockRootRow`、`isGroupExpansionRoot`、`isConsumedByParent`、`expandNestedGroups`、`expandGroupBlock`、`expandListBlock`、`emitStaticTemplateRow` 按模板行直搬的逻辑
- [ ] 引擎零推断自查：新实现中不得出现任何从 `addr.row` / `addr.col` 大小关系推断语义的代码（CONTEXT 新架构约束）
- [ ] **回归基线（硬约束）**：现有 `render.test.ts` 中纵向报表的断言（分组头 / 明细行 / 小计 / 总计四个预设）**一行不改**全绿；逐格差异一律视为 bug
- [ ] 矩阵那一组测试按新语义改写（其断言建立在 `row < col` 能识别的特殊布局上，语义本身要变）
- [ ] 新增测试：横向展开（`right` + `group`）、转置明细（`right` + `list`）、多级列头、交叉格（双父格）、跨数据集、空数据集、`max` / `min`、`avg` 空集、`mergeSpan: false`
- [ ] 顶部带标题行的交叉表模板必须正常展开（旧实现在此场景静默失效，是本次重写的核心动机之一）

## Comments
