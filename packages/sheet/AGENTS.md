# AGENTS.md — @veltra/sheet

基于 `@visactor/vtable`（ListTable）的电子表格包。**数据模型完全自持有，VTable 只做渲染与输入**：单元格操作都作用在自己的模型上，VTable 经适配层被动刷新。

## 目录结构

```
src/
├── index.ts              # 聚合导出 + 内置工具注册（import './tools/builtin'）
├── core/                 # 框架无关纯 TS（不 import vue / vtable），可无头单测
│   ├── address.ts        # A1 地址（0-based）
│   ├── cell-store.ts     # 稀疏矩阵
│   ├── sheet.ts          # Sheet = store + merge + selection + history
│   ├── workbook.ts       # 多 Sheet + 共享公式依赖图
│   ├── command/          # 命令系统（undo/redo）
│   ├── style/            # StylePool + 边框预设
│   ├── formula/          # 公式引擎
│   ├── io/               # xlsx/csv（hucre）
│   ├── fill.ts / find.ts / merge-manager.ts / selection.ts
│   └── events.ts
├── grid/                 # VTable 适配层（SheetGrid）
├── tools/                # 工具扩展（不 import vue）；SheetContext 门面
├── vue/                  # USheet 组件（Vue 只在这一层）
└── types/                # SheetProps / SheetEmits / SheetExposed
```

## 分层约定

| 层 | 职责 | 禁止 |
| --- | --- | --- |
| `core/` | 模型、命令、公式、IO | import `vue` / `@visactor/*` |
| `grid/` | VTable 渲染、编辑回写、键盘 | 业务编排 |
| `tools/` | 工具注册表 + `SheetContext` | import `vue` |
| `vue/` | USheet UI 编排 | 绕过 `SheetContext` / 命令系统写模型 |

- **写操作一律走命令**：`setCellValue` / `setCells` / `setCellFormula` / `setCellStyle` / `mergeCells` / `insertRows` 等经 `defaultCommandRegistry` → `sheet.history`；`Sheet.applyPatch` 是唯一变更通道。
- **工具只经 `SheetContext`**：不暴露 `Sheet` 实例；扩展天然可 undo。
- **工作簿结构操作**（增删改名 sheet）走 `Workbook`，**不进 undo**，也不经 `SheetContext`；tabs UI 直接调 `Workbook`。
- 内置工具副作用注册必须挂在包入口（`src/index.ts`）；放 vue 层会被 pack treeshake 丢掉。

## 核心语义

- **坐标 0-based**：`{ row: 0, col: 0 }` = A1；`CellRange` 闭区间，start 恒为左上角。
- **空单元格不占存储**：无公式且 `v` 为空即删除；`rowCount`/`colCount` 只是渲染高水位。
- **合并**：锚点 = 区域左上角，数据只存锚点；`MergeManager` 只管几何，值保留规则在 `Sheet.mergeCells`。
- **两种读取**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入/选中内部先 `resolveAnchor`。
- **不进 undo**：选区、冻结、行高。选区可随 `SheetSnapshot.selection?` 序列化；冻结随快照；列宽未持久化。
- **样式**：`CellData.s: StyleId` → `StylePool` 按内容去重；部分合并见 `CellStylePatch`（fill 覆盖、border 边级、font/align 逐字段；`null` 删字段）。边框预设经 `buildBorderPresetItems`（含邻居对侧边同步）。
- **公式**：`f` 原文（无 `=`），`v`/`t` 为缓存；重算派生补丁并入同一 undo 单元；undo/redo 纯补丁回放。跨表依赖图在 `Workbook` 级共享。

## USheet

- Props：`workbook?`、`rows?`(100)、`cols?`(26)、`showToolbar?`、`showFormulaBar?`、`showTabs?`
- Exposed：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`
- 宿主需给高度（`.u-sheet` flex 列，grid `flex:1; min-height:0`）
- 样式：`import '@veltra/sheet/vue/style'`；BEM 元素用 `m.e(name)`，**不要**用单参 `m.bem` 当元素（会丢 `__grid` 等规则）
- 工具栏组序：`history | cell | text | edit | file`；行列插入/删除、冻结在**右键菜单**（非工具栏）
- SheetGrid 按 sheet **LRU 缓存**（容量 3）：命中只翻可见性；`structure-change` / 尺寸变化 / 导入替换则重建

## VTable 适配要点

- 主题必须 `themes.DEFAULT.extends(...)`，裸对象会丢默认色。
- `customMergeCell` 的 `text` **必须读 VTable records**（`getCellOriginValue`），不能读模型——否则编辑提交后重绘显示旧值。
- 模型冻结 N 行/列 → VTable `frozenRowCount/ColCount = N + 1`（含列头/行号）。
- 选区回驱：`selection-change` → `selectCells` + `scrollToCell`；用 `syncingSelection` 防递归。回驱前需临时清 `eventManager.isDraging` 并清选区 overlay（VTable 1.26.5 拖选时序缺陷，否则多框残留 / 反向拖选畸形）。
- 弹层打开用 `setTimeout(0)`，不要用 `queueMicrotask`（否则同一次 click 冒泡会立刻关掉面板）。
- 事件用 `ListTable.EVENT_TYPE`（`core.EVENT_TYPE` 运行时为 undefined）。

## 导入导出

- `core/io`：`exportWorkbookXlsx` / `exportSheetCsv` / `importXlsx` / `importCsv` / `replaceWorkbook`
- 大 xlsx 在 Web Worker 解析（`popups/import.worker.ts`），主线程 `restore`；worker 须列入 pack entry
- 导入迭代 hucre 稠密 `rows` 时先跳过空槽；表格尺寸按有值格收敛，勿用稠密几何撑到 Excel 极限列数

## 依赖

- **dependencies**：`@visactor/vtable`、`@visactor/vtable-editors`、`hucre`
- **peer**：`@cat-kit/core`、`vue`、`@veltra/desktop`、`@veltra/icons`、`@veltra/utils`、`@veltra/styles`
- **被依赖**：playground

## 已知限制

- undo 按 sheet 分栈，跨表交错撤销可能短暂显示过期缓存（再触发重算自愈）。
- 替换 = 整格覆盖（非 Excel 子串）；公式格不参与替换。
- 公式栏补全 / 引用选择仅 fx 输入栏，网格内编辑器无同等能力。
- 未做：字体族、数字格式、图表、协同、列宽持久化、双击填充柄。

## 验证

```bash
cd packages/sheet && vp test
vp run -F @veltra/sheet build
bun run lint
```
