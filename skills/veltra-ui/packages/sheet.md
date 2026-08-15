# @veltra/sheet

电子表格包：基于 `@visactor/vtable`（ListTable）渲染，**数据模型完全自持有，VTable 只做视图层**。单元格读写、合并单元格、公式（含跨表引用）、undo/redo（命令系统）、填充柄、行高、**冻结行列**、**查找/替换**、右键合并菜单、工具栏扩展机制、**单元格样式系统（填充 / 边框 / 字体颜色加粗斜体下划线删除线 / 字号 / 对齐 / 换行，样式池按内容去重）**、**公式栏（名称框 + fx 输入栏）**、**浮动图片（插入 / 两点锚定叠层 / 拖动 / 删除 / xlsx round-trip）**、**导入导出（XLSX / CSV，hucre 引擎）**、`USheet` 组件；**报表设计器 `UReportDesigner` / 查看器 `UReportViewer`**（ADR-0003）；报表纯 TS 内核（`renderReport` / `DataConnector` / `ReportTemplate` 等）与 **`resolveCellRenderer` 按格自定义渲染**（ADR-0004，经 `USheet` / `SheetGrid` 对称 hook）。

> 数据模型 / 公式 / IO / SheetGrid 渲染层（core/grid）在 **`@veltra/sheet-core`**（独立发包）；本包**不 re-export** 其符号——core API 一律 `from '@veltra/sheet-core'` 直导（无头场景同样直接用它），见 `packages/sheet-core.md`。

```ts
import {
  USheet,
  UReportDesigner,
  UReportViewer,
  registerTool,
  createHttpConnector,
  renderReport
} from '@veltra/sheet'
import type {
  SheetProps,
  SheetExposed,
  SheetTool,
  SheetContext,
  ReportDesignerProps,
  ReportViewerProps,
  DataConnector,
  ReportTemplate
} from '@veltra/sheet'
import { Workbook, registerFormulaFunction, listFormulaFunctions } from '@veltra/sheet-core'
import type { FormulaFunctionMeta, SheetImage, ImageInput } from '@veltra/sheet-core'
import '@veltra/sheet/components/sheet/style'
import '@veltra/sheet/components/report/style'
```

宿主需安装 peer `@veltra/desktop`（右键菜单）。

## 分层与入口选择

- **`UReportDesigner` / `UReportViewer`**（报表场景）：设计态编排 + 运行态取数展开；样式 `@veltra/sheet/components/report/style`（自含 USheet 与 Filter Bar 桌面组件样式）。见下文「报表组件与内核」。
- **`USheet` 组件**（多数场景）：toolbar + formula-bar + grid + 底部 sheet tabs，一个组件即用。
- **无头 / 自组 UI**：`Workbook`（多 sheet + 共享公式依赖图）→ `Sheet`（统一操作入口）；
  `SheetGrid`（VTable 适配层，自行挂载到容器；`readonly: true` 即只读预览）。
  core/grid 已迁至 **`@veltra/sheet-core`**（不依赖 vue/desktop，可单独测试与复用）——
  一律 `from '@veltra/sheet-core'` 直导（本包不 re-export）。细节（导出分组、IO 保真度、
  readonly 语义、深导入注意）见 `packages/sheet-core.md`。
- 组件高度由宿主控制（grid 区 `flex:1`），需给 `.u-sheet` 一个高度。
- 交互：填充柄（复制 / 数字日期等差 / 公式 `$` 感知位移）、行高拖拽（稀疏存模型、不进 undo）、
  冻结行列（模型持有、不进 undo）、查找/替换（Ctrl/Cmd+F 或工具栏「查找」）、
  右键菜单（body 合并/插入图片；行号/列头插入删除与冻结）、编辑中方向键只移光标。
  浮动图片：工具栏「插入图片」或右键选文件，锚定活动格；叠层渲染（宽高优先 width/height，
  缺失且有 `to` 时按 from→to 跨度兜底）；选中后可拖动平移锚点（含格内像素偏移）；Delete 删除。
- **公式栏**：名称框显示/输入选区地址（回车跳转、非法提示不写入）；fx 输入栏显示活动格内容
  （公式格显示原文 `=f`），聚焦编辑后 Enter/✓ 提交（`'='` 前缀自动公式路径）、Esc/✗ 取消；
  与网格双向同步（网格侧变化即时刷新，公式栏编辑期间网格事件不打断输入）；
  网格双击编辑时公式栏镜像实时文本；`showFormulaBar`（默认 true）控制显隐。
  **函数补全**：`=` 后弹出候选（`listFormulaFunctions` 前缀过滤，上限 10；签名 + 中文说明）；
  ↑↓ / Tab / Enter / 点击确认为 `NAME(`。**引用选择**：运算符/`(`/`,` 后点选/拖选画布插入
  `A1` / `A1:B2`（blur 抑制，不回写模型选区）；非引用选择场景失焦仍提交。
