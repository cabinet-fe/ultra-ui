# AGENTS.md — @veltra/sheet

Vue 电子表格编辑器（USheet）。数据模型 / 命令 / 公式 / IO / 渲染内核全部来自 npm 包 `infinitable`（`/sheet` 子路径），本包只做工具系统与 Vue UI 编排，不 re-export 引擎符号（消费方直导 `infinitable/sheet`）。

## 目录结构

```
src/
├── index.ts              # 聚合导出：仅 sheet 自有能力（USheet / tools / types）；内置工具注册（import './tools/builtin'）
├── components/           # 组件目录（对齐 desktop 模式，Vue 只在这一层；resolver 按目录扫描 index.ts + style.ts）
│   └── sheet/            # USheet 组件（insert-image 弹层 / 右键）
├── tools/                # 工具扩展（不 import 组件层）；SheetContext 门面
└── types/                # SheetProps / SheetEmits / SheetExposed
```

模型、命令、公式、IO、SheetGrid 等 core/grid 内容全部在 npm 包 `infinitable`（其分层约定、核心语义、引擎适配要点与已知限制见上游 `infinite-table` 仓库文档，可经 docs-search 检索 slug `infinite-table`），本文件不再重复。

## 分层约定

| 层            | 职责                        | 禁止                                 |
| ------------- | --------------------------- | ------------------------------------ |
| `tools/`      | 工具注册表 + `SheetContext` | import 组件层                        |
| `components/` | 组件 UI 编排（USheet 等）   | 绕过 `SheetContext` / 命令系统写模型 |

- **写操作一律走命令**：`setCellValue` / `setCells` / `setCellFormula` / `setCellStyle` / `setRowStyle` / `setColStyle` / `mergeCells` / `insertRows` / `insertImage` / `removeImage` / `updateImage` 等经 `defaultCommandRegistry` → `sheet.history`；`Sheet.applyPatch` 是唯一变更通道。
- **工具只经 `SheetContext`**：不暴露 `Sheet` 实例；扩展天然可 undo。样式工具栏优先 `applyStyle`（整行选区 → `rowStyles`，整列 → `colStyles`，局部 → 逐格）；读外观用 `getEffectiveStyle`。
- **工作簿结构操作**（增删改名 sheet）走 `Workbook`，**不进 undo**，也不经 `SheetContext`；tabs UI 直接调 `Workbook`。
- 内置工具副作用注册必须挂在包入口（`src/index.ts`）；放组件层会被 pack treeshake 丢掉。
- `components/<name>/` 是 `@veltra/vite` 眼中的组件目录（`index.ts` + `style.ts`）：其 `index.ts` 增删 `U*` 导出后，在仓库根运行 `bun run resolver:gen` 刷新组件表。

## 引用 infinitable

- 模型 / 命令 / 公式 / IO / `SheetGrid` / hooks 类型统一走 `from 'infinitable/sheet'`；公式注册表 API（`registerFormulaFunction` / `listFormulaFunctions` / `formulaError` 等）走主入口 `from 'infinitable'`。本包主入口不 re-export 引擎符号——消费方直导。
- `infinitable` 无深路径导出（exports 仅 `.` 与 `./sheet`），不要试图深导入；官方未导出的符号属于内部实现。
- 类成员方法（`Sheet.setCell` / `setCellStyles` 等）为引擎内部便捷写入口，非公开承诺 API；写操作一律走命令系统。

## USheet

