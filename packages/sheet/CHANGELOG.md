# @veltra/sheet

## 2.1.1

### Patch Changes

- a81199d: fix(sheet): formula-bar 测试在 CI 中正确解析 @visactor/vtable 依赖

## 2.1.0

### Minor Changes

- 69e68a2: 边框系统重构（修复外边框右边/下边不生效、中间网格线丢失）：

  - `CellStylePatch.border` 边值支持 `null`（边级删除）：`border` 字段从重定义整个边集合改为
    **边级合并**——边值为对象与既有边合并、为 `null` 删除该边、未列出的边保留
    （`border: {}` 不再清除全部边框，清除需显式四边 `null`）
  - 新增 `core/style/border-presets`（`buildBorderPresetItems` / `BorderPreset` / `BorderPresetItem`）：
    边框预设生成迁入 core（纯函数），并对齐 Excel/univer「写入时同步邻居」——外边框/无边框
    同步清选区外一圈邻居的对侧边，下边框清下一行邻居 top；一次预设应用 = 单 undo 单元，
    undo 自动还原邻居格
  - 渲染层修复两条根因：未自定义的边显式回落主题网格线（`GRID_BORDER`/1px，修「只设填充
    或部分边时网格线丢失」）；主题新增 `cellBorderClipDirection: 'bottom-right'`（修「1px 右/
    下边框落在邻居格内被填充覆盖」），配合共享边双向溯源（每边 = 本格自定义边 ?? 邻居对侧
    边 ?? 网格线）与 `cell-change` 四邻样式缓存刷新
  - `vtable-theme.ts` 导出 `GRID_BORDER` 常量（sheet-grid 网格线回落共用，消除两处硬编码漂移）

- 9aa6c0c: 右键菜单增强 + 行列头菜单：

  - `@veltra/desktop` `ContextmenuItem` 新增 `divider` / `render` / `keepOpen`；导出
    `ContextmenuRootDIKey` 供内嵌组件主动关闭菜单
  - `@veltra/sheet` 行号/列头右键独立菜单（插入上下/左右 + 删除 + 冻结/取消冻结）；
    body 插入行/列改为菜单内嵌 `UNumberInput`（默认 N = 选区覆盖行/列数），不再弹独立面板
  - 修复 `deleteRows` / `deleteCols` undo 不还原删除区间内单元格数据的问题
    （`prepareDeletedCellPatches` + undo 在反向结构之后恢复）

- 9aa6c0c: 默认选区 A1 + 快照序列化选区：

  - 新建工作簿 / `addSheet` 默认选中 A1（名称框、画布高亮、fx 输入栏可用）
  - `SheetSnapshot.selection?` 往返保留选区；旧快照缺省回落 A1
  - 导出已传 `activeSheet`（写 activeTab）；hucre 不支持 OOXML `<selection>`，导入一律默认 A1

- 5b07bd5: 电子表格增强（plans/sheet-enhancement Phase 1-5）：

  - 样式系统：StylePool 按内容去重，单元格持 StyleId；背景填充 / 四边边框，命令可 undo
  - 冻结行列：模型状态持久化，VTable 映射即时生效；查找替换（显示值 / 公式原文、大小写、整格匹配，替换单 undo 单元）
  - 多 sheet：renameSheet 跨表引用跟随，removeSheet 联动引用方重算 `#REF!`；tab 栏添加 / 重命名 / 删除
  - 公式栏：名称框 + fx 输入栏，与网格双向同步（`showFormulaBar` prop）
  - 导入导出：XLSX / CSV（hucre），值 / 公式 / 合并 / 样式 / 冻结保真
  - 选区回驱：模型选区与 VTable 高亮双向同步

- 121918a: 字号弹层改为下拉列表：垂直排列（desktop `UScroll` 自定义滚动条）、当前字号高亮；
  工具栏 tooltip 方向改为 top-center。
- 9aa6c0c: fx 公式栏交互基础版：函数补全 + 画布引用选择。

  - `FormulaFunctionMeta` / `listFormulaFunctions()`；13 个内置函数补全 meta（params + 中文说明）
  - fx 输入 `=` 弹出候选（前缀过滤上限 10；↑↓ / Tab / Enter / 点击 → `NAME(`）
  - 引用选择模式：运算符/`(`/`,` 后点选/拖选插入 `A1` / `A1:B2`；blur 抑制防误提交
  - Esc 分层：先关候选再取消编辑；镜像只读期不弹补全

