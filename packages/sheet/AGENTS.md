# AGENTS.md — @veltra/sheet

基于 `@veltra/sheet-core` 的 Vue 电子表格编辑器（USheet）。数据模型 / 渲染内核（原 `src/core`、`src/grid`）已迁至 `@veltra/sheet-core`（见 `packages/sheet-core/AGENTS.md`），本包只做工具系统与 Vue UI 编排。core 符号**不做 re-export**（sheet-core 独立发包，消费方直导，见「引用 sheet-core」）。

## 目录结构

```
src/
├── index.ts              # 聚合导出：仅 sheet 自有能力（components/report 内核/tools/types）；内置工具注册（import './tools/builtin'）
├── components/           # 组件目录（对齐 desktop 模式，Vue 只在这一层；resolver 按目录扫描 index.ts + style.ts）
│   ├── sheet/            # USheet 组件（insert-image 弹层 / 右键）
│   └── report/           # UReportViewer + UReportDesigner 同族共置；内部 filter-bar / 数据中枢 / 字段面板 / designer/（设计态覆层与对话框）不导出
├── report/               # 报表纯 TS 内核（render/ 展开引擎、binding、rules、params、DataConnector、Report Template、Filter Bar、Filled Report XLSX 导出）
├── tools/                # 工具扩展（不 import 组件层）；SheetContext 门面
└── types/                # SheetProps / SheetEmits / SheetExposed / ReportViewerProps / ReportViewerExposed / ReportDesignerProps / ReportDesignerEmits / ReportDesignerExposed
```

模型、命令、公式、IO、SheetGrid、ImageLayer 等 core/grid 内容全部在 `packages/sheet-core/src/`（`core/`、`grid/`），其分层约定、核心语义、VTable 适配要点、性能要点与已知限制见 `packages/sheet-core/AGENTS.md`，本文件不再重复。

## 报表内核（src/report/，ADR-0003 / ADR-0005）

- 纯 TS、headless、无 DOM：`renderReport`（模板 + records → Filled Report 快照）经 `render/` 编排，**零几何推断**——布局语义全部来自 `ReportBinding` 显式字段。
- **绑定模型（ADR-0005）**：`expand: 'down' | 'right' | 'none'`（展开方向）、`rowParent?` / `colParent?`（行/列方向从属父格，用户可编辑）、`aggregate`（`list` / `group` / `sum` / `avg` / `count` / `max` / `min`）、`mergeSpan?`（扩展实例是否合并为单格，缺省 `true`；`false` 时逐格重复填值，便于 Excel 筛选）、`preset?`（设计器预设标签，**引擎不读**）。已删除：`role` / `leftParent` / `resolveReportRole` 等坐标反推符号；`select` 聚合更名为 `list`。
- **预设降级**：五个预设（分组头 / 明细行 / 小计行 / 总计行 / 交叉格）仅为设计器输入法与 Action Pill 展示标签；切换预设经 `presetBindingPatch` / `applyReportPreset` 写入一组 `expand` + `aggregate` + 父格组合，缺失时显示「自定义」。
- **扩展坐标系**：静态格、合并区域与绑定格统一按逻辑网格 → 物理网格映射；扩展格每个实例的跨度等于其子树展开量；父格约束只在同数据集内生效，跨数据集拖拽不覆盖 `dataset`。
- **渲染模块（`render/`）**：

| 模块 | 职责 |
| --- | --- |
| `template-index.ts` | 模板一次性索引：绑定 Map、父子树构建、按地址直查 |
| `coordinate.ts` | 扩展坐标系：实例枚举、子树跨度、逻辑格 → 物理区间映射（纯计算、无输出） |
| `aggregate.ts` | 聚合求值 + 分组字段索引 |
| `style-resolver.ts` | 静态样式 + 条件样式（含 `scope: 'row'` 两阶段行级叠加） |
| `builder.ts` | Filled Report 快照组装 |
| `index.ts` | `renderReport` 编排 |

