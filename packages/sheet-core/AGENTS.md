# AGENTS.md — @veltra/sheet-core

框架无关的表格核心：数据模型 / 命令系统 / 公式引擎 / xlsx/csv IO（`core/`，纯 TS）+ 引擎适配层 SheetGrid（`grid/`，底座 `@infinite-table/core` ListTable）。供 `@veltra/sheet`（USheet 编辑器）与 `@veltra/desktop` file-viewer（只读预览）共用。**数据模型完全自持有，引擎只做渲染与输入**：单元格操作都作用在自己的模型上，引擎经 TableModel 适配直挂模型、被动刷新。

## 目录结构

```
src/
├── index.ts              # 聚合导出（模型/命令/公式/IO 白名单；不含 SheetGrid）
├── core/                 # 框架无关纯 TS（不 import vue / 引擎），可无头单测
│   ├── address.ts        # A1 地址（0-based）
│   ├── cell-store.ts     # 稀疏矩阵
│   ├── cell-readonly.ts  # 单元格只读标记的 Cell Meta namespace（CELL_READONLY_META_NAMESPACE）
│   ├── sheet.ts          # Sheet = store + merge + selection + history + images
│   ├── image.ts          # SheetImage / ImageInput（浮动图片模型）
│   ├── workbook.ts       # 多 Sheet + 共享公式依赖图；addSheet(name, { data, rows, cols }) 可带初始数据
│   ├── command/          # 命令系统（undo/redo；含 insert-image / remove-image）
│   ├── style/            # StylePool + 边框预设
│   ├── formula/          # 公式引擎
│   ├── io/               # xlsx/csv（hucre；浮动图 round-trip）
│   ├── fill.ts / find.ts / merge-manager.ts / selection.ts
│   ├── format.ts         # numFmt 值 → 显示文本纯函数（仅显示，存原始值）
│   └── events.ts
└── grid/                 # 引擎适配层（公开入口 `@veltra/sheet-core/grid`）
    ├── index.ts          # SheetGrid / resolveCellRenderer / hooks 类型等
    ├── sheet-grid.ts     # SheetGrid 门面（Sheet ↔ ListTable；支持 readonly）
    ├── grid-model.ts     # Sheet → TableModel 适配 + 显示/样式 pull 式取值
    ├── grid-selection-controller.ts  # 选区双向同步 + 填充生成接线
    ├── grid-float-images.ts          # 浮动图片 ↔ 引擎 FloatObjectLayer
    ├── grid-row-height-engine.ts     # wrap 行高估算（写模型，只升不降）
    ├── grid-style-map.ts             # 模型 CellStyle → 引擎 CellStyle 纯映射
    ├── grid-coords.ts                # 右键菜单信息 / 命中测试
    └── grid-theme.ts                 # 引擎主题 token（ThemeOverride 常量）
```

## 分层约定