- 60abc6f: xlsx 导入链路性能优化（196 sheet / 76 万格实测）：

  - **快照整表替换**：`replaceWorkbook` 内部改走新命令 `RestoreSheetCommand`（`sheet.restore-sheet`，
    `SnapshotPatch` 整表补丁）——替换/undo/redo 不再逐格 `setCells`（消除主线程十万级视图同步），
    新增 `content-reset` 事件供视图层 `setRecords` 全量刷新一次
  - **批量结构事件**：`Workbook.beginBatch()/endBatch()` 合并结构事件补发（196 次 `sheets-change`
    风暴收敛为 1 次）；`replaceWorkbookWithSnapshots` 新入口直取 worker 快照数组（主线程不再
    restore 重建临时工作簿）
  - **批量合并**：`Sheet.mergeCellsBatch(ranges)`（`sheet.command.merge-cells-batch`）——导入
    1016 个合并区域 1 次命令 = 单 undo 单元，批量内相交边收集边应用与逐条语义一致
  - **样式 memo**：按 hucre 样式池共享子对象引用组合 key 缓存 StyleId，跳过重复样式解析与 intern
  - **worker 进度反馈**：`buildWorkbookFromHucre` 分片构建，按 10% 粒度回报进度；sheet 自绘
    「遮罩 + 动画 + 文字」覆盖层（readXlsx 段「正在读取文件结构…」/ 分片段「正在解析… X/Y」）
  - 选区对齐改静默（`selection.restoreState`），补漏遍历先解析行号省列解析
  - 修复：整表替换后被清空的旧格纳入重算标脏（跨表引用方缓存联动）

- 34dca61: xlsx 导入性能与交互反馈优化：

  - **解析提速**（`core/io/import.ts`）：hucre 稠密行数组空槽快速跳过 + 表格尺寸按实际使用范围收敛。实测 196 sheet / 75 万格预算套表：解析 110s → 3.5s；含「全选设边框」残留（整表 13327 行 × 16384 列空白格式格）的 sheet 不再把渲染尺寸撑到 Excel 极限，切换 30s → 0.3s
  - **解析移入 Web Worker**（`vue/popups/import.worker.ts`）：选文件后主线程空闲（loading 动画正常转、页面可交互），解析完成才弹确认框；worker 不可用（构造失败/加载失败）自动降级主线程解析
  - **交互反馈**：解析期经 provide/inject 状态在 grid 容器挂 desktop `v-loading`；replaceWorkbook 前「正在导入…」常驻提示（try/catch/finally 兜底，失败明确报错）；等首帧渲染完成再报「导入完成」（导入后立即点单元格/滚动不再撞上 vrender 渲染任务，实测 3~5s → 16ms）
  - **desktop message-confirm**：根元素补基础 `transition`——Vue transition-group 检测不到根过渡时 after-leave 同步触发，弹窗关闭动画被 onClosed 同步重活阻塞（点击后卡 1.6s 才关）

- 121918a: - `@veltra/sheet`：弹层型工具面板（填充/边框/字体色/字号/查找/导入/导出）改为 `UDropdown`
  锚点定位（Teleport 到 `#pop-container` + floating-ui）——面板左缘跟随触发按钮、自动翻转 /
  边界移位；工具栏滚动 / 窗口缩放时自动关闭（不再固定钉在工具栏右下角）
  - `@veltra/utils`：`getScrollParents` / `getNearestScrollParent` 将横向可滚动父级
    （`overflow-x` 容器）计入——弹层在横向滚动容器内能正确监听滚动并自动关闭
- c00bf59: 浮动图片：支持插入、叠层渲染、删除与 xlsx round-trip，便于在表格中锚定展示本地图片。锚点支持格内像素偏移（offsetX/offsetY），拖拽自由定位不吸附单元格；渲染宽高优先取图片自身 width/height，from→to 跨度仅作兜底。
- 7b75830: 行列插入/删除（Phase 7）：

  - `Sheet` / `SheetContext` 新增 `insertRows` / `insertCols` / `deleteRows` / `deleteCols`（可 undo/redo）
  - 数据、合并区、行高、公式引用（含跨表、`$` 绝对引用、引用被删转 `#REF!`）按 Excel 语义平移/裁剪
  - `Sheet.rows/cols` 表格尺寸随操作增长并随快照持久化；发 `structure-change` 事件
  - 工具栏 `structure` 组 + 单元格右键菜单提供插入/删除行/列入口；Grid 渲染行列数随模型联动
  - 插入行/插入列为弹层型工具：数量输入面板（默认 1、钳制 1-100、Enter 提交，一次插入 = 单 undo 单元）
  - `Sheet.ensureTableSize(rows, cols)`（`@internal`）：视图声明尺寸写入模型（扩张语义），
    修复插入点小于渲染 props 时 `max(props, sheet.rows)` 恒取 props、行/列数不增长的缺陷
  - 弹层修复（真实浏览器）：`openPopup` 改 `setTimeout` 宏任务打开（避免同次 click 冒泡
    `onWindowClick` 秒关面板）；popup 移入 `toolbar-wrap` 定位（避免被 `.u-sheet` overflow
    裁剪不可见）