- **条件样式**：`ConditionalRule.field` 缺省取绑定格自身字段，指定时对同一条记录的另一字段求值；`scope: 'row'` 染满整个物理输出行（交叉表下会染满同行所有列，明细行报表更合适）。
- **Report Template（template.ts）**：自包含模板 = `SheetSnapshot` + **`version: number`（当前 `1`，必填）** + 内嵌 `datasets: ReportDatasetDef[]` + 可选 `colWidths`（设计态列宽，模型列索引 → 像素）。`version` 缺失或高于当前 → 抛可读错误要求重建（无迁移函数）。`Sheet.snapshot()` 不产生 `version` / `datasets` / `colWidths`，由设计器 `getTemplate()` 吐出时附加。配套：`getTemplateDatasets` / `getBoundDatasetIds` / `resolveTemplateParams` / `resolveParamDefaults` / `fetchTemplateRecords`。
- **Filter Bar 值规范化（filter-bar.ts）**：`parseDateRangeValue` / `resolveNumberParamValue` / `patchParamValues`。
- **Filled Report XLSX 导出（export-xlsx.ts）**：`exportFilledReportXlsx(sheet, colWidths)`；列宽未进 SheetSnapshot，经 VTable 运行时读取后显式传入。
- **数据连接器**：`DataConnector` 接口 + `createHttpConnector`；report 模块严禁引入数据库驱动。
- 测试见 `src/report/__test__/` 与 `src/report/render/__test__/`：坐标纯计算、渲染回归、连接器契约；不依赖 playground mock。

## UReportViewer（components/report/，ADR-0003 决策 2）

- Props：`connector`（必填）、`template`（必填，`ReportTemplate`，可含 `colWidths`）、`workbook?`（USheet 先例，缺省内部自建）、`colWidths?`（显式覆盖模板列宽，载入后写入 VTable 运行时供导出读取）。Exposed：`refresh()`（重新取数并展开渲染）、`exportXlsx()`（导出填充报表 XLSX；取数完成前拒绝；不内置导出按钮，工具栏由下游决定）。
- 运行态闭环：`useReportViewer`（headless：参数提取 → Filter Bar → `fetchTemplateRecords` 取数 → `renderReport` 展开，并发守卫只应用最后一次取数）+ 薄 UI 壳（`report-viewer.vue`）。内部 `UReportFilterBar` 按参数类型映射 `UInput/UNumberInput/USelect/UDatePicker/UDateRangePicker`（text/number/select/date/date-range），改值即重新取数；取数有 loading 遮罩、业务错误（`ok:false`）有可读 banner。
- 展示：内嵌只读 USheet（无工具栏/公式栏/tabs）；先铺模板静态结构，取数成功后 `restore` + `restoreContent` 替换为 Filled Report（网格渲染行列数 = max(50×10 下限, 快照尺寸)）。
- 样式入口 `@veltra/sheet/components/report/style`（自含 USheet 与 Filter Bar 桌面组件样式）。
- 组件级测试（缝隙 3）：`components/report/__test__/report-viewer.test.ts`（happy-dom + 内存 stub connector 全流程）。

## UReportDesigner（components/report/，ADR-0003 决策 2 / ADR-0004 首个消费者）

