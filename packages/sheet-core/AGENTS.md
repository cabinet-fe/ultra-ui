# AGENTS.md — @veltra/sheet-core

框架无关的表格核心：数据模型 / 命令系统 / 公式引擎 / xlsx/csv IO（`core/`，纯 TS）+ VTable 适配层 SheetGrid（`grid/`）。供 `@veltra/sheet`（USheet 编辑器）与 `@veltra/desktop` file-viewer（只读预览）共用。**数据模型完全自持有，VTable 只做渲染与输入**：单元格操作都作用在自己的模型上，VTable 经适配层被动刷新。

## 目录结构

```
src/
├── index.ts              # 聚合导出（模型/命令/公式/IO 白名单；不含 SheetGrid）
├── core/                 # 框架无关纯 TS（不 import vue / vtable），可无头单测
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
│   └── events.ts
└── grid/                 # VTable 适配层（公开入口 `@veltra/sheet-core/grid`）
    ├── index.ts          # SheetGrid / CustomLayout / resolveCellRenderer 等
    ├── sheet-grid.ts     # SheetGrid（模型 ↔ ListTable；支持 readonly）
    ├── image-layer.ts    # 浮动图片 DOM 叠层
    └── vtable-theme.ts   # themes.DEFAULT.extends 主题
```

## 分层约定

| 层      | 职责                        | 禁止                                                                 |
| ------- | --------------------------- | -------------------------------------------------------------------- |
| `core/` | 模型、命令、公式、IO        | import `vue` / `@visactor/*`；零外向依赖（唯一外部运行时依赖 hucre） |
| `grid/` | VTable 渲染、编辑回写、键盘 | 业务编排；只依赖 `core/` + `@visactor/*`                             |

- **禁止反向依赖**：`core/` 不得 import `grid/`；grid 对 core 单向依赖。
- **公开入口拆分**：`@veltra/sheet-core` 只导出模型 / 命令 / 公式 / IO；`SheetGrid` / `CustomLayout` / `resolveCellRenderer` 走 `@veltra/sheet-core/grid`。不要把 grid 符号挂回主入口——否则无头 `import { Workbook }` 会把 `@visactor/vtable` 整棵类型树拉进 TS 语言服务。
- **写操作一律走命令**：`setCellValue` / `setCells` / `setCellFormula` / `setCellStyle` / `mergeCells` / `insertRows` / `insertImage` / `removeImage` / `updateImage` 等经 `defaultCommandRegistry` → `sheet.history`；`Sheet.applyPatch` 是唯一变更通道。
- **工作簿结构操作**（增删改名 sheet）走 `Workbook`，**不进 undo**。

## 核心语义

- **坐标 0-based**：`{ row: 0, col: 0 }` = A1；`CellRange` 闭区间，start 恒为左上角。
- **空单元格不占存储**：无公式且 `v` 为空即删除；`rowCount`/`colCount` 只是渲染高水位。
- **合并**：锚点 = 区域左上角，数据只存锚点；`MergeManager` 只管几何，值保留规则在 `Sheet.mergeCells`。
- **两种读取**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入/选中内部先 `resolveAnchor`。
- **不进 undo**：选区、冻结、行高、列宽。选区可随 `SheetSnapshot.selection?` 序列化；冻结随快照；行高随 `SheetSnapshot.rowHeights?`；列宽随 `SheetSnapshot.colWidths?`。
- **样式**：`CellData.s: StyleId` → StylePool 按内容去重；行/列默认样式 `SheetSnapshot.rowStyles?` / `colStyles?`（同池 StyleId，进 undo，经 `setRowStyle` / `setColStyle`）；有效样式 = 列 → 行 → 格字段级叠加（`composeCellStyles` / `Sheet.getEffectiveStyle`）。部分合并见 `CellStylePatch`（fill 覆盖、border 边级、font/align 逐字段；`null` 删字段）。边框预设经 `buildBorderPresetItems`（`outer`/`inner`/`all`/`top`/`bottom`/`left`/`right`/`none` → 外边框/内边框/所有边框/上/下/左/右边框 + 无边框；含邻居对侧边同步）。
- **公式**：`f` 原文（无 `=`），`v`/`t` 为缓存；重算派生补丁并入同一 undo 单元；undo/redo 纯补丁回放。跨表依赖图在 `Workbook` 级共享。
- **addSheet 初始数据**：`addSheet(name?, { data?, rows?, cols? })`——data 二维数组从 A1 写入（原始值自动推断类型；null/undefined/'' 跳过；对象形式 `{ v, t, f }` 支持公式，写入即注册依赖图并立即重算）；rows/cols 与数据高水位取大（仅传入时校验，非正整数抛错）。初始数据经一次 setCells 写入后 `history.clear()`——基线状态不进 undo，且在 `sheets-change` 发出前就绪。
- **浮动图片**：`SheetImage`（`id` + `Uint8Array` 字节 + `type` + `anchor.from`/`to?` + 可选宽高/alt/title；`from` 可带格内像素偏移 `offsetX/offsetY`，缺省 0）；写入经 `insertImage` / `removeImage` / `updateImage`（命令 `sheet.insert-image` / `sheet.remove-image` / `sheet.update-image`，`ImagePatch`）；快照字段 `SheetSnapshot.images?`；`restoreContent` 整表替换图片并发 `image-change`。行列插入/删除时锚点平移（offset 随 from 格保留）；锚点区间被完整删除时图片移除（同 undo 单元）。格式：`png` / `jpeg` / `gif` / `svg` / `webp`（与 hucre 对齐）。
- 注：`Sheet.setCell` / `setCellStyles` / `CellStore.setCellValue` 为内部便捷写入口（生产零调用、测试直用），非公开承诺 API——包入口不单独导出，宿主请用 `setCells` / `setCellStyle`。