- 4368035: 新增 `@veltra/sheet-core` 包，file-viewer Excel 预览迁移：

  - **@veltra/sheet-core（新包）**：框架无关表格核心——`core/`（数据模型 / 命令 / 公式 / IO）+
    `grid/`（VTable 适配层 SheetGrid / ImageLayer）自 `@veltra/sheet` 迁入；SheetGrid 新增
    `readonly` 模式（不挂编辑器、禁编辑回写 / 填充柄 / undo 快捷键 / 行列 resize / 图片拖动删除，
    保留选择 / 滚动 / 右键回调），供只读预览场景使用
  - **@veltra/sheet**：core/grid 迁至 sheet-core，`src/index.ts` 从其 re-export 白名单，
    公开 API 不变；peer 新增 `@veltra/sheet-core`，`@visactor/vtable(-editors)` 不再直接依赖
  - **@veltra/desktop**：file-viewer 的 Excel/CSV 预览从 `@cat-kit/excel` + 裸 `ListTable`
    迁移到 `@veltra/sheet-core`（readonly SheetGrid）——样式 / 合并单元格 / 行高 / 冻结 /
    公式计算保真；peer 移除 `@cat-kit/excel`、新增 `@veltra/sheet-core`，dependencies
    移除 `@visactor/vtable`；`sheetMaxRows` 不再硬裁模型（超限时提示条文案改为如实说明）

- 9aa6c0c: 文本样式系统（字体颜色 / 加粗斜体下划线删除线 / 字号 / 对齐 / 换行）：

  - `CellStyle` 扩展 `font` / `align`；样式池与 `mergeCellStyle` 支持逐字段合并（`{}` 清除该类）
  - 导入 xlsx 还原字体颜色等文本样式；导出反向映射
  - VTable 渲染映射 + wrap 行高按需估算（非全局 autoHeight）
  - 工具栏 text 组：B/I/U/S、对齐 ×6、换行、字体颜色/字号弹层（本阶段文字按钮）

- 637c2e2: 工具栏单行溢出滚动：窄容器下工具按钮不再 `flex-wrap` 换行（避免挤压 grid 高度），
  改为左右箭头步进导航 + 纵向滚轮转横滚（`use-toolbar-scroll`，对齐底部 tabs 溢出交互模式）。
- 9aa6c0c: 工具栏重构（图标化 / 分区 / 精简 / 导出合并）：

  - `@veltra/icons`：新增 sheet 工具栏缺口图标（bold/italic/underline/strikethrough/font-color/font-size/fill/border/merge-cells/unmerge-cells/wrap）
  - `@veltra/sheet`：内置工具重组为 history ｜ cell ｜ text ｜ edit ｜ file；全面图标 + UTip tooltip
  - 移除 structure/freeze 工具栏入口与 insert-cells-popup（行列插入删除/冻结改由右键菜单）
  - 导出合并为单 `export` 弹层（Excel / CSV）；playground 清理 demo 工具

### Patch Changes

- c00bf59: 浮动图按 Excel 两点锚定定位并支持拖动；导入直接打开文件选择并调换导入/导出图标；重绘换行图标，新增彩色字体颜色图标。

## 2.0.1

### Patch Changes

- cf7561e: 新增填充柄（公式 `$` 感知位移、数字/日期等差、其余 tile 复制）、行高拖拽调整与模型稀疏持久化（tab 切换重建还原，不进 undo）、默认 VTable 主题（白底 body、浅灰行号/列头、textOverflow clip）及单元格右键菜单（合并/取消合并，语义对齐内置工具）。

## 2.0.0

### Minor Changes

- 58f06c0: 新增自研公式引擎：tokenizer → Pratt parser → AST → evaluator，支持单元格/区域/跨表引用（含带引号表名）与可扩展函数注册表（内置 SUM / AVERAGE / MAX / MIN / COUNT / COUNTA / IF / AND / OR / NOT / ROUND / ABS / CONCATENATE）。工作簿级依赖图按拓扑序增量重算，循环引用检测为 `#CYCLE!` 且打破循环自动恢复；完整错误值体系（`#DIV/0!` / `#VALUE!` / `#NAME?` / `#REF!` / `#ERROR!` / `#CYCLE!`）。`=` 开头输入走 `SetCellFormulaCommand`，重算派生变更并入同一撤销单元；grid 层公式格显示计算值、编辑时显示公式原文。
- d28b0e7: 新增工具扩展机制与 `USheet` 组件。`registerTool()` 注册表支持分组、排序、`visible`/`disabled` 状态函数；第三方工具只能通过 `SheetContext` 门面操作（选区读写、命令执行、事件订阅），保证扩展不绕过命令系统、undo 全覆盖。内置 undo/redo（随历史状态置灰）与合并/取消合并工具。`USheet` 组件组合工具栏 + 表格 + 底部 sheet tabs，支持传入 `Workbook` 多表切换；`SheetGrid` 新增拖选区域同步（DRAG_SELECT_END → 模型选区）。
- 687f74d: 新增 Undo/Redo 命令系统：所有模型写操作（单元格读写、合并/取消合并）统一改造为命令执行，每个命令产出携带 before/after 差量补丁的 Mutation；`HistoryManager` 提供 undo/redo 栈、事务（一次批量变更 = 一个撤销单元）与 200 条容量上限。grid 层接入 `Cmd/Ctrl+Z`、`Cmd/Ctrl+Shift+Z`、`Ctrl+Y` 快捷键，新增 `history-change` 事件驱动按钮置灰。

### Patch Changes

- Updated dependencies [394ea96]
  - @veltra/styles@2.0.0
  - @veltra/utils@2.0.0
