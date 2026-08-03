# Phase 7 — 行列插入/删除

> 前置：Phase 1-6 已交付（本次收尾验证后启动）。

## 阶段目标

- `Sheet` / `SheetToolContext` 提供 `insertRows` / `insertCols` / `deleteRows` / `deleteCols`（可 undo/redo）。
- 数据、合并区、稀疏行高、**公式引用**（含跨表、绝对引用、#REF! 边界）随结构变更平移（Excel 语义）。
- 工具栏 + 单元格右键菜单提供插入/删除入口；Grid 渲染行列数随模型增长。

## 设计决策（已实现）

### 结构变更 = 命令（`InsertCellsCommand`）

- redo：`applyStructureChange`（数据/合并/行高/尺寸平移 + `structure-change` 事件）+
  公式引用平移 CellPatch（依赖图经 `applyPatch` 的 `syncCell` 自动同步）。
- undo：先恢复公式 CellPatch 的 before（原公式文本/原数据，写到平移后坐标），
  再执行**反向结构操作**（数据随坐标移动回原位，公式文本无需反向平移）。
- `StructurePatch` 携带 `beforeRows/beforeCols`：insert/delete 的尺寸计算（`max(rows, at)+count`）
  不可逆，undo 必须精确还原。

### 平移语义（Excel）

- 插入：`start >= at` 整体平移；`start < at <= end` 区域扩展。
- 删除 [at, at+count)：完全在区间内移除；相交按保留行/列裁剪（锚点被删 → 新锚点取区间起点）；
  区间下方整体平移。
- 公式引用（`core/formula/shift.ts`，token 级保真，不改数字/运算符原文）：
  - 引用被删 → 公式格转 `#REF!`（清 f + v/t 错误，可 undo 恢复原公式）。
  - `$1` 行绝对不随行平移、`$A` 列绝对不随列平移；区域整体绝对时整区域不随该轴移动。
  - 跨表（共享公式图）同步平移引用；**其他 sheet 的公式格坐标不动，仅引用文本平移**。
- 表格尺寸 `Sheet.rows/cols`（随快照持久化，0 = 未声明由视图 props 决定）。

### Grid 联动

- `SheetGrid` 渲染尺寸 = `max(props, sheet.rows/cols)`。
- `structure-change` 事件 → vue 层 `rebuildGrid`（数据/选区/冻结/行高随重建恢复）。
- 选区回驱钳制越界坐标（行列删除后选区收敛）。

### 遗留（已知限制）

- 删除行后 `#REF!` 公式的引用不随后续插入恢复（Excel 亦如此，需手动改公式）。
- 行号/列头拖拽插入（Excel 的插入行手柄）未实现，仅菜单/工具栏入口。
- 表尾插入（at > rows）允许（宽松语义），表格尺寸按 `max(rows, at)+count` 增长。

## 验证清单

- [x] `core/__test__/row-col-shift.test.ts`（21）：CellStore 两阶段平移防键覆盖、高水位重算、
  往返一致性；MergeManager 插入扩展/删除裁剪/coverIndex 一致。
- [x] `core/__test__/formula-shift.test.ts`（20）：引用平移（绝对/跨表/区域扩展裁剪/删除 #REF!）。
- [x] `core/__test__/structure-change.test.ts`（13）：Sheet 端到端——数据/公式/合并/行高/尺寸、
  undo/redo 往返（含跨表、#REF! 恢复）、快照持久化。
- [x] `bun run lint` / `vp test`（397 全过）/ `bun run build` 全绿。
- [x] Playwright 真实浏览器 6 项：插入行（公式 Sheet2!B2*2→B3、VTable 30→31 行）、undo、
  插入列、删除行、右键菜单入口、表尾插入。