## cell hook 性能契约（ADR-0004 决策 3）

cell hook 是渲染扩展面（`resolveDisplayValue` / `resolveCellStyle` / `resolveCellRenderer`，见 `grid/sheet-grid.ts`），全部运行在渲染热路径上，必须遵守：

- **纯函数、同步返回**：禁止异步操作（IO/请求/定时器）与副作用；返回 `undefined` 即回落默认行为。
- **O(1) 查找**：按格索引只允许稀疏 Map / 地址直查（Cell Meta 为稀疏 Map），禁止线性扫描或全表遍历。
- **禁止大对象分配**：不构造长数组/大字符串/闭包链；每次调用只分配必要的最小对象。

调用节奏（三者不同，勿合并）：`resolveDisplayValue` 在 record 构建时（数据变更才触发）、`resolveCellStyle` 在每次场景图重绘（视口可见格 × 重绘次数 × facing 边溯源最多 4 倍放大，最热）、`resolveCellRenderer` 在布局时（视口可见格 × 布局次数）。

`resolveCellRenderer` 经列级 `customLayout` 按格分发器回调宿主：**仅宿主提供 hook 时才安装**（customLayout 存在会使 VTable 对该列关闭 fast-update 快路径，默认场景必须零差异）。hook 不写模型、不进快照。嵌入路线分工：格内内容走 renderer hook；跨格浮动内容走 ImageLayer。

## SheetGrid readonly 模式

`SheetGridOptions.readonly`（构造选项，`grid/sheet-grid.ts`），面向只读预览场景（desktop file-viewer 的 Excel/CSV 预览）：

- **关闭一切写模型入口**：不挂编辑器与 `CHANGE_CELL_VALUE` 编辑回写、禁用填充柄与行/列 resize、不绑 undo/redo 快捷键；ImageLayer 禁图片拖动与 `Delete`/`Backspace` 删除（仅保留点击选中）。
- **保留**：渲染、选区、滚动、键盘导航、右键回调（`onContextMenu` 照常触发，菜单内容由宿主决定）。
- **模型层不设防，仅守 grid 入口**——绕过 SheetGrid 直接调命令仍可写模型，宿主只读场景不要暴露命令入口。
- **行列头**：`showRowHeader` / `showColHeader`（默认 true）；false 时不渲染行号列 / 列字母表头，冻结映射不再 +1。

## 单元格级只读（填报场景）

`Sheet.setCellReadonly(addr, readonly?)` / `setRangeReadonly(range, readonly?)` / `isCellReadonly(addr)`；标记经 Cell Meta 存储（namespace `CELL_READONLY_META_NAMESPACE = 'cell-readonly'`，payload 恒为 `true`），天然获得：可 undo（setRangeReadonly 事务合并为单 undo 单元）、随 `SheetSnapshot.meta` 序列化、行列插入删除平移、合并格解析锚点。

- **拦截在 grid 层**（模型层不设防，同整表 readonly 约定）：列级 `editor` 函数对只读格返回 falsy（VTable `getEditor` 不开启编辑，双击 / Enter 均不进入）；`CHANGE_CELL_VALUE` 回写守卫（绕行场景回滚视图显示）；填充柄跳过只读目标格（从只读格向外复制仍允许）。meta 变更时清空 VTable 的 `cacheLastSelectedCellEditor` 按格编辑器缓存（内部字段，无公开 API），运行期标记/解除立即生效。
- 整表 `readonly: true` 时列级 editor 函数也不挂（列级 editor 会覆盖表级空值导致只读失效）。
- USheet 的**工具栏 / 公式栏不经 grid 守卫**：填报宿主应隐藏这些写入口（`showToolbar` / `showFormulaBar` 等全 false，参考 playground `sheet-data-entry` 演示页）。
- 视觉区分由宿主经 `resolveCellStyle` hook 叠加（遵守 cell hook 性能契约）；xlsx 导出不含只读标记（同其它 Cell Meta）。