- 底部 sheet tabs：点击切换；末尾「+」添加并自动激活；tab 右键「重命名」（行内输入，
  冲突提示不写入）/「删除」（二次确认，最后一个 sheet 禁删）。

## 核心约定

- 坐标 0-based：`{ row: 0, col: 0 }` 即 A1；`CellRange` 闭区间、start 恒为左上角。
- `setCellValue` 经 `normalizeInputValue` 把数字文本 / `TRUE`·`FALSE` 规范化为 number/boolean
  （对齐 Excel 键入；前导 `'` 强制文本）；显式 `setCell`/`setCells` 可保留 `t:'s'`。
- 一切写操作（`setCellValue` / `setCellFormula` / `mergeCells` / `setCells` / `setCellStyle` / `clearCellStyle` …）都走命令系统，
  天然可 `undo()` / `redo()`；`'='` 前缀输入自动走公式路径。
- 合并：锚点恒为区域左上角、数据只存锚点；`getCellInfo` 区分普通格/锚点/被覆盖格。
- 读语义两种：`getCellData`（原始存储，被覆盖格 → undefined）/ `getDisplayValue`（锚点解析）。
- 公式：`f` 存原文、`v/t` 存计算缓存；跨表引用 `Sheet2!A1`；循环引用 → `#CYCLE!`；
  函数注册表可经 `registerFormulaFunction` 扩展；`listFormulaFunctions()` 枚举名称与可选
  `meta`（`params` / 中文 `description`）供补全 UI（无 meta 时仅显示名称）。
- 新建 / `addSheet` 默认选中 A1（名称框、画布高亮、fx 输入栏联动）。
- 快照：`sheet.snapshot()` 返回
  `{ cells, styles, merges, frozen, rows, cols, selection?, rowHeights?, images? }`
  （宿主 JSON 序列化持久化）；`sheet.restore(snap)` 整体还原（冻结变化发 `frozen-change`；
  选区静默还原、旧快照无 `selection` 回落 A1、无 `rowHeights` 则无自定义行高、
  无 `images` 则无图片）。选区不进 undo 历史。
- 导入 xlsx 无法恢复文件中的选中格（hucre 不解析 OOXML `<selection>`）→ 默认 A1；
  导出写入 `activeTab`（活动表）。

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
  入口在行列头右键菜单（工具栏无 freeze 组）。
  VTable 映射：模型 `rows` → `frozenRowCount = rows + 1`（列头行），`cols` → `frozenColCount = cols + 1`（行号列）；
  `showColHeader`/`showRowHeader` 为 false 时不加 +1。
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
  区间），全部可 undo/redo（删除区间内单元格数据随 undo 还原）；数据、合并（锚点平移/裁剪）、
  行高、公式引用（含跨表引用、`$` 绝对引用；引用目标被删 → `#REF!`）按 Excel 语义平移。
- `Sheet.rows` / `Sheet.cols` 表格尺寸随操作增长，随快照（`snapshot` / `restore`）持久化；
  结构变化发 `structure-change` 事件（grid 层据此调整渲染行列数）。
- **SheetContext 方法**：同签名 `insertRows` / `insertCols` / `deleteRows` / `deleteCols`
  （工具门面，走同一命令系统，可 undo）。
- **工具栏无 structure 组**；行列插入/删除仅经**行号/列头**右键菜单（body 不含）。
- **右键菜单**：
  - body：合并 / 取消合并 / **插入图片**（无插入/删除行列）。
  - 行号：在上方/下方插入 [N] 行 / 删除行 / 冻结到当前行 / 取消冻结；落点不在选区时先选中整行。
  - 列头：左侧/右侧插入列 / 删除列 / 冻结到当前列 / 取消冻结（对称）。

## 浮动图片

类型（`@veltra/sheet-core` 主入口导出）：

```ts
type SheetImageType = 'png' | 'jpeg' | 'gif' | 'svg' | 'webp'

interface SheetImageAnchor {
  from: CellAddress & { offsetX?: number; offsetY?: number } // 格内像素偏移（px，缺省 0）
  to?: CellAddress
}

interface SheetImage {
  id: string
  data: Uint8Array
  type: SheetImageType
  anchor: SheetImageAnchor
  width?: number
  height?: number
  altText?: string
  title?: string
}

interface ImageInput {
  id?: string // 缺省由命令生成
  data: Uint8Array
  type: SheetImageType
  anchor: SheetImageAnchor
  width?: number
  height?: number
  altText?: string
  title?: string
}
```

