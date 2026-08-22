# @veltra/sheet-core

框架无关的表格核心：数据模型（`Sheet` / `Workbook` / `CellStore`）、命令系统（undo/redo）、公式引擎、xlsx/csv 导入导出（hucre）、VTable 渲染适配层 `SheetGrid`（含浮动图片叠层、**readonly 只读预览模式**、**单元格级只读标记**）。供 `@veltra/sheet`（USheet 编辑器）与 `@veltra/desktop` file-viewer（只读预览）共用。**数据模型完全自持有，VTable 只做渲染与输入**。

不依赖 vue；运行时依赖只有 `@visactor/vtable` / `@visactor/vtable-editors` / `hucre`（都是 dependencies，随包装）。

```ts
import {
  Workbook,
  Sheet,
  importXlsx,
  importCsv,
  exportWorkbookXlsx,
  exportSheetCsv,
  registerFormulaFunction,
  listFormulaFunctions
} from '@veltra/sheet-core'
import { SheetGrid, CustomLayout, type ResolveCellRenderer } from '@veltra/sheet-core/grid'
```

## 何时用哪个包

- 需要完整编辑器 UI（工具栏 / 公式栏 / sheet tabs）→ `@veltra/sheet` 的 `USheet`（见 `packages/sheet.md`）。
- 无头模型操作、xlsx/csv 解析、自组渲染 UI、只读预览 → 本包。
- core 符号只从本包获取：模型 / IO 走主入口，`SheetGrid` / `CustomLayout` 走 `@veltra/sheet-core/grid`；`@veltra/sheet` 不做 re-export。

## 主入口导出分组

- **地址**：`parseAddress` / `formatAddress` / `parseRange` / `createRange` / `iterateRange` / `boundingBox` / `rangesIntersect` 等；类型 `CellAddress` / `CellRange`（坐标 0-based，A1 = `{ row: 0, col: 0 }`，闭区间、start 恒左上角）。
- **CellStore**：`CellStore`、`normalizeInputValue` / `inferCellType`；类型 `CellData` / `CellValue` / `CellType`。
- **模型**：`Sheet`（统一操作入口；类型 `SheetSnapshot` / `FrozenState` / `SheetEvents`）、`Workbook`（多 sheet + 共享公式依赖图）、`SelectionModel`、`MergeManager`、`StylePool`（样式按内容去重）。
- **命令**：`defaultCommandRegistry`、`HistoryManager`、各命令类（`SetCellValueCommand` / `SetCellFormulaCommand` / `SetCellStyleCommand` / `InsertCellsCommand` / `MergeCellsCommand` / `InsertImageCommand` 等）与 `Patch` 系列类型。一切写操作走命令，天然可 `undo()` / `redo()`。
- **公式**：`parseFormula` / `tokenizeFormula` / `evaluateAst` / `DependencyGraph`、`registerFormulaFunction` / `listFormulaFunctions` / `invokeFormulaFunction`。
- **IO**：`importXlsx` / `importCsv` / `exportWorkbookXlsx` / `exportSheetXlsx` / `exportSheetCsv`。
- **渲染**：不在主入口。`SheetGrid`（类型 `SheetGridOptions` / `SheetGridContextMenuInfo`）、**`resolveCellRenderer`**、**`CustomLayout`** 从 `@veltra/sheet-core/grid` 导入。
- **浮动图片**：类型 `SheetImage` / `ImageInput` / `SheetImageAnchor`，`createImageId` 等。
- **查找 / 填充**：`findAll` / `findNext` / `findPrev`；`generateFill` / `computeFillTargetRange`。

主入口是**公开 API 白名单**，未导出的内部符号不要依赖。

## 导入导出（hucre 引擎）

```ts
const wb = await importXlsx(buffer) // ArrayBuffer | Uint8Array → 新 Workbook（多 sheet）；第二参 onProgress?(done,total) 回报分片构建进度
importCsv(text, sheet) // CSV 文本 → 写入既有 Sheet（从 A1 覆盖，事务 = 单 undo 单元）
const buf = await exportWorkbookXlsx(wb) // → Uint8Array
const buf1 = await exportSheetXlsx(sheet, { fallbackName: '报表' }) // 单表导出（含浮动图；表名为空时取 fallbackName）
const csv = exportSheetCsv(sheet) // → CSV 字符串（UTF-8 BOM，公式导计算值）
```

保真度要点：

- **保留**：值（数字 / 字符串 / 布尔 / 错误；日期 ↔ 1900 系统序列 `t='d'`）、**公式表达式**（`f` 不带 `=`，缓存值由本地引擎重算，不支持的函数 → `#ERROR!`）、合并、样式（fill + 四边 border + font + alignment，经 `StylePool.intern` 内容去重；border 线型 12 种收敛到模型 5 种；theme 色经工作簿调色板解析）、冻结、行高（points ↔ px ×4/3 取整）、**浮动图片**（字节 / 类型 / 锚点 / 宽高；WPS `cellImages` 单元格内嵌图跳过；CSV 忽略图片）。
- **不导入 / 忽略**：列宽（模型未持久化列宽）、数字格式 `numFmt`（模型预留、本期忽略）。
- **纯样式格裁剪**：有值范围外扩 100 行/列的「紧邻带」内保留（表头/边框等紧邻格式），带外丢弃——防止「全选设边框」残留（整表十几万空白格式格）把渲染尺寸撑到 Excel 极限导致卡死；带外不可见，丢弃无感知损失；公式格不受裁剪影响。
- 渲染尺寸按「有值格 ∪ 合并 ∪ 行高定义 ∪ 图片锚点」收敛，xlsx 导入只读 `cells` Map，不用 `columns[]` 全长撑到 Excel 极限列数。
- xlsx 导入无法恢复文件中的选中格（hucre 不解析 `<selection>`）→ 默认 A1；导出写入 `activeTab`。
- 大文件 worker 链路：解析+进度回调用主入口 `importXlsx(buffer, onProgress)`；`buildWorkbookFromHucre` / `replaceWorkbookWithSnapshots`（快照替换）不在主入口白名单，需深导入（见下）。