## 浮动图片渲染（grid/image-layer.ts）

- **叠层渲染**：grid 容器内绝对定位 `<img>`，按 `computeImageRect` 布置——`from` 左上 + 格内像素偏移（`from.offsetX/offsetY`，px，缺省 0）；宽高**优先取 `image.width/height`**（xlsx 导入的精确 px），宽高缺失且有 `to` 时按 from→to 跨度兜底（Excel `twoCellAnchor` 拉伸语义），都缺失时取自然尺寸。仅视口内（含预挂边距）创建 DOM / objectURL，滚出卸节点、保留 URL；`decoding=async`；销毁时 revoke。监听 SCROLL / resize / `image-change` / `content-reset` / 冻结与行高变化重排。
- **交互**：点击图片选中（拦截进 VTable）；选中后可拖动，落点反查单元格经 `sheet.updateImage` 平移 `from`（有 `to` 则同 delta，保持跨度/宽高），**落点相对目标格左上的像素余量写回 `offsetX/offsetY`（负值 clamp 到 0），自由定位不吸附**；`Delete`/`Backspace` 经命令删除；点网格其他位置取消选中。readonly 时仅保留选中。本期不做缩放/旋转。
- **LRU**：隐藏实例不渲染叠层；激活时一次性重排（脏标记）。

## VTable 适配要点

- 主题必须 `themes.DEFAULT.extends(...)`，裸对象会丢默认色。
- `customMergeCell` 的 `text` **必须读 VTable records**（`getCellOriginValue`），不能读模型——否则编辑提交后重绘显示旧值。
- 模型冻结 N 行/列 → VTable `frozenRowCount/ColCount = N + 1`（含列头/行号）；`showColHeader`/`showRowHeader` 为 false 时不加 +1。
- 选区回驱：`selection-change` → `selectCells` + `scrollToCell`；用 `syncingSelection` 防递归。回驱前需临时清 `eventManager.isDraging` 并清选区 overlay（VTable 1.26.5 拖选时序缺陷，否则多框残留 / 反向拖选畸形）。
- 事件用 `ListTable.EVENT_TYPE`（`core.EVENT_TYPE` 运行时为 undefined）。

## 导入导出（core/io）