**SheetContext 门面**（写入经命令，可 undo）：

```ts
ctx.insertImage(input: ImageInput): string // 返回 id
ctx.removeImage(id: string): void
ctx.updateImage(id: string, patch: ImageUpdateFields): void
ctx.getImages(): readonly SheetImage[]
ctx.onImageChange(handler: (payload: { id?: string }) => void): () => void
```

- 渲染：grid 容器 DOM 叠层；`from` 定左上并叠加格内像素偏移 `offsetX/offsetY`；宽高优先取
  width/height（xlsx 导入的精确 px），宽高缺失且有 `to` 时按 from→to 跨度兜底（Excel
  `twoCellAnchor`），都缺失时取自然尺寸。随滚动/冻结/行高重排。
- 拖动：选中后 pointer 拖动，落点反查单元格经 `updateImage` 平移 `from`（有 `to` 则同
  delta，保持跨度/宽高），格内像素余量写回 `offsetX/offsetY`（自由定位不吸附）；可 undo。
- 结构联动：插入/删除行列时锚点平移；锚点区间被完整删除时图片移除。
- **内置工具** `insert-image`：组 `insert`，`popup: 'insert-image'`（UFilePicker，
  accept `.png,.jpg,.jpeg,.gif,.svg,.webp`）；无活动格时禁用。
- xlsx 导入导出保留浮动图；CSV 忽略；单元格内嵌图本期不支持。

## 单元格样式（填充 / 边框 / 字体 / 对齐）

- **样式池**：样式定义集中存储、按内容去重；单元格只存 `CellData.s: StyleId`
  （相同样式无论多少格共享一份定义，序列化体积小）。`Sheet.stylePool` 可 `intern/get/snapshot/restore`。
- **API**：`sheet.setCellStyle(range, partial)`（部分合并：顶层浅合并；
  `fill: {}` = 清除填充；`border` **边级合并**——边值为对象与既有边合并，`null` 删边；
  `font` / `align` **逐字段浅合并**，`font: {}` / `align: {}` 清除该类，字段 `null` 删单字段）、
  `clearCellStyle(range)`、`getCellStyle(addr)`。全部可 undo/redo，批量选区 = 单 undo 单元。
- **文本样式**：`font`（`color` / `bold` / `italic` / `underline` / `strikethrough` / `size` pt）、
  `align`（`horizontal` left|center|right、`vertical` top|middle|bottom、`wrap`）。
  导入 xlsx 还原字体颜色等；导出反向无损（vertical middle ↔ Excel center）。
- **边框预设**（`buildBorderPresetItems`）：`'outer' | 'inner' | 'all' | 'top' | 'bottom' | 'left' | 'right' | 'none'`
  （外边框 / 内边框 / 所有边框 / 上 / 下 / 左 / 右边框 + 无边框）+ 邻居共享边同步。
- **内置工具**（图标化）：cell 组边框/填充/合并；**text 组** B/I/U/S、对齐×6、换行、
  字体颜色/字号弹层。填充/边框/字体色/字号面板期间写入 = 单 undo 单元。
- 编辑值 / 写公式 / 公式重算不丢失样式；预留 `fontFamily` / `numFmt`（本期未实现）。

## 工具扩展（toolbar）

工具栏图标化渲染全局默认注册表（`defaultToolRegistry`）：组序
`history ｜ cell ｜ text ｜ edit ｜ insert ｜ file`（图标 + UTip tooltip）。
内置工具与自定义工具同通道注册，可 `unregisterTool(id)` 移除或同 id 覆盖：

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

- **`SheetContext` 是工具的唯一操作门面**：选区读写、取值、冻结读写、浮动图片、
  `workbook` 只读引用、命令执行、`selection-change` / `history-change` / `frozen-change` /
  `image-change` 订阅；写方法全走命令系统（扩展天然可 undo，冻结除外——`setFrozen` 不进
  undo），不暴露 Sheet 实例。tab 切换后上下文自动指向当前活动 sheet。
- 同 id 重复注册 = 替换（保留原位置）；`visible?(ctx)` / `disabled?(ctx)` / `active?(ctx)`
  （激活高亮，vue 层渲染 `is-active`）在状态变化时重新求值。
- 弹层型工具（`popup` 字段）：`fill-color` / `border` / `font-color` / `font-size`
  （面板写入事务包裹为单 undo 单元）、`find`（查找条）、`insert-image`（文件选择）、
  `export`（导出 xlsx/csv 选择面板，不参与事务）。`import` 无弹层：点击直接系统文件选择
  （`components/sheet/import-file.ts`）。