## SheetGrid（VTable 渲染层）

```ts
import { Sheet } from '@veltra/sheet-core'
import { SheetGrid } from '@veltra/sheet-core/grid'

const sheet = new Sheet('Sheet1')
const grid = new SheetGrid({
  container: document.getElementById('stage')!, // 宿主给高度
  sheet,
  rows: 100, // 渲染行数，默认 100
  cols: 26, // 渲染列数，默认 26
  showRowHeader: true, // 行号列，默认 true
  showColHeader: true, // 列字母表头，默认 true
  onContextMenu: (info) => {} // 单元格右键（已 preventDefault），菜单由宿主实现
})

grid.release() // 销毁（含 VTable 实例与图片叠层）
```

- 模型 → 视图自动同步（批量变更微任务合并为一次 flush）；`setVisible(false)` 挂起同步（LRU 缓存用），重新可见时一次性补齐。
- 其它常用方法：`undo()` / `redo()` / `refresh()` / `getTable()`（裸 ListTable）。

### resolveCellRenderer（ADR-0004）

`SheetGridOptions.resolveCellRenderer` 与 `@veltra/sheet` 的 `USheet` 对称：仅在宿主提供 hook 时安装按格 customLayout 分发器；回调接收模型地址与 `base` 单元格值（合并格落锚点），返回 `undefined` 回落默认渲染。配套导出 `CustomLayout` 与类型 `ResolveCellRenderer` / `ICustomLayoutObj`。不写模型、不进快照。cell hook 性能契约：纯函数、同步、O(1)、禁大对象分配。

### readonly 只读预览

```ts
const grid = new SheetGrid({ container, sheet, readonly: true })
```

- **关闭一切写模型入口**：不挂单元格编辑器与编辑回写、禁用填充柄与行/列尺寸拖拽、不绑 undo/redo 快捷键；浮动图片禁拖动与 Delete 删除（仅保留点击选中）。
- **保留**：渲染、选区、滚动、键盘导航、`onContextMenu` 右键回调（菜单内容宿主自定）。
- 注意：模型层不设防，仅守 grid 入口——只读场景宿主不要另行暴露命令/写 API。
- 典型用例：`@veltra/desktop` UFileViewer 的 Excel/CSV 预览（`importXlsx` / `importCsv` 建模型 + readonly SheetGrid 渲染）。

### 单元格级只读（填报场景）

```ts
sheet.setRangeReadonly(range) // 区域整体锁定（事务合并为单 undo 单元）
sheet.setCellReadonly(addr, false) // 解除单格（填报模板：先整表锁定，再放开输入格）
sheet.isCellReadonly(addr) // 查询（合并格解析锚点）
```

- 标记经 Cell Meta 存储（namespace `CELL_READONLY_META_NAMESPACE`，主入口导出）：可 undo、随 `sheet.snapshot()` 序列化、行列插入删除时自动平移。
- **拦截在 SheetGrid**：只读格不开启编辑器（双击 / Enter 均无效）、`CHANGE_CELL_VALUE` 回写守卫（回滚视图）、填充柄跳过只读目标格（从只读格向外复制仍允许）；运行期标记/解除立即生效。模型层不设防（同整表 readonly 约定）。
- USheet 场景：工具栏 / 公式栏不经 grid 守卫，填报宿主需隐藏（`showToolbar` / `showFormulaBar` 等全 false）；输入区视觉高亮走 `resolveCellStyle` hook（返回 `{ ...base, fill }`，遵守纯函数 / 同步 / O(1) 契约）。
- xlsx 导出不携带只读标记（同其它 Cell Meta）。

## 深导入注意事项

- 常规使用**一律走主入口** `from '@veltra/sheet-core'`，无配置负担。
- 白名单外符号（如 `buildWorkbookFromHucre`、`core/io` 内部转换函数）需深导入
  `@veltra/sheet-core/core/...`。包的 `exports["./*"]` 是通配映射，**tsc 不经通配做扩展名探测**，
  消费方直接深导入会解析失败——需在消费方 tsconfig 配 `paths` 兜底：

  ```jsonc
  {
    "compilerOptions": {
      "paths": { "@veltra/sheet-core/*": ["../sheet-core/src/*"] } // 指向源码或 dist 实际路径
    }
  }
  ```

  （monorepo 内参考 `packages/sheet/tsconfig.json`，composite 项目还需配 `references`。）

## 核心约定速览

- 坐标 0-based；空单元格不占存储（`rowCount` / `colCount` 只是渲染高水位）。
- 合并：锚点 = 区域左上角，数据只存锚点；读语义两种：`getCellData`（原始存储）/ `getDisplayValue`（锚点解析）。
- 选区、冻结、行高**不进 undo**；快照 `sheet.snapshot()` 含 `cells / styles / merges / frozen / selection? / rowHeights? / images?`。
- 公式：`f` 存原文、`v/t` 存缓存；跨表引用 `Sheet2!A1`；循环引用 → `#CYCLE!`。
- 工作簿结构操作（增删改名 sheet）走 `Workbook`，不进 undo。

更完整的分层约定、性能要点与已知限制见 `packages/sheet-core/AGENTS.md`。