- 主入口白名单：`exportWorkbookXlsx` / `exportSheetXlsx` / `exportSheetCsv` / `importXlsx` / `importCsv`。整簿替换 `replaceWorkbookWithSnapshots` 与 worker 链路入口 `buildWorkbookFromHucre` 不在白名单，消费方深导入 `@veltra/sheet-core/core/io/import`。
- `exportSheetXlsx(sheet, { fallbackName? })`：单表导出（与 exportWorkbookXlsx 同一套单表组装 `sheetToHucreWriteSheet`，浮动图随导出保留）；表名取 `sheet.name || fallbackName || 'Sheet'`。sheet 的 Filled Report 导出（`exportFilledReportXlsx`）即委托它。
- `importXlsx(buffer, onProgress?)`：第二参数透传 `buildWorkbookFromHucre` 的分片进度回调（每完成一个 sheet 回调一次）；worker 导入链路（`@veltra/sheet` 的 import.worker）经动态 import 深导入本模块驱动进度 UI。
- **IO 保真度约定**：xlsx 导入只读 `cells` Map（不扫稠密 `rows`）；表格尺寸按有值格 ∪ 合并 ∪ 图片锚点收敛，勿用稠密几何或 `columns[]` 全长撑到 Excel 极限列数；纯样式格只保留有值范围外扩 100 的紧邻带；行高/列宽只写入渲染范围内的定义（禁止把默认 `columns[]` 外扩 KEEP_MARGIN 后逐列 setColWidth）。
- **快照整表替换**：`RestoreSheetCommand`（`sheet.restore-sheet`）+ `SnapshotPatch`——导入替换与 undo/redo 回放走整表 `restoreContent`（cells/styles/merges/images/rowStyles/colStyles + 公式图 `rebuildSheet` 重建），不发逐格 cell-change（避免十万级视图同步），发 `content-reset` 事件（grid `setRecords` 一次、状态源 bump）+ `image-change`；冻结/行高/列宽/尺寸/选区不进 undo；跨表引用方经 recalcAfterCommand 联动（含被清空的旧格标脏）。
- **批量**：`Workbook.beginBatch/endBatch` 合并结构事件补发（196 sheet 导入的 195 次 `sheets-change` 收敛为 1 次）；`Sheet.mergeCellsBatch` 批量合并 = 单 undo 单元（批量内相交边收集边应用与逐条语义一致）；样式导入按 hucre 共享子对象引用组合 key memo 跳过重复解析/intern。
- **分片构建**：`buildWorkbookFromHucre` 按 10% 粒度经回调回报进度（供 worker 链路驱动进度 UI）。
- hucre `writeXlsx` 校验 sheet 名（Excel 非法字符 `[ ] : * ? / \`、>31 字符、保留名 History、大小写不敏感重名）抛 `InvalidArgumentError`；模型层不限制表名，导出失败由调用方 UI 提示。流式 API（`streamXlsxRows` / `writeXlsxStream`）不支持样式/合并/公式，与导入导出的保真需求不匹配，不采用。
- xlsx 导入导出 round-trip 保留浮动图；CSV 忽略图片；WPS 单元格内嵌图（`cellImages`）本期跳过。

## 依赖

- **dependencies**：`@visactor/vtable`、`@visactor/vtable-editors`、`hucre`（无 peer）
- **被依赖**：`@veltra/sheet`（编辑器）、`@veltra/desktop`（file-viewer 只读预览）

## 性能要点（百万格 / 数百 sheet 规模）

- **批量同步**：grid 的 `cell-change` / `merge-change` **不逐补丁同步**——排入微任务合并为一次 flush（同步执行块内 N 补丁 = 1 次视图同步；超过 64 格走一次 `setRecords` 全量重建替代逐格增量）。LRU 隐藏实例只保留脏标记，激活时一次性同步。
- **编辑器单例**：`veltra-sheet-input` 全局只注册一次（VTable 全局编辑器注册表无单条注销 API，旧实现每实例注册一个会永久累积）。hook 由发起编辑的 ListTable（onStart 的 `EditContext.table`；onEnd 无参，用 onStart 捕获的会话 table）经模块级 `WeakMap<ListTable, SheetGrid>` 反查所属实例——多实例同页时路由精确，不依赖「当前激活」全局槽。
- **列宽**：`buildColumns` 写入 `width`（构造一次布局）。禁止在 scenegraph 建成后对大量列逐次 `setColWidth`（438 行 × 130 次实测 ~3s）。`applyColWidthsFromModel` 只回放表内且宽度有变的列（content-reset / 激活）。
- **渲染热路径**：`store.peekCell` / `stylePool.peek` 只读访问器，避免逐格防御性拷贝；`entriesInRange` 迭代稀疏键、`rowsForColumn` 按列找行，不做稠密列扫描。
- **公式重算**：依赖图反向索引按表批量标脏（变更格按行区间合并判定），非逐格全表扫描。

## 已知限制

- undo 按 sheet 分栈，跨表交错撤销可能短暂显示过期缓存（再触发重算自愈）。
- 替换 = 整格覆盖（非 Excel 子串）；公式格不参与替换。
- 浮动图片：定位渲染、拖动平移锚点（含格内像素偏移 `offsetX/offsetY`，自由定位不吸附）、删除；无缩放/旋转；无剪贴板复制粘贴图；无单元格内嵌图（WPS `cellImages` / `DISPIMG`）导入转换；CSV 不携带图片。
- xlsx round-trip 丢失格内像素偏移（hucre 不支持 colOff/rowOff）：导入后图片对齐 from 格左上角（`offsetX/offsetY` 不随 xlsx 导入导出保留）。
- 未做：字体族、数字格式、图表、协同、双击填充柄；xlsx 空格仅继承行列默认样式的 Excel 原生 round-trip（需 hucre 读 `<row s>` / `<col style>` 或导出 fan-out 物化）。

## 已知问题

- **`exports["./*"]` 通配深导入对 tsc 不友好**：tsc 不经 exports 通配做扩展名探测（`veltra-dev → ./src/*` 无扩展名解析失败），消费方深导入 `@veltra/sheet-core/core/*` 时需在其 tsconfig 配 `paths` 直指源码兜底（参考 `packages/sheet/tsconfig.json`），并加 `references` 避免 composite 项目的 TS6059/TS6307。主入口与显式 `./grid` 子路径无此问题。
- **语言服务**：`tsconfig.json` 只含 `core/`（无 VTable）；`tsconfig.grid.json` 含 `grid/`。编辑无头模型时不要把两个项目并进同一个 program。

## 测试与验证

- happy-dom 环境；grid 测试依赖 canvas mock（`src/grid/__test__/canvas-mock.ts`，经 `src/grid/__test__/setup.ts` 全局挂载，即 vite.config 的 `setupFiles`）；core 测试无 DOM 依赖，无头直跑。

```bash
cd packages/sheet-core && vp test
vp pack          # 同目录，库构建
bun run lint     # 仓库根
```