- 注册表全局共享：所有 `USheet` 实例显示同一组工具，各自上下文绑定各自工作簿。

## 导入导出（XLSX / CSV）

基于 `hucre`（零依赖纯 TS）的导入导出，实现在 `@veltra/sheet-core` 的 `core/io`（纯 TS 可无头使用，
保真度细节见 `packages/sheet-core.md`），经其主入口导入：

```ts
import { exportWorkbookXlsx, exportSheetCsv, importXlsx, importCsv } from '@veltra/sheet-core'

const buffer = await exportWorkbookXlsx(workbook) // Uint8Array（多 sheet）
const csv = exportSheetCsv(sheet) // CSV 字符串（UTF-8 BOM，公式导计算值）
const wb = await importXlsx(buffer) // 新 Workbook
importCsv(text, sheet) // 写入既有活动表（事务 = 单 undo 单元）
```

- **导出保真**：值（数字/字符串/布尔/错误/日期序列）、公式（`f` 不带 `=`，缓存值 → formulaResult）、
  合并、样式（fill + 四边 border + font + alignment；hucre 无边宽字段）、冻结、行高（px ↔ points 互转）、
  **浮动图片**（字节 / 类型 / 锚点 / 尺寸；CSV 导出忽略图片）。
- **导入保真**：`readXlsx(buf, { readStyles: true })`；样式经 `StylePool.intern` 内容去重
  （同样式只 intern 一份；含字体颜色等文本样式）；theme 色经 `wb.themeColors` 解析；
  线型 12 种收敛到模型 5 种；公式缓存由本地引擎重算（不支持的函数 → `#ERROR!`）；
  日期 → 1900 序列 `t='d'`；浮动图写入模型（WPS `cellImages` 跳过）。
- **每 sheet 导入 = 单 undo 单元**：undo 恢复导入前状态（清空 + 写入 + 合并同事务）。
- **内置工具**（工具栏 file 组）：导出（单按钮 → xlsx / csv 面板）（Blob 下载）、导入（点击直接
  系统文件选择；csv 直接写入活动表，xlsx 确认后替换当前工作簿——结构变更不走 undo，数据写入可 undo）。
- **`SheetContext.workbook`**：只读工作簿引用（导入导出等工具需要；无 workbook 时导出工具空操作）。
  创建上下文 `createSheetContext(sheet, workbook?)` 可传第二参。

## 组件 API 摘要

### USheet

- **Props**：`workbook?`（缺省内部自建）、`rows?`(100)、`cols?`(26)、`showToolbar?`(true)、
  `showFormulaBar?`(true)、`showTabs?`(true)、`showRowHeader?`(true)、`showColHeader?`(true)、
  `readonly?`、`resolveDisplayValue?`、
  `resolveCellStyle?`、**`resolveCellRenderer?`**（按格 customLayout，见下）
- **Emits**：`active-sheet-change`
- **Exposed**（`SheetExposed`）：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`

### resolveCellRenderer（ADR-0004）

`USheet` 与 `@veltra/sheet-core` 的 `SheetGrid` 对称提供 `resolveCellRenderer` hook：视口渲染时按格回调（表格坐标转模型地址，合并格落锚点；第二参 `base` 为单元格原始值），返回 VTable `customLayout` 对象则自定义渲染，返回 `undefined` 回落默认渲染。**不写模型、不进快照**。布局构建用 sheet-core 导出的 `CustomLayout`（`Container` / `Text` / `Rect` 等）与类型 `ICustomLayoutObj`、`ResolveCellRenderer`。

性能契约：纯函数、同步、O(1) 查找、禁止大对象分配（见 `packages/sheet-core/AGENTS.md`）。

```ts
import { CustomLayout, type ResolveCellRenderer } from '@veltra/sheet-core'

const resolveCellRenderer: ResolveCellRenderer = (addr, base) => {
  // 按 addr / base 决定是否自定义；未命中返回 undefined
  return { rootContainer: new CustomLayout.Container({/* ... */}), renderDefault: false }
}
```

## 报表组件与内核（ADR-0003）

### 数据连接器 DataConnector

报表取数经 **`DataConnector`** 接口（`test` / `describe` / `query`），前端包**零数据库驱动**。内置 **`createHttpConnector({ endpoint })`**：`POST {endpoint}/test|describe|query`（无版本段），请求体分别为 `{ connection }` / `{ connection, sql }` / `{ connection, sql, values }`；业务错误一律 `200 + { ok: false, error: { code, message } }` 原样透传，传输层错误折叠为 `{ ok: false, error }`，**连接器不抛异常**。

```ts
import { createHttpConnector } from '@veltra/sheet'
import type { DataConnection, DataConnector } from '@veltra/sheet'

