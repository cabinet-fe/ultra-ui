# AGENTS.md — @veltra/sheet

基于 `@veltra/sheet-core` 的 Vue 电子表格编辑器（USheet）。数据模型 / 渲染内核（原 `src/core`、`src/grid`）已迁至 `@veltra/sheet-core`（见 `packages/sheet-core/AGENTS.md`），本包只做工具系统与 Vue UI 编排。core 符号**不做 re-export**（sheet-core 独立发包，消费方直导，见「引用 sheet-core」）。

## 目录结构

```
src/
├── index.ts              # 聚合导出：仅 sheet 自有能力（components/report 内核/tools/types）；内置工具注册（import './tools/builtin'）
├── components/           # 组件目录（对齐 desktop 模式，Vue 只在这一层；resolver 按目录扫描 index.ts + style.ts）
│   ├── sheet/            # USheet 组件（insert-image 弹层 / 右键）
│   └── report/           # UReportViewer + UReportDesigner 同族共置；内部 filter-bar / 数据中枢 / 字段面板 / designer/（设计态覆层与对话框）不导出
├── report/               # 报表纯 TS 内核（renderReport / binding / rules / params / DataConnector / Report Template / Filter Bar 值规范化 / Filled Report XLSX 导出，框架无关、无 DOM）
├── tools/                # 工具扩展（不 import 组件层）；SheetContext 门面
└── types/                # SheetProps / SheetEmits / SheetExposed / ReportViewerProps / ReportViewerExposed / ReportDesignerProps / ReportDesignerEmits / ReportDesignerExposed
```

模型、命令、公式、IO、SheetGrid、ImageLayer 等 core/grid 内容全部在 `packages/sheet-core/src/`（`core/`、`grid/`），其分层约定、核心语义、VTable 适配要点、性能要点与已知限制见 `packages/sheet-core/AGENTS.md`，本文件不再重复。

## 报表内核（src/report/，ADR-0003 决策 1）

- 纯 TS、headless、无 DOM：渲染引擎 `renderReport`（模板 + records → Filled Report 快照，分组/小计/总计/矩阵展开 + 条件样式打平）、绑定（`REPORT_META_NAMESPACE` / `createReportBinding` / 角色推导 `resolveReportRole` 等）、条件规则（`evaluateCondition` / `evaluateConditionalStyle`）、查询参数（`${param}` 提取 `extractParamIds` / `buildParamDefs` / `resolveBoundDatasetParams`）。
- **Report Template（template.ts）**：自包含模板 = `SheetSnapshot` + 内嵌数据集定义（`ReportTemplate.datasets: ReportDatasetDef[]`，connection 为完整连接对象）。`Sheet.snapshot()` 不产生该字段、`restore()`/`snapshot()` 往返会丢失，由设计器 `getTemplate()` 吐出时附加。配套纯函数：`getTemplateDatasets` / `getBoundDatasetIds`（绑定即真相）/ `resolveTemplateParams`（绑定数据集参数并集，同名先见为准）/ `resolveParamDefaults` / `fetchTemplateRecords`（连接器并行取数 → `DatasetRecords`，业务错误整体透传）。
- **Filter Bar 值规范化（filter-bar.ts）**：`parseDateRangeValue` / `resolveNumberParamValue` / `patchParamValues`（playground 平移，单一事实源；playground 旧文件已删）。
- **Filled Report XLSX 导出（export-xlsx.ts）**：`exportFilledReportXlsx(sheet, colWidths)`（合并 / 样式 / 行高 / 列宽保真；条件样式已在 `renderReport` 展开阶段打平进 StylePool，ADR-0001 决策 2）。列宽未进 SheetSnapshot，只能经 VTable 运行时读取后显式传入（`ReportColWidthEntry`）；与 sheet-core `exportWorkbookXlsx` 的差异即 columns 定义。`buildColumnDefs` / `pxToExcelColWidth` 同文件导出。浏览器下载（saveBlob）在组件层，内核保持无 DOM。
- **数据连接器（词汇表：Data Connector）**：`DataConnector` 接口（`test`/`describe`/`query`）+ `createHttpConnector({ endpoint })`。三端点 `POST {endpoint}/test|describe|query`（无版本段）：请求体 `{ connection }` / `{ connection, sql }` / `{ connection, sql, values }`；业务错误一律 `200 + { ok: false, error: { code, message } }` 原样透传，传输层错误（非 2xx / 网络异常）折叠为 `{ ok: false, error }`，连接器不抛异常。`describe`/`query` 的 fields 归一化为 `DatasetField`（label 回退 name、type 缺省 string）。
- **连接器边界（架构约束）**：report 模块只依赖 `DataConnector` 接口；本包严禁引入数据库驱动或 Node-only 依赖；凭据只驻留内存（无任何持久化，ADR-0003 决策 4）。
- 测试见 `src/report/__test__/`：纯 headless 测试 + `createHttpConnector` mock-fetch 契约测试 + template/filter-bar 内联 fixtures；不依赖 playground mock。

## UReportViewer（components/report/，ADR-0003 决策 2）