- Props：`connector`（必填）、`v-model:connections`（纯序列化连接对象，仅驻留内存，ADR-0003 决策 4）、`template?`（载入既有 Report Template 继续设计）、`workbook?`（USheet 先例，缺省内部自建）。Exposed：`getTemplate()`（取回含 `version`、meta 绑定与内嵌数据集定义的 `ReportTemplate`）。
- 全量设计态：数据中枢 drawer、字段面板拖拽绑定、预设徽章、Action Pill、拓扑连线、条件规则对话框、预览模式（内嵌 UReportViewer）、XLSX 导出。
- `useReportDesigner`（headless）：连接 / 数据集状态、绑定写 Cell Meta、徽章 hook、Action Pill 就地编辑（`patchActiveBinding` / `removeActiveBinding`、父格点选拾取）、拓扑条目（`bindingEntries` / `metaTick`）、模板吐出与载入。落格推断：同列向上找最近纵向扩展绑定为 `rowParent` 候选、同行向左找最近横向扩展绑定为 `colParent` 候选；默认预设「明细」；跨数据集拖拽保留字段自身 `dataset`。内部数据集 `DesignerDataset` 以 `connectionId` 引用连接，`getTemplate()` 吐出时解析为内嵌连接对象。
- **`template` prop 载入**：快照 `restore` + `restoreContent` 恢复网格绑定；内嵌数据集还原为设计态（`connectionId` 引用），内嵌连接按 id 合并进 v-model 列表（仅缺省追加，宿主同 id 连接优先）；describe 自动恢复字段缓存（业务错误忽略，字段留空可在数据中枢重试）。
- **预览模式**：内嵌查看器路径（05）——切预览时 `getTemplate()` 吐出快照交给 UReportViewer（自持 `previewWorkbook`，导出需拿填充后 sheet），Filter Bar / 取数 / 展开 / loading / 错误提示全走查看器；设计态工作簿不受预览影响，切回绑定不丢。`getTemplate()` 捕获设计态列宽写入 `colWidths`；载入模板时恢复至设计网格，查看器取数后按 `resolveFilledColWidths` 映射物理列宽。
- 数据中枢 drawer（`designer-hub.vue` + `hub-connection-form.vue` + `hub-dataset-editor.vue`，内部不导出）：连接 CRUD 走 `v-model:connections`（删连接级联删其数据集）；测试连接 / describe 字段解析 / 记录预览全经 `DataConnector`（无 mock）；`${param}` 参数提取用内核 `buildParamDefs`（纯函数），describe 成功的字段写入数据集 `fields` 缓存（字段面板 catalog 数据源，`fieldOverrides` 在 catalog 层应用）。
- 字段面板（`field-panel.vue`）：HTML5 拖拽（`FIELD_DRAG_MIME` 负载 `datasetId:fieldName`，编解码在 `field-panel-helpers.ts`）；网格宿主 drop 经 VTable hit-test 解析落点，落空回退当前选区。
- 绑定格富渲染徽章（`binding-badge.ts`）：`resolveCellRenderer` 按格返回预设色彩徽章（`REPORT_PRESET_BADGE_COLORS`）；遵守 cell hook 性能契约（纯函数、同步、O(1) 查找；label 经 `fieldLabelMap` 查找表）。
- 设计态覆层与对话框（`designer/`，内部不导出）：Action Pill（`float-panel.vue`，预设 / 展开方向 / 聚合 / 父格点选 / `mergeSpan` / 条件样式 / 排序 / 删除绑定）、拓扑连线（`topology-overlay.vue` + `topology.ts`，SVG 弧线反映真实存储的 `rowParent` / `colParent`）、条件规则对话框（`rules-dialog.vue` + `rule-row.vue` + `rule-preview.vue` + `conditional-rules/helpers.ts`；`field` / `scope` 编辑）、网格覆层基础设施（`cell-coords.ts` / `use-grid-overlay.ts` / `col-widths.ts` / `drop-highlight-overlay.vue`）、预设选项与切换默认值（`role.ts` → `presetBindingDefaults` / `REPORT_PRESET_OPTIONS`）。
- 组件级测试（缝隙 3）：`components/report/__test__/report-designer.test.ts` + `use-report-designer.test.ts`（落格推断 / 父格编辑 / 预设切换 / 跨数据集）+ `topology.test.ts` / `conditional-rules-helpers.test.ts` / `float-panel-position.test.ts`。

## 分层约定

| 层            | 职责                        | 禁止                                 |
| ------------- | --------------------------- | ------------------------------------ |
| `tools/`      | 工具注册表 + `SheetContext` | import 组件层                        |
| `components/` | 组件 UI 编排（USheet 等）   | 绕过 `SheetContext` / 命令系统写模型 |

- **写操作一律走命令**：`setCellValue` / `setCells` / `setCellFormula` / `setCellStyle` / `mergeCells` / `insertRows` / `insertImage` / `removeImage` / `updateImage` 等经 `defaultCommandRegistry` → `sheet.history`；`Sheet.applyPatch` 是唯一变更通道。
- **工具只经 `SheetContext`**：不暴露 `Sheet` 实例；扩展天然可 undo。
- **工作簿结构操作**（增删改名 sheet）走 `Workbook`，**不进 undo**，也不经 `SheetContext`；tabs UI 直接调 `Workbook`。
- 内置工具副作用注册必须挂在包入口（`src/index.ts`）；放组件层会被 pack treeshake 丢掉。
- `components/<name>/` 是 `@veltra/vite` 眼中的组件目录（`index.ts` + `style.ts`）：其 `index.ts` 增删 `U*` 导出后，在仓库根运行 `bun run resolver:gen` 刷新组件表。

## 引用 sheet-core

- 公开 API 一律走主入口（`from '@veltra/sheet-core'`）。本包主入口**不 re-export** sheet-core 符号——sheet-core 独立发包，消费方（含 playground）直导；不要为图省事把 core 符号挂回 `@veltra/sheet`。
- 白名单外符号（io 转换函数、内部类型等）深导入 `@veltra/sheet-core/core/*`：tsc 不经 exports `./*` 通配做扩展名探测，`tsconfig.json` 以 `paths: { "@veltra/sheet-core/*": ["../sheet-core/src/*"] }` 兜底，并配 `references` 指向 sheet-core（paths 命中的源码归属被引用项目，避免 composite 的 TS6059/TS6307）。
- 类成员方法（`Sheet.setCell` / `setCellStyles` / `CellStore.setCellValue` 等）为内部便捷写入口，非公开承诺 API——见 `packages/sheet-core/AGENTS.md`「核心语义」注。

## USheet