const connector = createHttpConnector({ endpoint: '/api/report' })
// connections 纯序列化对象，仅驻留内存；凭据持久化由宿主负责
```

### ReportTemplate 与纯函数内核

`ReportTemplate` = `SheetSnapshot` + **`version: number`（当前 `1`，必填）** + 内嵌 `datasets: ReportDatasetDef[]`（connection 为完整连接对象，可 JSON 序列化）。`version` 缺失或高于当前 → 抛可读错误，存量模板须在设计器中重建。

主入口还导出 `renderReport`（模板 + records → Filled Report 快照）、绑定（`createReportBinding` / `presetBindingPatch` / `applyReportPreset` 等）、条件规则、查询参数（`${param}` → `extractParamIds` / `buildParamDefs`）、`fetchTemplateRecords`、`exportFilledReportXlsx`、Filter Bar 值规范化等纯 TS 函数（`src/report/`，框架无关、无 DOM）。

**`ReportBinding`（breaking，ADR-0005）**：

```ts
type ReportExpand = 'down' | 'right' | 'none'
type ReportAggregate = 'list' | 'group' | 'sum' | 'avg' | 'count' | 'max' | 'min'
type ReportPreset = 'groupHeader' | 'detail' | 'subtotal' | 'grandTotal' | 'cross'

interface ReportBinding {
  dataset: string
  field: string
  expand: ReportExpand
  aggregate: ReportAggregate
  rowParent?: CellAddress // 行方向从属父格
  colParent?: CellAddress // 列方向从属父格
  mergeSpan?: boolean // 扩展实例是否合并；缺省 true
  sort?: ReportSort
  conditionalRules?: ConditionalRule[]
  preset?: ReportPreset // 设计器标签，引擎不读
}

interface ConditionalRule {
  operator: ConditionalOperator
  value: unknown
  style: CellStylePatch
  field?: string // 求值字段；缺省取绑定格自身字段
  scope?: 'cell' | 'row' // 作用范围；缺省 'cell'
}
```

已删除：`role` / `leftParent` / `resolveReportRole` / `isExpandingBinding` 等。`select` 聚合更名为 `list`；新增 `max` / `min`。

### UReportViewer（运行态）

- **Props**：`connector`（必填）、`template`（必填，`ReportTemplate`）、`workbook?`、`colWidths?`
- **Exposed**：`refresh()` — 重新取数并展开渲染；`exportXlsx()` — 导出填充报表 XLSX（取数完成前拒绝）
- 内部闭环：从模板实际绑定数据集提取查询参数并集 → Filter Bar → `fetchTemplateRecords` → `renderReport` → 只读 USheet 展示（无行列头；网格铺到内容尺寸，无 50×10 下限）；loading 遮罩与业务错误 banner

### UReportDesigner（设计态）

- **Props**：`connector`（必填）、`v-model:connections`、`template?`（载入既有模板继续设计）、`workbook?`
- **Emits**：`update:connections`、`datasets-change`（数据集变更或数据中枢关闭）
- **Exposed**：`getTemplate()` — 取回含 `version`、meta 绑定与内嵌数据集定义的 `ReportTemplate`
- 设计态：数据中枢 drawer、字段面板 HTML5 拖拽绑定（落格推断：同行向左/上方整行扫描行父格、同列向上/左侧整列扫描列父格；小计优先分组头）、预设徽章（`resolveCellRenderer`）、Action Pill（默认条含预设与互补的展开方向或聚合函数、条件样式、删除绑定；展开后父格点选 / `mergeSpan`）、拓扑连线（真实 `rowParent` / `colParent`）、条件规则对话框（句式编辑 `field` / 运算符 / 样式 / `scope`）、预览模式（内嵌 `UReportViewer`）、XLSX 导出

## 已知限制

跨表 undo 历史按 sheet 分栈；字体族 / 数字格式等扩展（模型层预留）；
wrap 行高为估算（非精确测字，合并格未按跨度加宽；只升不降，不压矮导入/拖拽行高）。
公式栏补全/引用选择为基础版（仅 fx 栏；无网格内编辑器同等能力、无引用高亮联动、
无拖动调整引用、无参数高亮、无跨 sheet 引用辅助）。
浮动图片无缩放/旋转/剪贴板/单元格内嵌图导入。
详见 `packages/sheet/AGENTS.md` 与 `packages/sheet-core/AGENTS.md`。
