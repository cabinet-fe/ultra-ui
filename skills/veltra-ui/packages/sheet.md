# @veltra/sheet

电子表格包：基于 `@visactor/vtable`（ListTable）渲染，**数据模型完全自持有，VTable 只做视图层**。单元格读写、合并单元格、公式（含跨表引用）、undo/redo（命令系统）、填充柄、行高、**冻结行列**、**查找/替换**、右键合并菜单、工具栏扩展机制、**单元格样式系统（背景填充 / 四边边框，样式池按内容去重）**、**公式栏（名称框 + fx 输入栏）**、**导入导出（XLSX / CSV，hucre 引擎）**、`USheet` 组件。

```ts
import { USheet, Workbook, registerTool } from '@veltra/sheet'
import type { SheetProps, SheetExposed, SheetTool, SheetContext } from '@veltra/sheet'
import '@veltra/sheet/vue/style'
```

宿主需安装 peer `@veltra/desktop`（右键菜单）。

## 分层与入口选择

- **`USheet` 组件**（多数场景）：toolbar + formula-bar + grid + 底部 sheet tabs，一个组件即用。
- **无头 / 自组 UI**：`Workbook`（多 sheet + 共享公式依赖图）→ `Sheet`（统一操作入口）；
  `SheetGrid`（VTable 适配层，自行挂载到容器）。core 不依赖 vue/desktop，可单独测试与复用。
- 组件高度由宿主控制（grid 区 `flex:1`），需给 `.u-sheet` 一个高度。
- 交互：填充柄（复制 / 数字日期等差 / 公式 `$` 感知位移）、行高拖拽（稀疏存模型、不进 undo）、
  冻结行列（模型持有、不进 undo）、查找/替换（Ctrl/Cmd+F 或工具栏「查找」）、右键合并/取消合并、
  编辑中方向键只移光标。
- **公式栏**：名称框显示/输入选区地址（回车跳转、非法提示不写入）；fx 输入栏显示活动格内容
  （公式格显示原文 `=f`），聚焦编辑后 Enter/✓ 提交（`'='` 前缀自动公式路径）、Esc/✗ 取消；
  与网格双向同步（网格侧变化即时刷新，公式栏编辑期间网格事件不打断输入）；
  网格双击编辑时公式栏镜像实时文本；`showFormulaBar`（默认 true）控制显隐。
- 底部 sheet tabs：点击切换；末尾「+」添加并自动激活；tab 右键「重命名」（行内输入，
  冲突提示不写入）/「删除」（二次确认，最后一个 sheet 禁删）。

## 核心约定

- 坐标 0-based：`{ row: 0, col: 0 }` 即 A1；`CellRange` 闭区间、start 恒为左上角。
- 一切写操作（`setCellValue` / `setCellFormula` / `mergeCells` / `setCells` / `setCellStyle` / `clearCellStyle` …）都走命令系统，
  天然可 `undo()` / `redo()`；`'='` 前缀输入自动走公式路径。
- 合并：锚点恒为区域左上角、数据只存锚点；`getCellInfo` 区分普通格/锚点/被覆盖格。
- 读语义两种：`getCellData`（原始存储，被覆盖格 → undefined）/ `getDisplayValue`（锚点解析）。
- 公式：`f` 存原文、`v/t` 存计算缓存；跨表引用 `Sheet2!A1`；循环引用 → `#CYCLE!`；
  函数注册表可经 `registerFormulaFunction` 扩展。
- 快照：`sheet.snapshot()` 返回 `{ cells, styles, merges, frozen }`（宿主 JSON 序列化持久化），
  `sheet.restore(snap)` 整体还原（冻结变化发 `frozen-change`）。

## 多 Sheet 管理（Workbook）

- `workbook.addSheet(name?)` / `removeSheet(name)` / `renameSheet(oldName, newName): boolean` /
  `activateSheet(name)` / `getSheet(name)` / `getSheets()`；`sheet.name` **只读**（改名唯一入口
  `renameSheet`，直接赋值被类型系统拒绝）。
- `renameSheet` 校验：trim 后空名拒绝；与现有表重名拒绝（不区分大小写，含自身大小写变体）。
  **改名后跨表公式引用跟随新名**（依赖图按名重索引）；发 `sheet-rename` 事件
  `{ sheet, oldName, newName }`（增删发 `sheets-change`，改名不发）。
