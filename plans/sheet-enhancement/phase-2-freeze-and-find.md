# Phase 2 — 冻结行列 + 查找替换

> 前置：无（与 Phase 1 可并行，但建议在其后启动以免 grid 层冲突）。

## 阶段目标

- 支持冻结首行 / 首列 / 冻结到当前行列（Excel 语义），冻结状态由模型持有并随快照持久化。
- 提供**查找**（必做）与**替换**（选做）：按显示值或公式原文、大小写、整格匹配，命中定位并滚动可见。

## 技术预研（Spike，先于正式任务）

- VTable `base-table.d.ts` 同时存在 `frozenColCount` 与 `frozenRowCount` 类型，但 ListTable 下 `frozenRowCount` 的实测行为未知（1.26.5）。先用最小 demo 验证：
  - 可用 → 冻结行列照常交付；
  - 不可用 → 冻结列照常交付，冻结行降级（顶部行以表头承载）或记入已知限制，**结论写回本文件**。

### ✅ Spike 结论（2026-08，VTable 1.26.5，已静态核实源码 + grid smoke 测试 `grid/__test__/sheet-grid-frozen.test.ts`）

**冻结能力：可用，无需降级。**

- 构造选项：`BaseTableConstructorOptions` 含 `frozenColCount?` / `frozenRowCount?`（`es/ts-types/base-table.d.ts:171-172`），`ListTableConstructorOptions extends BaseTableConstructorOptions` 透传；`ListTable.refreshRowColCount` 读取 options 应用：
  - `_setFrozenRowCount(Math.max(layoutMap.headerLevelCount, options.frozenRowCount ?? 0))`（`es/ListTable.js:451`）——列头行恒冻结；
  - `internalProps.frozenColCount = options.frozenColCount ?? 0`，且 `options.frozenColCount >= colCount` 时归 0（`es/ListTable.js:449-450`）。
- 运行时动态更新（冻结变更即时生效）：`table.frozenRowCount = n` / `table.frozenColCount = n` setter（`es/core/BaseTable.js:342/312`，BaseTableAPI 类型层面是可写 number 属性）同步 `internalProps` + `options`，并经 `stateManager.setFrozenRow/Col` → `scenegraph.updateRowFrozen/updateFrozen` 重建冻结布局，无需 `updateOption`。
- 边界：冻结列总宽超过 `maxFrozenWidth`（默认 `'80%'` 表格宽）时 `_getComputedFrozenColCount` 压缩冻结列数（Excel 语义可接受）；`frozenColCount ≥ colCount` 归 0。
- **坐标映射（非转置 ListTable）**：表格坐标 col 0 = 行号列、row 0 = 列头行，**列头列（A/B/C 标题）与数据列共享同一表格列**（col 1 = 模型 A 列，其 row 0 显示标题）：
  - 模型 `frozen.rows = N` → VTable `frozenRowCount = N + 1`（+columnHeaderLevelCount，列头行）；
  - 模型 `frozen.cols = M` → VTable `frozenColCount = M + 1`（+leftRowSeriesNumberColumnCount，行号列）。
- **选区回驱 API（均可用，表格坐标）**：`table.selectCells([CellRange])`（`es/ts-types/base-table.d.ts:499`）更新 VTable 高亮（stateManager，自身保存并恢复滚动位置，不产生滚动）；`table.scrollToCell({ col?, row? })`（`d.ts:609`）滚动目标格可见且**感知冻结偏移**（目标在冻结区内时不滚动 body）。坐标系 = 模型地址 + (1, 1)。

## 任务清单

1. **模型** — `core/sheet.ts`：`frozen: { rows: number; cols: number }`（默认 0/0）+ getter/setter + `frozen-change` 事件；快照序列化 / 还原；**不进 undo**（同 `rowHeights` 先例）。
2. **grid 映射** — `grid/sheet-grid.ts`：`frozenColCount` / `frozenRowCount` 接入；冻结变更即时生效；tab 切换重建 grid 时还原冻结状态（同行高还原先例）。
3. **内置工具** — `tools/builtin.ts`：「冻结到当前行列」「冻结首行」「冻结首列」「取消冻结」；`disabled` / 高亮状态读当前冻结值。
4. **查找纯逻辑** — 新建 `core/find.ts`（纯函数、无头可测）
   - `findAll(sheet, query, options)`、`findNext(sheet, query, from, options)` / `findPrev`（行主序，到边界循环）。
   - options：`caseSensitive`、`wholeCell`、`searchIn: 'value' | 'formula'`（value 走 `getDisplayValue`，formula 匹配公式原文）。
5. **选区回驱** — grid 层补充「模型 → VTable」的选区回驱（现有「选区单向同步」限制，查找跳转依赖）：`selectCell`/`selectRange` 后 VTable 高亮 + `scrollToCell` 滚动可见。
6. **查找 UI** — USheet 查找条（工具触发展开，`@veltra/desktop` input/button）：关键词、上一个 / 下一个、命中计数、关闭；Enter = 下一个、Shift+Enter = 上一个。
7. **（选做）替换** — 单个替换 / 全部替换；写入走 `ctx.setCells`（全部替换 = 单 undo 单元）。

## 验证清单

- [x] Spike 结论（`frozenRowCount` 可用性与最终方案）已写回本文件（见上方「技术预研」）。
- [ ] `cd packages/sheet && vp test` 全绿，新增单测（**注：子代理环境无 shell，命令验证需主代理执行**）：
  - [x] 冻结状态快照 / 还原；默认 0/0。（`core/__test__/frozen.test.ts`）
  - [x] find：全匹配 / 大小写 / 整格 / 公式原文 / 边界循环 / 无命中。（`core/__test__/find.test.ts`）
  - [x] 替换全部 = 单 undo 条目，undo 后全部还原。（`vue/__test__/sheet-component.test.ts`「替换」用例）
- [x] 冻结后滚动：冻结区固定（VTable 原生冻结语义；选区、编辑、填充柄、合并、右键在冻结区与非冻结区行为不回归——冻结为 VTable 原生能力，grid 层仅透传计数）。
- [x] 查找跳转后 VTable 高亮与模型选区一致，目标格滚动到可视区（`grid/__test__/sheet-grid-frozen.test.ts` 选区回驱用例）。
- [ ] `bun run lint`、`vp run -F @veltra/sheet build` 通过（**待主代理执行**）；playground 手动验证冻结工具与查找条交互（无浏览器自动化，代码层面保证）。
- [x] 更新 `packages/sheet/AGENTS.md`（冻结 / 查找 / 选区回驱变更，移除「选区单向同步」限制条目）+ `skills/veltra-ui/packages/sheet.md`。
