# AGENTS.md — @veltra/sheet

基于 `@visactor/vtable`（ListTable）的电子表格包。**数据模型完全自持有，VTable 只做渲染与输入的视图层**：所有单元格操作都作用在自己的模型上，VTable 通过适配层被动刷新。

## 目录结构

```
src/
├── index.ts              # 聚合导出
├── core/                 # 框架无关纯 TS，可单测、可无头运行（不 import vue / vtable）
│   ├── address.ts        # A1 地址系统（0-based CellAddress / 闭区间规范化 CellRange）
│   ├── cell-store.ts     # 稀疏矩阵存储（Map<row, Map<col, CellData>>）
│   ├── merge-manager.ts  # 合并单元格（只管几何，不管数据）
│   ├── selection.ts      # 选区模型（activeCell 恒为锚点）
│   ├── sheet.ts          # Sheet = store + merge + selection，统一操作入口
│   ├── workbook.ts       # Workbook = 多 Sheet（公式跨表引用的载体）
│   └── events.ts         # 包内轻量类型化事件发射器（内部基建）
└── grid/
    └── sheet-grid.ts     # VTable 适配层（ListTable 封装、编辑器接入、事件回写）
```

## 核心语义约定

- **坐标 0-based**：`{ row: 0, col: 0 }` 即 A1；`CellRange` 为闭区间且 start 恒为左上角。
- **空单元格不占存储**：`setCell` 空数据（无公式且 `v` 为 null/undefined/''）即删除；`rowCount/colCount` 只是渲染高水位，不分配空间。
- **合并**：锚点恒为区域左上角，数据只存锚点格。`merge(range)` 会解除相交旧合并并取**包围盒**；值保留规则（行主序第一个有值格落锚点，其余清空）编排于 `Sheet.mergeCells`，`MergeManager` 只管几何。
- **两种读取语义分开**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入与选中（`setCellValue` / `selectCell`）内部先 `resolveAnchor`，永远落锚点。
- `getCellInfo(addr)` 返回 `{ kind: 'normal' | 'merged-anchor' | 'merged-covered', anchor, mergeRange? }`，是「区分普通格/合并格」的 API 基础。

## VTable 适配层要点（1.26.5 spike 结论）

- `customMergeCell` 函数式配置**逐格动态求值、无缓存**；闭包直读 `MergeManager`，合并变更后 `setRecords` 重建场景树即生效，无需 `updateOption`。
- **`CustomMerge` 必须携带 `text`（锚点显示值）**：`BaseTable.getCellRange` 仅在 `text`/`customLayout`/`customRender` 有效时才返回自定义合并区域。缺了 `text` 会导致：合并格渲染为空；选区/编辑不扩展为整个合并区域（能点到被覆盖格）；编辑提交不写锚点。带上 `text` 后 `getCellRange` 返回 `isCustom: true` 的范围，选区扩展、编辑器矩形、`doExit` 提交锚点（`changeCellValue(range.start, …)`）全部自动成立。
- 编辑器：`register.editor` 注册一次 `@visactor/vtable-editors` 的 `InputEditor`，配置 `editor` + `editCellTrigger: 'doubleclick'`。
- 双击编辑走 vrender Gesture 的 `doubletap` 识别（非原生 dblclick），Playwright 合成的 dblclick 无法触发——浏览器自动化验证编辑链路时改用 `getCellRange` + `changeCellValue` 走同一提交路径。
- 事件用 `ListTable.EVENT_TYPE` 静态访问器（`core.EVENT_TYPE` 在 d.ts 是 `import type` 重导出，运行时为 undefined）。
- **坐标偏移**：`rowSeriesNumber` 行号列**不计入** `rowHeaderLevelCount`；偏移量在首个表格实例上用 `columnHeaderLevelCount` + `isSeriesNumber` 逐列探测并缓存（`getOffsets`）。
- 表格事件回写模型时置 `syncingFromTable` 标志，阻断模型事件回流循环。
- 无头测试：happy-dom 不实现 canvas 2d，`src/grid/__test__/canvas-mock.ts` 用 Proxy mock 了 `getContext('2d')`（vp test setupFiles 注入）。

## 依赖

- **dependencies**：`@visactor/vtable`、`@visactor/vtable-editors`（同 desktop 先例，随包发布）
- **peer**：`@cat-kit/core`、`vue`
- **被依赖**：playground

## 已知限制

- sheet 重命名/删除对公式引用的联动未实现（公式引擎落地时处理）。
- 行列插入删除、单元格样式系统、图表、协同编辑：本期不做，模型层预留扩展点。
- `change_cell_value` 回写的是编辑后的展示值，公式文本（`f`）写入走 `Sheet.setCell`，不经过编辑器。

## 验证

```bash
vp test -F @veltra/sheet     # core 全无头覆盖 + ListTable smoke（happy-dom + canvas mock）
vp pack -F @veltra/sheet
bun run lint                 # 仓库根
```