- `removeSheet`：至少保留一个（最后一个返回 false）；**删除即重算引用方 → `#REF!`**
  （含传递依赖者，不入 undo）；删除激活项 → 激活相邻项。
- Sheet 增删改名**不走 undo**，也**不经 `SheetContext`**（门面只管单元格操作）——
  宿主直接操作 `Workbook`，USheet 的 tabs UI 内部直接调用。

## 冻结行列与查找替换

- **冻结**（Excel 语义，模型持有、**不进 undo**、随快照序列化）：
  `sheet.setFrozen(rows, cols)` / `sheet.frozen`（读）；`frozen-change` 事件。
  工具：冻结到当前行列 / 冻结首行 / 冻结首列 / 取消冻结（`active` 高亮读当前冻结值）。
  VTable 映射：模型 `rows` → `frozenRowCount = rows + 1`（列头行），`cols` → `frozenColCount = cols + 1`（行号列），
  变更即时生效、tab 切换重建时还原。
- **查找**：`core/find` 纯函数 `findAll` / `findNext` / `findPrev`（行主序、到边界循环）；
  options：`caseSensitive`、`wholeCell`（整格）、`searchIn: 'value' | 'formula'`
  （value 匹配显示值 `getDisplayValue`，formula 匹配公式原文 `f`）。
- **查找条**（USheet 内）：关键词 + 上一个/下一个 + 命中计数 + 关闭（Enter=下一个、Shift+Enter=上一个）
  - 替换/全部替换（写入走 `ctx.setCells`，全部替换 = 单 undo 单元）；Ctrl/Cmd+F 开合。
- **选区回驱**：模型 `selectCell`/`selectRange` → VTable 高亮（`selectCells`）+ `scrollToCell` 滚动可见
  （查找跳转依赖；回驱期间 VTable 事件不回写模型，无递归）。

## 行列插入/删除（结构变更）

- **Sheet 方法**：`insertRows(at, count = 1)` / `insertCols(at, count = 1)` /
  `deleteRows(at, count = 1)` / `deleteCols(at, count = 1)`（at 之前插入、删除 `[at, at + count)`
  区间），全部可 undo/redo；数据、合并（锚点平移/裁剪）、行高、公式引用
  （含跨表引用、`$` 绝对引用；引用目标被删 → `#REF!`）按 Excel 语义平移。
- `Sheet.rows` / `Sheet.cols` 表格尺寸随操作增长，随快照（`snapshot` / `restore`）持久化；
  结构变化发 `structure-change` 事件（grid 层据此调整渲染行列数）。
- **SheetContext 方法**：同签名 `insertRows` / `insertCols` / `deleteRows` / `deleteCols`
  （工具门面，走同一命令系统，可 undo）。
- **内置工具**（工具栏 structure 组）：`insert-rows`（插入行）/ `insert-cols`（插入列）/
  `delete-rows`（删除行）/ `delete-cols`（删除列），以活动格坐标为准（插入到活动行上方/活动列左侧、
  删除活动行/列），无活动格时禁用；单元格右键菜单含这四项。

## 单元格样式（填充 / 边框）

- **样式池**：样式定义集中存储、按内容去重；单元格只存 `CellData.s: StyleId`
  （相同样式无论多少格共享一份定义，序列化体积小）。`Sheet.stylePool` 可 `intern/get/snapshot/restore`。
- **API**：`sheet.setCellStyle(range, partial)`（部分合并：只给 fill 保留既有 border，反之亦然；
  `fill: {}` = 清除填充保留边框；`border` 字段存在即**边级合并**——边值为对象与既有边合并
  （缺失字段保留，无既有边补全 thin/1px/#000000），边值为 `null` 删除该边，未列出的边保留；
  清除全部边框需显式给出四边 `null`）、`clearCellStyle(range)`（删除样式保留值）、
  `getCellStyle(addr)`（原始存储语义）。样式写入全部可 undo/redo，批量选区 = 单 undo 单元。
- **边框预设**（`buildBorderPresetItems(range, preset, edge, getStyle)`，core 纯函数）：
  `'all' | 'outer' | 'bottom' | 'none'` 四预设展开为逐格补丁并**同步邻居共享边**
  （外边框/无边框清选区外一圈邻居的对侧边，下边框清下一行邻居 top），一次应用 = 单 undo
  单元（undo 自动还原邻居）。边框工具面板即基于此函数。