- Props：`workbook?`、`rows?`(100)、`cols?`(26)、`showToolbar?`、`showFormulaBar?`、`showTabs?`
- Exposed：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`
- 宿主需给高度（`.u-sheet` flex 列，grid `flex:1; min-height:0`）
- 样式：`import '@veltra/sheet/components/sheet/style'`；BEM 元素用 `m.e(name)`，**不要**用单参 `m.bem` 当元素（会丢 `__grid` 等规则）
- 工具栏组序：`history | cell | text | edit | insert | file`；行列插入/删除、冻结在**右键菜单**（非工具栏）
- **右键菜单分区**：body 仅合并/取消合并、插入图片；**插入/删除行列仅在行号/列头**（行号：上下插入行/删除行 + 冻结；列头：左右插入列/删除列 + 冻结）
- SheetGrid 按 sheet **LRU 缓存**（容量 3）：命中只翻可见性；`structure-change` / 尺寸变化 / 导入替换则重建
- 弹层打开用 `setTimeout(0)`，不要用 `queueMicrotask`（否则同一次 click 冒泡会立刻关掉面板）。

## 浮动图片门面与 UI 入口

- **SheetContext 门面**：`insertImage(input)` / `removeImage(id)` / `updateImage(id, patch)` / `getImages()` / `onImageChange(handler)`（读写走命令/事件，不暴露 Sheet）。
- **UI 入口**：工具栏 `insert-image`（组 `insert`，弹层 `UFilePicker`）；右键「插入图片」直接拉起系统文件框；共享逻辑 `components/sheet/insert-image.ts`（`insertImageFromFile`）。
- 叠层渲染与拖动交互在 sheet-core `grid/image-layer.ts`，见其 AGENTS.md。

## 导入导出

- UI：工具栏 `import` 点击直接系统文件选择（`components/sheet/import-file.ts`）；`export` 仍为弹层选
  xlsx / csv。解析进度遮罩由 sheet.vue 持有的 `parsing` / `parseProgress` 驱动
- 大 xlsx 在 Web Worker 解析（`components/sheet/popups/import.worker.ts`：深导入
  `@veltra/sheet-core/core/io/import` 的 `buildWorkbookFromHucre`，xlsx 解析动态
  `import('hucre/xlsx')`）：worker 返回快照数组，主线程**不再 restore 重建临时工作簿**——
  确认后快照直接替换进目标；导出对称地在 Worker 序列化（`tools/export.worker.ts`，
  `tools/download.ts` 采集快照发起，失败回退主线程）；worker 均须列入 pack entry。
  行高随 `SheetSnapshot.rowHeights?` 跨 worker / 持久化传输
- worker 分片构建按 10% 粒度回报进度；sheet 自绘「遮罩+动画+文字」覆盖层
  （`.u-sheet__loading-mask`，动画上文字下同层），不动 desktop Loading 组件
- IO 实现与保真度约定（快照整表替换、批量合并、hucre 表名校验等）在 sheet-core
  `core/io`，见其 AGENTS.md

## 依赖

- **dependencies**：`hucre`（`components/sheet/popups/import.worker.ts` 动态 `import('hucre/xlsx')`）
- **peer**：`@cat-kit/core`（查找防抖 `debounce`）、`@cat-kit/fe`（`saveBlob` 下载）、`vue`、`@veltra/compositions`（条件规则对话框 `useDnD` 拖拽排序）、`@veltra/desktop`、`@veltra/icons`、`@veltra/sheet-core`、`@veltra/utils`、`@veltra/styles`
- **被依赖**：playground

## 构建与测试配置

- **pack entry**：`src/index.ts`、`src/components/sheet/style.ts`、`src/components/report/style.ts`、`src/components/sheet/popups/import.worker.ts`、`src/tools/export.worker.ts`（worker 经 `new Worker(new URL())` 引用，非 import 可达——unbundle 模式下必须显式列为 entry 才会编译进 dist）
- **neverBundle**：全部 peer + `hucre`（含 `@veltra/sheet-core`）；treeshake `moduleSideEffects` 保留 `components/*/style.ts` 与 `tools/builtin.ts`
- **测试**：happy-dom；canvas mock 等测试环境初始化已随 grid 迁至 sheet-core，`setupFiles` 跨包引用 `../sheet-core/src/grid/__test__/setup.ts`

## 已知限制

- 公式栏补全 / 引用选择仅 fx 输入栏，网格内编辑器无同等能力。
- 其余模型 / 渲染层限制（undo 分栈、替换语义、浮动图片、xlsx round-trip 等）见 `packages/sheet-core/AGENTS.md`。

## 验证

```bash
cd packages/sheet && vp test
vp run -F @veltra/sheet build
bun run lint
```