| 层      | 职责                               | 禁止                                                                                              |
| ------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core/` | 模型、命令、公式、IO               | import `vue` / `@infinite-table/*`；dependency 仅 `hucre`，另有 peer `@cat-kit/core`（`>=1.2.1`） |
| `grid/` | 引擎渲染装配、选区/编辑/浮动图接线 | 业务编排；只依赖 `core/` + `@infinite-table/core` 与 `@infinite-table/plugins` 两个公共入口       |

- **禁止反向依赖**：`core/` 不得 import `grid/`；grid 对 core 单向依赖。
- **公开入口拆分**：`@veltra/sheet-core` 只导出模型 / 命令 / 公式 / IO；`SheetGrid` / `resolveCellRenderer` / hooks 类型走 `@veltra/sheet-core/grid`。不要把 grid 符号挂回主入口——否则无头 `import { Workbook }` 会把引擎类型图拉进 TS 语言服务。
- **写操作一律走命令**：`setCellValue` / `setCells` / `setCellFormula` / `setCellStyle` / `mergeCells` / `insertRows` / `insertImage` / `removeImage` / `updateImage` 等经 `defaultCommandRegistry` → `sheet.history`；`Sheet.applyPatch` 是唯一变更通道。
- **工作簿结构操作**（增删改名 sheet）走 `Workbook`，**不进 undo**。

## 核心语义

- **坐标 0-based**：`{ row: 0, col: 0 }` = A1；`CellRange` 闭区间，start 恒为左上角。
- **空单元格不占存储**：无公式且 `v` 为空即删除；`rowCount`/`colCount` 只是渲染高水位。
- **合并**：锚点 = 区域左上角，数据只存锚点；`MergeManager` 只管几何，值保留规则在 `Sheet.mergeCells`。
- **两种读取**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入/选中内部先 `resolveAnchor`。
- **不进 undo**：选区、冻结、行高、列宽。选区可随 `SheetSnapshot.selection?` 序列化；冻结随快照；行高随 `SheetSnapshot.rowHeights?`；列宽随 `SheetSnapshot.colWidths?`。
- **样式**：`CellData.s: StyleId` → StylePool 按内容去重；行/列默认样式 `SheetSnapshot.rowStyles?` / `colStyles?`（同池 StyleId，进 undo，经 `setRowStyle` / `setColStyle`）；有效样式 = 列 → 行 → 格字段级叠加（`composeCellStyles` / `Sheet.getEffectiveStyle`）。部分合并见 `CellStylePatch`（fill 覆盖、border 边级、font/align 逐字段、numFmt 整体替换；`null` 删字段）。边框预设经 `buildBorderPresetItems`（`outer`/`inner`/`all`/`top`/`bottom`/`left`/`right`/`none` → 外边框/内边框/所有边框/上/下/左/右边框 + 无边框；含邻居对侧边同步）。
- **数字格式（numFmt）**：`CellStyle.numFmt`（`date` / `thousands` / `cnUpper` / `fixed(digits)`，见 `core/style/types.ts`）**仅影响显示、单元格恒存原始值**（Excel 式语义）——值 → 显示文本纯函数在 `core/format.ts`（`formatByNumFmt`；日期按 1900 系统序列数、大写金额为中文大写、小数位数四舍五入仅作用于显示），应用在 grid 显示路径（`grid-model.ts` 的 `getSheetDisplayValue`，含公式缓存结果）；`getCellData` / `getDisplayValue` / CSV 导出均为原始值。
- **公式**：`f` 原文（无 `=`），`v`/`t` 为缓存（数值 `v` 仍是 JS `number`，不是 Decimal / 字符串）；重算派生补丁并入同一 undo 单元；undo/redo 纯补丁回放。跨表依赖图在 `Workbook` 级共享。四则 `+` `-` `*` `/` 与 `SUM` / `AVERAGE` / `ROUND` / `ABS` 走 `@cat-kit/core` 的 `$n` / `n().fixed`，结果仍写入 JS `number`（`=1/0`、`=0/0` 仍 `#DIV/0!`）；幂 `^`、百分比 `%`、一元 `+`/`-` 仍用 JS `number`。`registerFormulaFunction` 仍模块级全局、大小写不敏感、同名覆盖；自定义 `impl` 入参为 `(args, ctx?)`（lazy 为 `(nodes, evalNode, ctx?)`，`ctx` 携带公式所在格 `currentCell` / `currentSheet`，可省略），引擎不预处理、不强制 `$n`。易失性语义：函数注册表带 `volatile` 标记（内置 `TODAY` / `NOW` / `RAND` / `RANDBETWEEN`），含易失性函数的公式格在任意单元格变更触发的重算中必重新求值（值未变不产生派生补丁），非易失性公式仍按依赖图增量重算；`TODAY`/`NOW` 返回 1900 系统序列数（本地时间，含伪闰日修正），显示侧由 numFmt 承接。
- **addSheet 初始数据**：`addSheet(name?, { data?, rows?, cols? })`——data 二维数组从 A1 写入（原始值自动推断类型；null/undefined/'' 跳过；对象形式 `{ v, t, f }` 支持公式，写入即注册依赖图并立即重算）；rows/cols 与数据高水位取大（仅传入时校验，非正整数抛错）。初始数据经一次 setCells 写入后 `history.clear()`——基线状态不进 undo，且在 `sheets-change` 发出前就绪。
- **浮动图片**：`SheetImage`（`id` + `anchor.from`/`to?` + 可选宽高/alt/title；`from` 可带格内像素偏移 `offsetX/offsetY`，缺省 0）；来源二选一——`data` 字节（本地文件 / xlsx 导入）或 `src` URL（渲染层直接引用；URL 图 data 为空字节、type 仅作提示，不参与 xlsx 导出/导入）；`fit?` 缩放模式（`fill` 拉伸默认 / `contain` 等比缩放完整显示于锚定区域内，不裁剪、不溢出）；写入经 `insertImage` / `removeImage` / `updateImage`（命令 `sheet.insert-image` / `sheet.remove-image` / `sheet.update-image`，`ImagePatch`）；快照字段 `SheetSnapshot.images?`（含 src/fit）；`restoreContent` 整表替换图片并发 `image-change`。行列插入/删除时锚点平移（offset 随 from 格保留）；锚点区间被完整删除时图片移除（同 undo 单元）。格式：`png` / `jpeg` / `gif` / `svg` / `webp`（与 hucre 对齐）。
- 注：`Sheet.setCell` / `setCellStyles` / `CellStore.setCellValue` 为内部便捷写入口（生产零调用、测试直用），非公开承诺 API——包入口不单独导出，宿主请用 `setCells` / `setCellStyle`。

## cell hook 性能契约（ADR-0004 决策 3）

cell hook 是渲染扩展面（`resolveDisplayValue` / `resolveCellStyle` / `resolveCellRenderer`，见 `grid/sheet-grid.ts`），全部运行在渲染热路径上，必须遵守：

- **纯函数、同步返回**：禁止异步操作（IO/请求/定时器）与副作用；返回 `undefined` 即回落默认行为。
- **O(1) 查找**：按格索引只允许稀疏 Map / 地址直查（Cell Meta 为稀疏 Map），禁止线性扫描或全表遍历。
- **禁止大对象分配**：不构造长数组/大字符串/闭包链；每次调用只分配必要的最小对象。

调用节奏（pull 式取值，均在渲染热路径）：`resolveDisplayValue` 与 `resolveCellStyle` 在每次格内容/样式解析时按格回调（视口可见格 × 渲染次数，样式链为「主题分区 → 模型有效样式 → 宿主 hook」逐字段覆盖）、`resolveCellRenderer` 在格节点重建时回调。**仅宿主提供 renderer hook 时才安装分发器**（默认场景渲染管线零差异）。hook 不写模型、不进快照。嵌入路线分工：格内内容走 renderer hook；跨格浮动内容走浮动图片桥（`grid-float-images.ts`）。

## SheetGrid readonly 模式

`SheetGridOptions.readonly`（构造选项，`grid/sheet-grid.ts`），面向只读预览场景（desktop file-viewer 的 Excel/CSV 预览）：

- **关闭一切写模型入口**：不注册编辑器且 `editCellOnEnter` 关闭（引擎可编三级判定不放行）、填充柄不订阅写值、行/列 resize 能力关闭（`canResizeCol/canResizeRow` 恒 false）、不绑 undo/redo 快捷键；浮动图禁拖动与 `Delete`/`Backspace` 删除（仅保留点击选中）。
- **保留**：渲染、选区、滚动、键盘导航、右键回调（`onContextMenu` 照常触发，菜单内容由宿主决定）。
- **模型层不设防，仅守 grid 入口**——绕过 SheetGrid 直接调命令仍可写模型，宿主只读场景不要暴露命令入口。
- **行列头**：`showRowHeader` / `showColHeader`（默认 true）；false 时引擎构造期归一化为零宽/零高，内容原点回落表体。

## 单元格级只读（填报场景）

`Sheet.setCellReadonly(addr, readonly?)` / `setRangeReadonly(range, readonly?)` / `isCellReadonly(addr)`；标记经 Cell Meta 存储（namespace `CELL_READONLY_META_NAMESPACE = 'cell-readonly'`，payload 恒为 `true`），天然获得：可 undo（setRangeReadonly 事务合并为单 undo 单元）、随 `SheetSnapshot.meta` 序列化、行列插入删除平移、合并格解析锚点。

- **拦截在 grid 层**（模型层不设防，同整表 readonly 约定）：引擎 `resolveEditable` 按格拉取 `sheet.isCellReadonly`（可编三级判定的格级闸门，双击 / Enter 均不进入编辑会话，无回滚路径）；填充柄跳过只读目标格（从只读格向外复制仍允许）。标记在下次编辑尝试时即时生效（pull 式判定，无需清缓存）。
- USheet 的**工具栏 / 公式栏不经 grid 守卫**：填报宿主应隐藏这些写入口（`showToolbar` / `showFormulaBar` 等全 false，参考 playground `sheet-data-entry` 演示页）。
- 视觉区分由宿主经 `resolveCellStyle` hook 叠加（遵守 cell hook 性能契约）；xlsx 导出不含只读标记（同其它 Cell Meta）。

## 浮动图片渲染（grid/grid-float-images.ts）

- **引擎浮动层**：模型图片经 `FloatObjectLayer`（引擎 canvas 浮动层）渲染——`from` 左上 + 格内像素偏移（`from.offsetX/offsetY`，px，缺省 0）；宽高**优先取 `image.width/height`**（xlsx 导入的精确 px，映射为 `FloatObject.size`），宽高缺失且有 `to` 时按 from→to 跨度兜底（Excel `twoCellAnchor` 拉伸语义），都缺失时按位图自然尺寸回写 size。`src` URL 来源直用、字节来源转 objectURL（同引用复用，销毁时 revoke）；`fit: 'contain'` 等比缩放完整显示于锚定区域，缺省 `fill` 拉伸。滚动跟随、选中环、绘制裁剪为引擎浮动层内置；`image-change` / `content-reset` / `structure-change` / 冻结变化全量对齐模型（签名判重跳过无变化项）。
- **交互**：点选/拖拽为引擎指针路由内置（选中环 2px、拖动阈值 3px）；拖拽结束经 `onDragEnd` 换算落点写回 `sheet.updateImage` 平移 `from`（有 `to` 则同 delta，保持跨度；模型无 `to` 的图不引入引擎合成 to），**落点相对目标格左上的像素余量写回 `offsetX/offsetY`（负值 clamp 到 0），自由定位不吸附**；`Delete`/`Backspace` 经命令删除；点网格其他位置取消选中。readonly 时仅保留选中。本期不做缩放/旋转。
- **LRU**：隐藏实例停用模型→引擎同步（只置脏），激活时一次性全量同步。

## 引擎适配要点（grid/ ↔ @infinite-table/core）

- **模型直挂**：`grid-model.ts` 产出 TableModel——`getCellValue` 公式格返回 `'='+f` 原文（编辑初值所见即所编）、其余返回存储值；`setCellValue` 委托 Sheet 命令系统；模型事件经引擎 ModelBinding 局部刷新，echo 由 ModelBinding 吞掉防回环。
- **pull 式取值**：显示（numFmt/公式缓存/宿主 hook）与样式（列→行→格→宿主 hook → 引擎 CellStyle 映射，pt→px 在映射层）按格拉取；模型样式变更靠窗口刷新触发重渲染（`axis-style-change` / 全量 meta 变更 / `content-reset` → 可视窗口逐格 refreshCell，批内合并失效）。
- **冻结无 ±1**：模型冻结数即引擎数据冻结数（引擎行列头不计入冻结计数）；`showRowHeader`/`showColHeader` 由引擎选项承担。
- **合并**：构造期经 `mergeCells` options、运行时 `merge-change` → `setMergeCells` 全量替换（签名判重；模型越界项过滤）；引擎允许跨冻结边界合并区。
- **选区双向同步**：表格 → 模型 `onSelectionChange` 落 `sheet.selectRange`；模型 → 表格 `applyExternalSelection`（引擎侧不广播，天然断回环）+ 不可见活动格 `scrollToCell`；引用选择拦截命中时回推模型选区且不滚动。
- **滚轮宿主接线**：引擎无内置滚轮——容器 wheel → `table.scrollBy(dx, dy)`，`shift+deltaY→deltaX` 换轴 3 行留在本接线内；触控/惯性滚动引擎内置（旧手写 bindTouchScroll 已删）。
- **行高/列宽**：列宽进列定义构造期一次布局；行高覆盖构造后经 `setRowHeight` 落地（SheetBook 同款先例）；拖拽结束 `onRowResizeEnd`/`onColResizeEnd` 写回模型（不进 undo）。
- **结构变更**：引擎表格维度构造期固定——行列插入/删除交宿主重建 SheetGrid 实例（LRU 缓存的 dirty 标记路径不变）。

## 导入导出（core/io）

- 主入口白名单：`exportWorkbookXlsx` / `exportSheetXlsx` / `exportSheetCsv` / `importXlsx` / `importCsv`。整簿替换 `replaceWorkbookWithSnapshots` 与 worker 链路入口 `buildWorkbookFromHucre` 不在白名单，消费方深导入 `@veltra/sheet-core/core/io/import.js`；该文件因此列在 `vite.config.ts` 的 pack `entry` 里——不列入则 `treeshake` 会把主入口图不可达的导出摇掉，消费方打包时报 MISSING_EXPORT。
- `exportSheetXlsx(sheet, { fallbackName? })`：单表导出（与 exportWorkbookXlsx 同一套单表组装 `sheetToHucreWriteSheet`，浮动图随导出保留）；表名取 `sheet.name || fallbackName || 'Sheet'`。
- `importXlsx(buffer, onProgress?)`：第二参数透传 `buildWorkbookFromHucre` 的分片进度回调（每完成一个 sheet 回调一次）；worker 导入链路（`@veltra/sheet` 的 import.worker）经动态 import 深导入本模块驱动进度 UI。
- **IO 保真度约定**：xlsx 导入只读 `cells` Map（不扫稠密 `rows`）；表格尺寸按有值格 ∪ 合并 ∪ 图片锚点收敛，勿用稠密几何或 `columns[]` 全长撑到 Excel 极限列数；纯样式格只保留有值范围外扩 100 的紧邻带；行高/列宽只写入渲染范围内的定义（禁止把默认 `columns[]` 外扩 KEEP_MARGIN 后逐列 setColWidth）。
- **快照整表替换**：`RestoreSheetCommand`（`sheet.restore-sheet`）+ `SnapshotPatch`——导入替换与 undo/redo 回放走整表 `restoreContent`（cells/styles/merges/images/rowStyles/colStyles + 公式图 `rebuildSheet` 重建），不发逐格 cell-change（避免十万级视图同步），发 `content-reset` 事件（grid 全量同步：合并区/尺寸/可视窗口刷新 + 浮动图，状态源 bump）+ `image-change`；冻结/行高/列宽/尺寸/选区不进 undo；跨表引用方经 recalcAfterCommand 联动（含被清空的旧格标脏）。
- **批量**：`Workbook.beginBatch/endBatch` 合并结构事件补发（196 sheet 导入的 195 次 `sheets-change` 收敛为 1 次）；`Sheet.mergeCellsBatch` 批量合并 = 单 undo 单元（批量内相交边收集边应用与逐条语义一致）；样式导入按 hucre 共享子对象引用 + numFmt 字符串组合 key memo 跳过重复解析/intern。
- **numFmt 双向 IO**：导出 `numFmtToXlsx`（date→`yyyy-mm-dd`、thousands→`#,##0.00`、cnUpper→`[DBNum2][$-804]G/通用格式`、fixed(digits)→`0.00…`）；导入 `xlsxNumFmtToModel` 识别外部常见日期（hucre `isDateFormat`）/ 千分位（含会计式变体）/ DBNum2 / 纯 `0.00…`，四类之外忽略（维持现状）。t='d' 格导出恒写日期 numFmt（hucre Date round-trip 保真）；CSV 导原始值不应用显示格式。
- **分片构建**：`buildWorkbookFromHucre` 按 10% 粒度经回调回报进度（供 worker 链路驱动进度 UI）。
- hucre `writeXlsx` 校验 sheet 名（Excel 非法字符 `[ ] : * ? / \`、>31 字符、保留名 History、大小写不敏感重名）抛 `InvalidArgumentError`；模型层不限制表名，导出失败由调用方 UI 提示。流式 API（`streamXlsxRows` / `writeXlsxStream`）不支持样式/合并/公式，与导入导出的保真需求不匹配，不采用。
- xlsx 导入导出 round-trip 保留浮动图；CSV 忽略图片；WPS 单元格内嵌图（`cellImages`）本期跳过。

## 依赖

- **dependencies**：`@infinite-table/core`、`@infinite-table/plugins`（`file:` 本地直连的 grid 引擎底座，grid/ 唯一引擎依赖面）、`hucre`
- **peer**：`@cat-kit/core`（`>=1.2.1`，公式四则与 `SUM` / `AVERAGE` / `ROUND` / `ABS` 的 `$n` / `n().fixed`）
- **被依赖**：`@veltra/sheet`（编辑器）、`@veltra/desktop`（file-viewer 只读预览）

## 性能要点（百万格 / 数百 sheet 规模）

- **模型直挂免重放**：值写入经引擎 ModelBinding 局部刷新单格，无 records 全量重放路径；`merge-change` / `axis-style-change` / 全量 meta 排微任务合并为一次窗口刷新（签名判重跳过无变化合并替换）。LRU 隐藏实例只保留脏标记，激活时一次性同步。
- **编辑器实例级**：引擎 EditorRegistry 随表实例生命周期（无全局注册表泄露坑），每 SheetGrid 一个注册表，release 随实例销毁。
- **列宽**：列定义构造期一次写入 `width`；运行时两条写路径——拖拽落定单列 `setColWidth`（引擎几何变更为增量失效），以及门面 / 右键菜单数值写入：模型 `setColWidth` 不发事件，经 `SheetGrid.applyAxisSizes` 批量同步到活动引擎（隐藏实例置脏、激活全量同步）。
- **渲染热路径**：`store.peekCell` / `stylePool.peek` 只读访问器，避免逐格防御性拷贝；`entriesInRange` 迭代稀疏键、`rowsForColumn` 按列找行，不做稠密列扫描；wrap 行高估算构造期按候选行短路（样式池无 wrap 样式零全格遍历，否则只扫候选行），动态期只扫该行已存格。
- **公式重算**：依赖图反向索引按表批量标脏（变更格按行区间合并判定），非逐格全表扫描。

## 已知限制

- undo 按 sheet 分栈，跨表交错撤销可能短暂显示过期缓存（再触发重算自愈）。
- 替换 = 整格覆盖（非 Excel 子串）；公式格不参与替换。
- 浮动图片：定位渲染、拖动平移锚点（含格内像素偏移 `offsetX/offsetY`，自由定位不吸附）、删除；无缩放/旋转；无剪贴板复制粘贴图；无单元格内嵌图（WPS `cellImages` / `DISPIMG`）导入转换；CSV 不携带图片；URL 来源（`src`）图不参与 xlsx 导出/导入（字节图 round-trip 保留）。
- xlsx round-trip 丢失格内像素偏移（hucre 不支持 colOff/rowOff）：导入后图片对齐 from 格左上角（`offsetX/offsetY` 不随 xlsx 导入导出保留）。
- 未做：字体族、图表、协同、双击填充柄；四类之外 numFmt 的 xlsx 导入识别（忽略，维持现状）；xlsx 空格仅继承行列默认样式的 Excel 原生 round-trip（需 hucre 读 `<row s>` / `<col style>` 或导出 fan-out 物化）。

## 已知问题

- **`exports["./*"]` 深导入必须带 `.js` 后缀**：`./*` 把请求原样映射到 `./dist/*`，tsc 不做扩展名补全——写 `@veltra/sheet-core/core/address` 会去找无扩展名的 `dist/core/address`，tsc 报 TS2307。带后缀（`@veltra/sheet-core/core/address.js`）与显式 `./grid` 子路径都正常。新增 `core/*` 模块供外部深导入时，确认其已列入 `vite.config.ts` 的 pack `entry`，否则不产出 `.d.ts`（`core/events` 即为此列在 entry）。
- **语言服务**：`tsconfig.json` 只含 `core/`；`tsconfig.grid.json` 含 `grid/`。编辑无头模型时不要把两个项目并进同一个 program。
- **引擎解析**：bun 隔离快照不嵌套 `@infinite-table/render`（引擎 core 的 `workspace:*` 依赖在 `file:` 安装下不翻译），各消费包 vite `resolve.alias` 把 `@infinite-table/core` / `@infinite-table/plugins` 指到真实路径（见各包 vite.config.ts 的 engineAlias）。

## 测试与验证

- happy-dom 环境；grid 测试依赖 canvas mock（`src/grid/__test__/canvas-mock.ts`，经 `src/grid/__test__/setup.ts` 全局挂载，即 vite.config 的 `setupFiles`）；core 测试无 DOM 依赖，无头直跑。

```bash
cd packages/sheet-core && vp test
vp pack          # 同目录，库构建
bun run lint     # 仓库根
```