- Props：`workbook?`、`rows?`(100)、`cols?`(26)、`showToolbar?`、`showFormulaBar?`、`showTabs?`、`showRowHeader?`(true)、`showColHeader?`(true)、`colResize?`(false，readonly 下放开列头列宽拖拽；落定 emit `col-resize-end` `{col,width}`)
- Exposed：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`
- 宿主需给高度（`.u-sheet` flex 列，grid `flex:1; min-height:0`）
- 样式：`import '@veltra/sheet/components/sheet/style'`；BEM 元素用 `m.e(name)`，**不要**用单参 `m.bem` 当元素（会丢 `__grid` 等规则）
- 工具栏组序：`history | cell | text | edit | insert | file`；行列插入/删除、冻结在**右键菜单**（非工具栏）；edit 组含查找与「函数」弹框（与公式栏 fx 按钮同一组件 `functions-popup.vue`：分类导航 + 搜索 + 可选择，含宿主经 `registerFormulaFunction` 注册的自定义函数；选中仅 emit select → 公式栏 `insertFunction(name)` 进入编辑态输出 `=NAME()`，模型写入待 fx 提交，不参与事务）
- **右键菜单分区**：body 为合并/取消合并、设置数据格式（子菜单：日期 / 千分位金额 / 大写金额 / 小数位数，经 `applyNumFmtToSelection` → `applyStyle` 写 `numFmt`，可 undo）、超链接（按目标格状态：无链接「插入超链接」、有链接「编辑超链接 / 取消超链接」；插入/编辑经注入句柄拉起 `popups/hyperlink-popup.vue` 配置弹窗——地址必填 + 显示文本留空沿用单元格内容，confirm 写 `setCellLink`；readonly 禁用）、插入图片（浮动图，直接系统文件框）、嵌入图片（`insertCellImage` 字节载荷入活动格，格内已有则整体覆盖）；**目标格含嵌入图时出纯图片菜单**（预览 / 图片超链接 / 取消超链接（按 link 状态）/ 转为浮动图片 / 替换图片 / 移除图片，不出合并/数据格式/超链接等普通格项——右键语义是图片非单元格；超链接复用同一弹窗 `mode="image"` 仅地址字段，confirm 覆盖写 `insertCellImage(addr, { ...payload, link })`、清除写 `link: undefined`；「转为浮动图片」（`cellImageToFloat`）事务内 `insertImage` + `removeCellImage` 单 undo 单元，落锚点格、尺寸取格宽高、fit 保 contain，src/data/type/link 随迁；替换/移除走 `insertCellImage` 覆盖与 `removeCellImage`，均可 undo；readonly 禁用写入项）；悬停链接格 tooltip（`use-cell-link-tooltip.ts`，引擎 hover/leave 事件驱动，DOM 浮层 `__link-tooltip`）；**插入/删除行列仅在行号/列头**（行号：上下插入行/删除行 + 行高 + 冻结；列头：左右插入列/删除列 + 列宽 + 冻结；行高/列宽数值项经门面批量应用到选区，不进 undo，readonly 禁用）
- SheetGrid 按 sheet **LRU 缓存**（容量 3）：命中只翻可见性；`structure-change` / 尺寸变化 / 导入替换则重建
- **单元格级只读**（填报场景）：经 sheet 模型 API `setCellReadonly` / `setRangeReadonly` / `isCellReadonly` 标记，SheetGrid 自动拦截只读格编辑；工具栏 / 公式栏不经 grid 守卫，填报宿主应全部隐藏（playground `sheet-data-entry` 演示页为参考实现）
- 弹层打开用 `setTimeout(0)`，不要用 `queueMicrotask`（否则同一次 click 冒泡会立刻关掉面板）。

## 浮动图片门面与 UI 入口

- **SheetContext 门面**：`insertImage(input)` / `removeImage(id)` / `updateImage(id, patch)` / `getImages()` / `onImageChange(handler)`（读写走命令/事件，不暴露 Sheet）。
- **UI 入口**：工具栏 `insert-image`（组 `insert`，弹层 `UFilePicker` 本地文件 + URL 输入并存）；右键「插入图片」（浮动）/「嵌入图片」（入格）直接拉起系统文件框；共享逻辑 `components/sheet/insert-image.ts`（`insertImageFromFile` / `insertImageFromUrl` / `insertCellImageFromFile`，文件选择样板收敛在 `pickImageFile`）。
- **链接打开由组件接管**：SheetGrid 构造传 `openCellLinkOnClick: false` 关闭引擎默认打开——链接格单击直开（保持引擎原行为）、图片链接（浮动/嵌入）单击弹 `messageConfirm` 确认后才 `window.open`（防误触跳转；`sheet.vue` 的 `handleCellLinkClick` / `handleImageLinkClick`），事件仍原样 emit 给宿主。
- **浮动图右键独立菜单**：`float-image-menu.ts` 消费引擎 `floatObjects.onContextMenu`，经 `contextmenu.pop` 弹 预览 / 设置超链接 / 取消超链接（无链接不出现）/ 嵌入单元格 / 删除图片（不穿透格菜单由引擎保证）；超链接走同一弹窗 `mode="image"`（confirm 写 `updateImage(id, { link })`、清除 `link: null`）；「嵌入单元格」（`embedFloatImageToCell`，对齐 WPS/Excel 放置在单元格中）把浮动图转锚点格嵌入图——事务内 `insertCellImage(anchor.from) + removeImage(id)` 单 undo 单元，src 优先迁移（有 src 迁 src，否则迁 data 字节），type/link 随迁；右键「预览」（浮动图/嵌入图共用）打开 sheet.vue 挂载的 `@veltra/desktop` `UImagePreviewer` lightbox（`popup-helpers.ts` 的 `imagePreviewSource` 归一 src/data 源，关闭卸载回收 objectURL）。**`style.ts` 必须引 `image-previewer/style` 与 `message-confirm/style`**（组件直 import 不走 resolver，漏引即无样式 DOM）。
- 叠层渲染与拖动交互为官方 `infinitable/sheet` 浮动层内置能力。

## 导入导出

- UI：工具栏 `import` 点击直接系统文件选择（`components/sheet/import-file.ts`）；`export` 仍为弹层选
  xlsx / csv。解析进度遮罩由 sheet.vue 持有的 `parsing` / `parseProgress` 驱动
- 大 xlsx 在 Web Worker 解析（`components/sheet/popups/import.worker.ts`：动态 import
  `infinitable/sheet` 的 `importXlsx(buffer, onProgress)` 完成解析 + 分片构建）：
  worker 返回快照数组，主线程**不再 restore 重建临时工作簿**——
  确认后快照直接替换进目标（`replaceWorkbookWithSnapshots`）；导出对称地在 Worker 序列化
  （`tools/export.worker.ts`，`tools/download.ts` 采集快照发起，失败回退主线程）；
  worker 均须列入 pack entry。
  行高随 `SheetSnapshot.rowHeights?` 跨 worker / 持久化传输
- worker 分片构建按 10% 粒度回报进度；sheet 自绘「遮罩+动画+文字」覆盖层
  （`.u-sheet__loading-mask`，动画上文字下同层），不动 desktop Loading 组件
- IO 实现与保真度约定（快照整表替换、批量合并、表名校验等）在 `infinitable/sheet`
  的 core/io（自包含，无 hucre 运行时依赖）

## 依赖

- **dependencies**：`infinitable`（引擎统一包：`/sheet` 子路径 + 主入口公式 API，自包含不携带 hucre）
- **peer**：`@cat-kit/core`（查找防抖 `debounce`）、`@cat-kit/fe`（`saveBlob` 下载）、`vue`、`@veltra/desktop`、`@veltra/icons`、`@veltra/utils`、`@veltra/styles`
- **被依赖**：playground

## 构建与测试配置

- **pack entry**：`src/index.ts`、`src/components/sheet/style.ts`、`src/components/sheet/popups/import.worker.ts`、`src/tools/export.worker.ts`（worker 经 `new Worker(new URL())` 引用，非 import 可达——unbundle 模式下必须显式列为 entry 才会编译进 dist）
- **neverBundle**：peer + `infinitable`（正则匹配 `/^infinitable(\/|$)/`，覆盖子路径导入）；treeshake `moduleSideEffects` 保留 `components/*/style.ts` 与 `tools/builtin.ts`
- **测试**：默认 node，需要 DOM 的测试文件在文件头加 `// @vitest-environment happy-dom`；canvas mock 在 `src/components/sheet/__test__/`（`grid-setup.ts` 挂 `canvas-mock.ts`，node 环境自动跳过），`setupFiles` 指向它；`server.deps.inline: ['infinitable']`（externalize 时 worker node 会把 `@cat-kit/core` 解析到 TS 源码）

## 已知限制

- 公式栏补全 / 引用选择仅 fx 输入栏，网格内编辑器无同等能力。
- 其余模型 / 渲染层限制（undo 分栈、替换语义、浮动图片、xlsx round-trip 等）随 `infinitable/sheet`，见上游文档。

## 验证

```bash
cd packages/sheet && vp test
vp run -F @veltra/sheet build
bun run lint
```