- Props：`connector`（必填）、`template`（必填，`ReportTemplate`）、`workbook?`（USheet 先例，缺省内部自建）。Exposed：`refresh()`（重新取数并展开渲染）。
- 运行态闭环：`useReportViewer`（headless：参数提取 → Filter Bar → `fetchTemplateRecords` 取数 → `renderReport` 展开，并发守卫只应用最后一次取数）+ 薄 UI 壳（`report-viewer.vue`）。内部 `UReportFilterBar` 按参数类型映射 `UInput/UNumberInput/USelect/UDatePicker/UDateRangePicker`（text/number/select/date/date-range），改值即重新取数；取数有 loading 遮罩、业务错误（`ok:false`）有可读 banner。
- 展示：内嵌只读 USheet（无工具栏/公式栏/tabs）；先铺模板静态结构，取数成功后 `restore` + `restoreContent` 替换为 Filled Report（网格渲染行列数 = max(50×10 下限, 快照尺寸)）。
- 样式入口 `@veltra/sheet/components/report/style`（自含 USheet 与 Filter Bar 桌面组件样式）。
- 组件级测试（缝隙 3）：`components/report/__test__/report-viewer.test.ts`（happy-dom + 内存 stub connector 全流程）。

## UReportDesigner（components/report/，ADR-0003 决策 2 / ADR-0004 首个消费者）

- Props：`connector`（必填）、`v-model:connections`（纯序列化连接对象，仅驻留内存，ADR-0003 决策 4）、`template?`（载入既有 Report Template 继续设计）、`workbook?`（USheet 先例，缺省内部自建）。Exposed：`getTemplate()`（取回含 meta 绑定与内嵌数据集定义的 `ReportTemplate`）。
- 全量设计态（issue 06 最小闭环 + issue 07 完备）：数据中枢 drawer、字段面板拖拽绑定、角色徽章、Action Pill、拓扑连线、条件规则对话框、预览模式（内嵌 UReportViewer）、XLSX 导出。
- `useReportDesigner`（headless，不持有 DOM / 网格引用）：连接 / 数据集状态、绑定写 Cell Meta、徽章 hook、Action Pill 就地编辑（`patchActiveBinding` 分组锚点守卫 / `removeActiveBinding`）、拓扑条目（`bindingEntries` / `metaTick`）、模板吐出与载入。内部数据集 `DesignerDataset` 以 `connectionId` 引用连接（v-model 连接列表是单一事实源），`getTemplate()` 吐出时解析为内嵌连接对象、丢弃 `fields` 缓存；无匹配连接的数据集不吐出。绑定角色推导与 playground 旧设计器一致（`createReportBinding` 默认值、首列第二行分组锚点约定、同行右侧落格继承分组数据集）。
- **`template` prop 载入**：快照 `restore` + `restoreContent` 恢复网格绑定；内嵌数据集还原为设计态（`connectionId` 引用），内嵌连接按 id 合并进 v-model 列表（仅缺省追加，宿主同 id 连接优先）；describe 自动恢复字段缓存（业务错误忽略，字段留空可在数据中枢重试）。
- **预览模式**：内嵌查看器路径（05）——切预览时 `getTemplate()` 吐出快照交给 UReportViewer（自持 `previewWorkbook`，导出需拿填充后 sheet），Filter Bar / 取数 / 展开 / loading / 错误提示全走查看器；设计态工作簿不受预览影响，切回绑定不丢。设计网格列宽在切预览时经 VTable 运行时捕获（`designer/col-widths.ts`），导出 XLSX 随快照写入。
- 数据中枢 drawer（`designer-hub.vue` + `hub-connection-form.vue` + `hub-dataset-editor.vue`，内部不导出）：连接 CRUD 走 `v-model:connections`（删连接级联删其数据集）；测试连接 / describe 字段解析 / 记录预览全经 `DataConnector`（无 mock）；`${param}` 参数提取用内核 `buildParamDefs`（纯函数），describe 成功的字段写入数据集 `fields` 缓存（字段面板 catalog 数据源，`fieldOverrides` 在 catalog 层应用）。
- 字段面板（`field-panel.vue`）：HTML5 拖拽（`FIELD_DRAG_MIME` 负载 `datasetId:fieldName`，编解码在 `field-panel-helpers.ts`）；网格宿主 drop 经 VTable hit-test 解析落点，落空回退当前选区。
- 绑定格富渲染徽章（`binding-badge.ts`）：`resolveCellRenderer` 按格返回角色色彩徽章（`CustomLayout` 容器 + 文本，`renderDefault: false`），未绑定格返回 `undefined` 回落默认渲染；canvas 绘制需具体色值，`REPORT_ROLE_BADGE_COLORS` 为硬编码角色配色。遵守 cell hook 性能契约（纯函数、同步、O(1) 查找；label 经 `fieldLabelMap` 查找表，不用 `setBindingCatalog` 全局态）。
- 设计态覆层与对话框（`designer/`，内部不导出）：Action Pill（`float-panel.vue`，角色 / 聚合 / 排序 / 条件样式入口 / 删除绑定）、拓扑连线（`topology-overlay.vue` + `topology.ts`，SVG 贝塞尔弧线沿父链上行 + 下行直接子绑定）、条件规则对话框（`rules-dialog.vue` + `rule-row.vue` + `rule-preview.vue` + `conditional-rules/helpers.ts`，运算符按字段类型映射、useDnD 拖拽排序 + 按钮排序）、网格覆层基础设施（`cell-coords.ts` 坐标换算 / `use-grid-overlay.ts` 滚动同步与浮卡锚点定位 / `col-widths.ts` 列宽捕获）、角色选项与切换默认值（`role.ts` `roleBindingDefaults`）。
- 组件级测试（缝隙 3）：`components/report/__test__/report-designer.test.ts`（最小闭环全流程 + template 载入 / 预览切换取数 / 切回绑定不丢）+ `use-report-designer.test.ts`（headless：CRUD / describe / preview / 角色推导 / 徽章 / Action Pill 编辑 / 模板载入与往返）+ `topology.test.ts` / `conditional-rules-helpers.test.ts` / `float-panel-position.test.ts`（随迁纯逻辑）。

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