- **内置工具**（工具栏）：填充颜色（调色板 + 无填充）、边框（全边框/外边框/下边框/无边框 + 线型/颜色）；
  均为弹层型工具（`popup` 字段），面板打开期间的写入合并为一个 undo 单元。
- 编辑值 / 写公式 / 公式重算不丢失样式；`CellStyle` 预留 `font` / `numFmt` 扩展位（本期未实现）。

## 工具扩展（toolbar）

工具栏渲染全局默认注册表（`defaultToolRegistry`）的内容；内置工具（撤销/重做/合并/取消合并）
与自定义工具同通道注册，可 `unregisterTool(id)` 移除或同 id 覆盖：

```ts
registerTool({
  id: 'insert-date',
  title: '插入当前日期',
  icon: Calendar, // 可选，Vue 组件
  group: 'demo', // 分组渲染，组间分隔符
  order: 0, // 组内排序
  disabled: (ctx) => !ctx.getSelection().activeCell,
  onClick: (ctx) => {
    const active = ctx.getSelection().activeCell
    if (active) ctx.setCellValue(active, new Date().toLocaleDateString('sv-SE'))
  }
})
```

- **`SheetContext` 是工具的唯一操作门面**：选区读写、取值、冻结读写、`workbook` 只读引用、
  命令执行、`selection-change` / `history-change` / `frozen-change` 订阅；写方法全走命令系统
  （扩展天然可 undo，冻结除外——`setFrozen` 不进 undo），不暴露 Sheet 实例。
  tab 切换后上下文自动指向当前活动 sheet。
- 同 id 重复注册 = 替换（保留原位置）；`visible?(ctx)` / `disabled?(ctx)` / `active?(ctx)`
  （激活高亮，vue 层渲染 `is-active`）在状态变化时重新求值。
- 弹层型工具（`popup` 字段）：`fill-color` / `border`（面板写入事务包裹为单 undo 单元）、`find`（查找条）、`import`（文件选择面板）。
- 注册表全局共享：所有 `USheet` 实例显示同一组工具，各自上下文绑定各自工作簿。

## 导入导出（XLSX / CSV）

基于 `hucre`（零依赖纯 TS）的导入导出，`core/io` 纯 TS 可无头使用：

```ts
import { exportWorkbookXlsx, exportSheetCsv, importXlsx, importCsv } from '@veltra/sheet'

const buffer = await exportWorkbookXlsx(workbook) // Uint8Array（多 sheet）
const csv = exportSheetCsv(sheet) // CSV 字符串（UTF-8 BOM，公式导计算值）
const wb = await importXlsx(buffer) // 新 Workbook
importCsv(text, sheet) // 写入既有活动表（事务 = 单 undo 单元）
```

- **导出保真**：值（数字/字符串/布尔/错误/日期序列）、公式（`f` 不带 `=`，缓存值 → formulaResult）、
  合并、样式（fill + 四边 border；hucre 无边宽字段）、冻结、行高（px ↔ points 互转）。
- **导入保真**：`readXlsx(buf, { readStyles: true })`；样式经 `StylePool.intern` 内容去重
  （同样式只 intern 一份）；theme 色经 `wb.themeColors` 解析；线型 12 种收敛到模型 5 种；
  公式缓存由本地引擎重算（不支持的函数 → `#ERROR!`）；日期 → 1900 序列 `t='d'`。
- **每 sheet 导入 = 单 undo 单元**：undo 恢复导入前状态（清空 + 写入 + 合并同事务）。
- **内置工具**（工具栏 file 组）：导出 xlsx / 导出 csv（Blob 下载）、导入（弹层选择文件；
  csv 直接写入活动表，xlsx 确认后替换当前工作簿——结构变更不走 undo，数据写入可 undo）。
- **`SheetContext.workbook`**：只读工作簿引用（导入导出等工具需要；无 workbook 时导出工具空操作）。
  创建上下文 `createSheetContext(sheet, workbook?)` 可传第二参。

## 组件 API 摘要

- **Props**：`workbook?`（缺省内部自建）、`rows?`(100)、`cols?`(26)、`showToolbar?`(true)、
  `showFormulaBar?`(true)、`showTabs?`(true)
- **Emits**：`active-sheet-change`
- **Exposed**（`SheetExposed`）：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`

## 已知限制

跨表 undo 历史按 sheet 分栈；字体 / 数字格式等样式扩展（模型层预留）。
详见 `packages/sheet/AGENTS.md`。
