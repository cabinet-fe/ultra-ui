# AGENTS.md — @veltra/sheet

基于 `@visactor/vtable`（ListTable）的电子表格包。**数据模型完全自持有，VTable 只做渲染与输入的视图层**：所有单元格操作都作用在自己的模型上，VTable 通过适配层被动刷新。

## 目录结构

```
src/
├── index.ts              # 聚合导出（兼内置工具注册入口：import './tools/builtin'）
├── env.d.ts              # .vue / .scss 模块声明
├── core/                 # 框架无关纯 TS，可单测、可无头运行（不 import vue / vtable）
│   ├── __test__/         # core 单测
│   ├── address.ts        # A1 地址系统（0-based CellAddress / 闭区间规范化 CellRange）
│   ├── cell-store.ts     # 稀疏矩阵存储（Map<row, Map<col, CellData>>）
│   ├── fill.ts           # 填充柄纯逻辑（tile / 数字日期等差 / 公式 $ 感知位移）
│   ├── find.ts           # 查找纯逻辑（findAll / findNext / findPrev，行主序到边界循环）
│   ├── merge-manager.ts  # 合并单元格（只管几何，不管数据）
│   ├── selection.ts      # 选区模型（activeCell 恒为锚点）
│   ├── sheet.ts          # Sheet = store + merge + selection + history，统一操作入口
│   │                     #   + frozen（冻结，不进 undo，随快照序列化）
│   │                     #   + 默认选区 A1；snapshot.selection? 往返（旧快照缺省回落 A1）
│   ├── workbook.ts       # Workbook = 多 Sheet（共享公式依赖图；增删/重命名/激活 + 事件）
│   ├── events.ts         # 包内轻量类型化事件发射器（内部基建）
│   ├── command/          # 命令系统（undo/redo）
│   │   ├── types.ts          # Command / Mutation / Patch（CellPatch | MergePatch，before/after 差量）
│   │   ├── registry.ts       # CommandRegistry（register / execute）
│   │   ├── history.ts        # HistoryManager（undo/redo 栈 + 事务 + 容量上限 200）
│   │   ├── set-cell-value.ts # SetCellValueCommand（批量，供粘贴/填充复用）
│   │   ├── set-cell-formula.ts # SetCellFormulaCommand（只写 f，缓存由重算派生补丁填充）
│   │   ├── set-cell-style.ts # SetCellStyleCommand（批量 + 部分合并语义，样式写入）
│   │   ├── merge-cells.ts    # MergeCellsCommand / UnmergeCellsCommand
│   │   └── default-registry.ts # 默认注册表（内置命令在此注册，全局共享）
│   ├── style/            # 单元格样式系统（纯 TS）
│   │   ├── types.ts          # CellStyle / CellStylePatch（font/align 逐字段合并，null 删字段；边级合并）/ StyleId
│   │   ├── style-pool.ts     # StylePool（按内容去重、intern/get、snapshot/restore；key 含 font/align）
│   │   └── border-presets.ts # 边框预设生成（all/outer/bottom/none + 邻居共享边同步，纯函数）
│   ├── io/               # 导入导出（纯 TS，基于 hucre；不 import vue/vtable）
│   │   ├── export.ts         # exportWorkbookXlsx / exportSheetCsv（模型 → hucre）
│   │   └── import.ts         # importXlsx / importCsv / replaceWorkbook / copySheetContent
│   └── formula/          # 公式引擎（纯 TS，可无头运行）
│       ├── errors.ts         # 错误值体系（#DIV/0! #VALUE! #NAME? #REF! #ERROR! #CYCLE!）
│       ├── ast.ts            # AST 节点 + collectReferences
│       ├── tokenizer.ts      # 分词器（FormulaParseError）
│       ├── parser.ts         # Pratt parser（优先级同 Excel）
│       ├── evaluator.ts      # AST 求值 + 强转规则（纯函数，读取经 FormulaEvalContext 注入）
│       ├── functions.ts      # 函数注册表 + meta / listFormulaFunctions + 13 个基础函数
│       └── dependency-graph.ts # DependencyGraph（工作簿级：sheet 注册表 + 双向索引 + 增量重算）
├── grid/
│   ├── __test__/         # SheetGrid smoke + canvas mock（vp test setupFiles）
│   ├── vtable-theme.ts   # Sheet 默认 VTable 主题（body 白底、行号/列头浅底、textOverflow clip）
│   └── sheet-grid.ts     # VTable 适配层（主题/行高/填充柄/右键回调、编辑器、事件回写、键盘）
├── tools/                # 工具扩展机制（不 import vue）
│   ├── __test__/         # registry / context / builtin 单测
│   ├── registry.ts       # ToolRegistry + defaultToolRegistry（registerTool / unregisterTool；active 高亮字段）
│   ├── context.ts        # SheetContext 门面（工具的唯一操作入口，含冻结读写 + workbook 只读）+ createSheetContext
│   ├── download.ts       # 浏览器 Blob 下载 + exportWorkbookFile / exportSheetCsvFile
│   └── builtin.ts        # 内置工具（history/cell/text/edit/file），经包入口注册
├── vue/                  # USheet 组件（Vue 依赖只在这一层）
│   ├── __test__/         # 组件测试（happy-dom + canvas mock）
│   ├── sheet.vue         # 精简编排层：组合状态源 / 弹层 / 网格，拼装各区块（无业务逻辑）
│   ├── sheet-toolbar.vue # 工具栏（单行溢出滚动 + 箭头导航；图标 + UTip tooltip；点击上交宿主编排）
│   ├── sheet-tabs.vue    # 底部 sheet tabs（切换 / 添加 / 行内重命名 / 右键删除，直调 Workbook）
│   ├── formula-bar.vue   # 公式栏（名称框 + fx；补全 / 引用选择 / 双向同步 / 镜像）
│   ├── formula-suggest-list.vue # fx 函数候选列表（绝对定位，mousedown.prevent）
│   ├── popups/           # 弹层型工具面板（v-if 挂载即全新状态；交互走 SheetContext 命令入口）
│   │   ├── fill-color-popup.vue   # 填充颜色（UPalette）
│   │   ├── border-popup.vue       # 边框（预设 / 线型 / 颜色）
│   │   ├── font-color-popup.vue   # 字体颜色（UPalette；空 = 清除 color）
│   │   ├── font-size-popup.vue    # 字号预设（pt）
│   │   ├── find-popup.vue         # 查找替换条
│   │   ├── import-popup.vue       # 导入（UFilePicker）
│   │   └── export-popup.vue       # 导出选择（xlsx / csv）
│   ├── use-sheet-state.ts    # 状态源：workbook / sheetList / activeIndex / context / 事件绑定 / stateTick
│   ├── use-tool-popup.ts     # 弹层编排：popupTool / popupAnchor（触发按钮锚点）/ 开关 / 面板事务 / window click / Ctrl+F
│   ├── use-tool-groups.ts    # 工具栏分组视图模型（组序 history｜cell｜text｜edit｜file）
│   ├── use-sheet-grid.ts     # SheetGrid 生命周期 + 网格右键菜单 + 引用选择拦截
│   ├── use-formula-suggest.ts # fx 函数补全纯逻辑（上下文 / 过滤 / 替换 / 导航）
│   ├── use-formula-ref-select.ts # fx 引用选择纯逻辑（上下文判定 / 插入文本）
│   ├── sheet-context-menu.ts # 右键菜单纯函数（header/body 菜单构建、整行整列选区、默认 N）
│   ├── insert-count-menu-item.vue # 菜单内嵌数量输入（UNumberInput + 确认 / Enter / Esc）
│   ├── use-find-replace.ts   # 查找替换逻辑（find-popup 使用）
│   ├── popup-helpers.ts      # 无状态工具：currentRange / 边框面板常量（预设补丁生成已迁 core/style/border-presets）
│   ├── use-sheet-tabs-bar.ts # tabs 视口溢出滚动（showNav / canPrev / canNext / scrollByStep）
│   ├── use-toolbar-scroll.ts  # 工具栏单行溢出滚动（箭头导航 + 滚轮横滚；对齐 tabs 交互模式）
│   ├── index.ts          # 导出 USheet
│   ├── style.scss        # pkg:@veltra/styles token（m.e 元素、m.is 状态，不写硬编码颜色）
│   └── style.ts          # 样式入口（sideEffects；含 tip/contextmenu/palette/number-input）
└── types/                # 对外类型（<Name>Props 约定）
    └── sheet.ts          # SheetProps / SheetEmits / _SheetExposed / SheetExposed
```

## 命令系统（undo/redo）

- **一切写操作都是命令**：`Sheet.setCellValue / setCell / setCells / setCellFormula / setCellStyle / setCellStyles / clearCellStyle / mergeCells / unmergeCells`
  全部经 `defaultCommandRegistry` 执行并推入 `sheet.history`，没有绕过入口；
  `Sheet.applyPatch` 是命令执行与 undo/redo 回放共用的唯一变更通道。
- Patch 是 before/after 差量（非全量快照）；同一批补丁双向回放（redo 应用 after，undo 应用 before），
  mutation 的 undo 列表为 redo 的逆序（如 undo 合并时先移除新合并再恢复旧合并）。
- `MergeCellsCommand` 的 Patch 捕获完整 before 状态：被解除的旧合并记录 + 包围盒内每格原数据，
  undo 连被清空的值一起还原。
- 事务：`sheet.beginTransaction() / commit()`（可嵌套，拍平到最外层）= 一个 undo 单元；
  `rollback()` 回滚缓冲中的变更并放弃事务；事务进行中 undo/redo 返回 false。
- 容量上限默认 200（`DEFAULT_HISTORY_CAPACITY`），超出淘汰最旧条目。
- `history-change` 事件携带 `{ canUndo, canRedo }`，供工具栏按钮置灰。
- **选区不进历史**：undo/redo 不改变 selection（与 Excel 不同，有意为之）。
- 低层接口：`MergeManager.addMerge / removeMerge`（精确增删，不做包围盒）与 `computeMerge`
  （纯查询）供命令回放使用，业务代码不应直接调用。

## 默认选区与快照序列化

- **新建默认 A1**：`Sheet` 构造末尾 `selectCell({ row: 0, col: 0 })`——新工作簿 / `Workbook.addSheet`
  自然继承；名称框显示 `A1`、画布高亮、fx 输入栏可用（视图层零改动，靠既有选区回驱）。
- **快照字段**：`SheetSnapshot.selection?`（`{ activeCell, ranges }`，可选，向后兼容）。
  `snapshot()` 有活动格时写入；`restore()` 有则静默还原（不发 `selection-change`，由调用方
  重建 grid 回驱），旧快照缺省 → 回落 A1。活动格经合并锚点解析，畸形范围钳入首选区。
- **选区仍不进 undo**（快照序列化 ≠ undo 历史）。
- **不做**：滚动位置（`topLeftCell`）持久化；多选区 / 冻结 pane 多 selection 互操作。

## 多 Sheet 管理（Phase 3：添加 / 删除 / 重命名）

- **API**（`core/workbook.ts`）：`addSheet(name?)`（缺省 `Sheet{n}` 保证唯一）、
  `removeSheet(name)`（至少保留一个，返回 boolean）、
  `renameSheet(oldName, newName): boolean`——trim 后空名拒绝；与现有表重名拒绝
  （不区分大小写，含自身大小写变体，与 Excel 一致）。事件：`sheets-change`（增删）、
  `sheet-rename`（改名，携带 `{ sheet, oldName, newName }`；sheet 列表本身未变，不发 sheets-change）。
- **`Sheet.name` 受控**：只读 getter（私有 `_name`），直接赋值被类型系统拒绝；
  唯一改名入口 `Workbook.renameSheet` → `Sheet.setName`（`@internal`，业务不得直接调用）。
- **重命名引用跟随**：`DependencyGraph.renameSheet(old, new)` 把被改名表自身节点与所有
  引用该表的节点（单格 + 区域）整体重索引到新名——跨表公式引用改名后保持有效；
  本表引用与显式自名引用（`='S2'!A1`）同样跟随。undo/redo 回放不受影响
  （图状态由 applyPatch → syncCell 维持，节点内部 sheetName 已切新名）。
- **删除联动重算**：`removeSheet` 注销表前收集引用方（exact/ranged 反向索引），注销后
  立即重算——引用方变 `#REF!`（含传递依赖者）。派生补丁经 `Sheet.applyDerivedPatches`
  （`@internal`，走 boundApplyPatch 同一变更通道）应用，**不入 undo 历史**。
  激活项修正：删除激活项 → 激活相邻（删末尾回退前一项）；删除激活项之前的项 →
  activeIndex 前移保持激活项。
- **门面边界（结论）**：`SheetContext` **不暴露** sheet 增删改名——增删改是工作簿级
  结构操作（非单元格写操作），**不走 undo**（undo 栈按 sheet 分栈，结构变更入栈语义不清）。
  宿主经 `Workbook` 直接操作；USheet 内部 tabs UI 直接调用 Workbook（不经 SheetContext）。

## 冻结 / 查找 / 选区回驱（Phase 2）

- **冻结是模型状态**：`Sheet.frozen`（读副本）/ `setFrozen(rows, cols)`（规范化到非负整数，
  相同值不触发事件）；`frozen-change` 事件。**不进 undo**（同 `rowHeights` 先例），
  随 `Sheet.snapshot()` 序列化、`restore()` 还原（冻结变化时发事件，grid 自动刷新）。
- **冻结入口**（工具栏无 freeze 组；经行列头右键菜单）：冻结到当前行/列、取消冻结
  （无冻结时 disabled）；模型 `setFrozen` / `frozen` 仍是唯一状态源。
- **VTable 冻结映射**（Spike 结论，见下方适配层要点）：模型 `rows` → `frozenRowCount = rows + 1`（列头行），
  `cols` → `frozenColCount = cols + 1`（行号列）；钳制到渲染行/列数。构造选项 + `frozen-change` 即时生效，
  tab 重建还原。
- **查找纯逻辑**（`core/find.ts`，无头可测）：`findAll` / `findNext` / `findPrev`（行主序、到边界循环）。
  遍历存储中真实存在的格（空格无文本）；合并格锚点语义天然不重复。options：`caseSensitive`、
  `wholeCell`（整格）、`searchIn: 'value' | 'formula'`（value 走 `getDisplayValue`，formula 匹配 `f` 原文）。
- **查找条**（USheet 弹层型工具 `find`，不参与面板事务）：关键词 / 上一个 / 下一个 / 命中计数 / 关闭
  （Enter=下一个、Shift+Enter=上一个）+ 替换 / 全部替换（替换写入走 `ctx.setCells`，
  全部替换 = 一次批量 = **单 undo 单元**，undo 一次全部还原）；Ctrl/Cmd+F 开合。
- **选区回驱**（补足原「选区单向同步」限制）：grid 订阅 `selection-change` →
  `table.selectCells([范围])` 高亮 + `table.scrollToCell(锚点)` 滚动可见。
  VTable `selectCells` 会同步派发 `SELECTED_CELL`，回驱期间用 `syncingSelection` 标志拦截回写（防递归）。
  tab 重建 grid 时按模型选区回驱一次（VTable 视觉选区不再丢失）。
- **⚠️ VTable 时序缺陷（1.26.5，选区回驱必读）**：mouseup 事件流中 canvas 级 pointerup
  派发 `SELECTED_CELL` 时 `eventManager.isDraging` **尚未重置**（window 级 pointerup 在其后才置 false）。
  此时回驱 `selectCells` 内部 `updateSelectPos` 会走「拖拽扩展」分支而非「清空重建」分支，两种表现：
  1. 旧选区组件残留为孤儿（组件 Map 清不到）→ 画布叠加多个选区框（视觉上多区域同时高亮）；
  2. 反向拖选（从右往左 / 从下往上）时选区被错误收缩/畸形（如 D1→A1 变成 D1:D1 单格）。
     **规避**（`SheetGrid.pushSelectionToTable`）：回驱前临时把 `eventManager.isDraging` 置 false
     （让 `selectCells` 走标准清空-重建路径，`finally` 还原），并调 `clearSelectionOverlays()`
     显式清空 9 个 SelectGroup 子节点 + `selected/selecting/customSelectedRangeComponents` 索引
     （孤儿组件不在组件 Map，`deleteAllSelectBorder` 清不到，必须从绘制层 `removeAllChild` 清除）。
     已用 Playwright（chromium 真实浏览器事件）复现验证：正/反向拖选均单区域、无组件残留。

## 样式系统（Phase 1：填充 + 边框；Phase 4：字体 / 对齐 / 换行）

- **样式池（StylePool）**：样式定义全表集中存储、按内容去重（稳定序列化 key，
  与书写顺序无关；固定序 fill → border 四边 → font → align）。单元格只持
  `CellData.s: StyleId`——相同样式无论多少格共享一份定义，降低内存与序列化体积
  （N 格同一填充色 → 池中仅 1 份定义、每格只存 id）。
  池只增不减（undo 回放不回收定义），被引用的 id 永远可解析。
- **入口**：`Sheet.setCellStyle(range, partial)`（部分合并语义，见 `CellStylePatch`）/
  `setCellStyles(items)`（按格不同 partial，一次调用 = 一个 undo 单元，供工具用）/
  `clearCellStyle(range)`（删除 s 字段）/ `getCellStyle(addr)`（原始存储语义）。
  全部经 `SetCellStyleCommand`（`sheet.command.set-cell-style`）走命令系统，可 undo/redo。
- **部分合并语义**：顶层浅合并——只给 fill 保留既有 border/font/align，反之亦然；
  `fill` 字段存在即覆盖填充（`{}` = 清除填充保留其余）；`border` 字段存在即
  **边级合并**：边值为对象 → 与既有边合并（缺失字段保留既有边值，无既有边时
  用默认值补全：thin / 1px / #000000）；边值为 `null` → 删除该边（其余边保留）；
  未列出的边 → 保留（`border: {}` = 无边变化）。要表达「重定义整个边集合」
  （如无边框预设）需显式给出四边（含 `null`）。
  `font` / `align` 存在即**逐字段浅合并**（缺失字段保留既有值）；
  `font: {}` / `align: {}` = 清除该类全部字段；字段值为 `null` = 删除该字段
  （如 `{ font: { color: null } }` 只清颜色保留加粗）。
- **文本样式字段**：
  - `font`：`color`（`#RRGGBB`）、`bold` / `italic` / `underline` / `strikethrough`、
    `size`（pt，与 Excel 一致；渲染 ×4/3 → px）
  - `align`：`horizontal`（left/center/right）、`vertical`（top/middle/bottom；
    hucre/Excel 导出为 center）、`wrap`（自动换行）
- **边框预设邻居同步（Excel/univer 语义）**：`core/style/border-presets.ts` 的
  `buildBorderPresetItems(range, preset, edge, getStyle)` 把预设展开为逐格补丁——
  全边框 = 每格四边（共享边双写一致）；外边框 = 边缘格写对应边 + 选区外一圈邻居
  的对侧边写 `null`（一条共享边只一份权威数据）；下边框 = 底行 bottom + 下一行
  邻居 top 写 `null`；无边框 = 每格四边 `null` + 邻居对侧边 `null`（防残留边画到
  本格边界）。邻居 `null` 边只在邻居确有该边时生成。一次预设应用 = 一次
  `sheet.command.set-cell-style`（items 含邻居补丁）= 单 undo 单元，undo 自动还原邻居。
- **空样式 = 删除 s 字段**：不破坏「空单元格不占存储」原则——有值格保留值，
  纯样式格（只有 s）整体删除。样式只存锚点格（被覆盖格不占数据位）。
- **样式不随值丢失**：`SetCellValueCommand` / `SetCellFormulaCommand` / 公式重算
  派生补丁都保留 before.s（编辑值、写公式、重算不得丢格式）；清除值（null/''）
  删除整格（含样式）。
- **重算优化**：`Sheet.executeCommand` 的重算只从 v/t/f 变化的补丁取变更格，
  仅样式变化的命令（如 SetCellStyleCommand）不触发公式重算。
- **渲染（grid 层）**：列定义挂 `style` 函数回调，逐格动态求值——按 StyleId
  从样式池解析为 VTable 样式（`bgColor`、四边 `borderColor` / `borderLineWidth` /
  `borderLineDash`，数组顺序 [top, right, bottom, left]；线型 → dash：thin/medium/thick
  实线、dashed [4,2]、dotted [1,2]；`font.color` → `color`、`bold` → `fontWeight`、
  `italic` → `fontStyle`、`underline` / `strikethrough` → `underline` / `lineThrough`、
  `size` pt→px、`align.horizontal/vertical` → `textAlign` / `textBaseline`、
  `wrap` → `autoWrapText`）。合并格读锚点样式。
- **自动换行行高**：不用全局 `heightMode: 'autoHeight'`（与固定 28 + 稀疏 rowHeights
  冲突，且十万行级不可行）。grid 层按需估算：含 wrap 格的行按内容估算折行数
  （列宽 ÷ 字宽近似）× 行距，经 `Sheet.setRowHeight` 写入（稀疏、不进 undo，
  与拖拽行高同语义）。**构造期批量注入（性能关键）**：逐条 `table.setRowHeight`
  会触发 scenegraph 逐行 y 重排 + 渲染帧（O(可见格)，几十条即秒级，大文件导入
  实测 2-3s/表）——重建时模型 rowHeights + wrap 估算经构造选项 `rowHeightConfig`
  全行覆盖注入（`buildRowHeightConfig`，含列头行 key 0；该配置使 VTable
  `isAutoRowHeight` 生效 → 构造时 `computeRowsHeight` 在首屏构建前一次性消费、
  惰性写入 rowHeightsMap，零重排）。wrap 估算在构造前完成（列宽用
  `SHEET_DEFAULT_COL_WIDTH` 常量 = VTable 默认 80：列宽不持久化，重建后恒为
  默认值，与构造后 `getColWidth` 等价）。触发（动态路径，仍走
  `setRowHeight` + config 同步）：wrap 切换 / 单元格内容变更 / 列宽拖拽结束。
  **`setTableRowHeight` 必须同步 rowHeightConfig 数组内容**（`table.internalProps
  .rowHeightConfig`）：config 使 isAutoRowHeight 恒 true，滚动增量重算会按 config
  旧值回写 rowHeightsMap——不同步则动态行高（拖拽 / wrap 更新）滚动后跳回旧值。
  只升不降：已有更高自定义行高（导入 / 拖拽）不被估算压矮。
  **已知边界**：估算偏差（非精确测字）；合并格 wrap 按锚点文本 +
  单列宽估算，未按合并跨度加宽；关闭 wrap / 内容变短后不自动压回默认行高；
  rowHeightConfig 依赖 VTable `isAutoRowHeight` 含 config 检查（1.26.5 行为，
  升级需复验）；视口外行高为滚动时惰性生效（滚动前 `getRowHeight` 仍默认值）。
  - **网格线回落（根因 A 修复）**：VTable 的 `style.borderColor ?? bodyStyle.borderColor`
    是整体替换而非逐边合并，未设置的边写 `null` 该边即不画（网格线丢失）——回调
    必须对未自定义的边显式给出主题网格线（`GRID_BORDER` / 1px / 实线，常量从
    `vtable-theme.ts` 导出共享）。
  - **共享边双向溯源**：`cellBorderClipDirection: 'bottom-right'` 下本格左/上边与
    左/上邻居的对侧边画在同一像素（全量重绘时由左上格的右/下边承载；局部重绘
    时覆盖次序不作保证，但写入同步/双写已保证共享边数据唯一或同色，次序无关
    结果），故每边取值 = 本格自定义边 ?? 邻居对侧边 ?? 网格线（选区左/上缘的
    自定义边经左/上邻居的右/下边像素渲染）；渲染层只做忠实呈现，不做样式仲裁。
    facing 读取**跳过本格合并跨度**（右/下邻居落在合并区内会解析回本格锚点，
    导致外缘镜像左/上边框色）；与本格同锚点的 facing 视为无。
  - **重绘联动**：函数式 style 每次求值、VTable 不做样式缓存（`isFunction(style)`
    短路），但邻居格的场景节点不会自动重建——`cell-change` → `updateCellContent`
    重建本格及四侧消费方（同样跳过合并跨度、目标解析锚点）。
  模型不感知视图：样式回调读样式池与 store，undo/redo/tab 切换自动一致。
- **内置工具**（`tools/builtin.ts`，全面图标化，见下方「内置工具清单」）：
  cell 组填充/边框弹层；text 组 B/I/U/S、对齐×6、换行 toggle、字体颜色/字号弹层。
  填充/边框/字体色/字号面板打开期间写入经事务包裹为一个 undo 单元，关闭时提交。
- 预留扩展位（本期不实现）：`fontFamily`（字体族）、`numFmt`（数字格式）、
  缩小字体填充、文字旋转、上下标。

## 导入导出（Phase 5：XLSX / CSV，基于 hucre）

- **依赖**：`hucre`（零依赖纯 TS，dependencies；`hucre/xlsx`、`hucre/csv` 子路径按需导入，
  类型经 `hucre` 主入口 `import type`（编译期擦除，无运行时开销）；vite pack `neverBundle`
  保持外部化。hucre 未声明 sideEffects，子路径导入下 bundle 只含 xlsx/csv 及依赖模块）。
- **API**（`core/io`，纯 TS 可无头测试）：
  - `exportWorkbookXlsx(workbook): Promise<Uint8Array>`：多 sheet；`v/t` → 单元格值
    （`t='e'` 错误格、`t='d'` 日期序列 + `yyyy-mm-dd` numFmt）；`f` → formula（不带 '='，
    缓存 `v` → formulaResult）；合并 → `MergeRange`（0-based 闭区间）；样式池 →
    hucre CellStyle（fill=solid pattern + fgColor 去 '#'；四边 border { style, color }，
    无宽度字段丢弃）；冻结 → `freezePane { rows, columns }`；行高 px → points（×0.75）；
    `activeSheet` → hucre `activeTab`（打开时定位活动表）。
  - `exportSheetCsv(sheet): string`：活动表 A1..最后一个有值格（裁剪高水位空行空列），
    公式格导计算缓存值（getCellData 原始存储语义），合并覆盖格为空（同 Excel），UTF-8 BOM。
  - `importXlsx(buffer): Promise<Workbook>`：`readXlsx(buf, { readStyles: true })` → 新工作簿
    （sheet 名冲突唯一化；活动表对齐）。每个 sheet：清空 + 批量 `setCells`（值/公式/样式
    一次命令 = 单 undo 单元 + 单次重算编排）→ 合并 → `setFrozen` → 行高（pt → px ×4/3 取整）。
    **导入性能铁律**（实测预算套表：196 sheet / 75 万格 / 某表 13328 行 × 16384 列）：
    - **空槽快速跳过**：hucre 的 `rows` 是稠密数组（行数组长度 = 该行最大列 + 1，Excel 极限
      16384），迭代必须先 `value == null` 跳过再做 `covered.has` / `cells.get` / 样式转换
      ——否则 2.18 亿空槽迭代 = 110s 卡死（跳过 = 3.5s）。
    - **补漏遍历**：`cells` Map 是稀疏的，但只含「有详情」格（样式/公式）；纯值格只在
      `rows` 里 → 主循环（有值格）+ 补漏（cells 中值 null 的格）双遍历，缺一丢数据。
    - **尺寸收敛**：表格尺寸按「有值格 ∪ 公式格 ∪ 合并 ∪ 行高定义」+ **扩展带 100 行/列**
      内的样式格计算，**不用** hucre 稠密行数组几何——「全选设边框」残留（整表 13327 行 ×
      16384 列 16~20 万空白格式格）会把 `rowCount/colCount` 高水位撑到 Excel 极限 →
      VTable 构造 16384 列实测 15~30s（切表卡死）。带外样式格丢弃（渲染区外不可见）。
      收敛后 `copySheetContent` 的 `ensureTableSize(max(rows, rowCount))` 自然取收敛值。
  - `importCsv(text, sheet)`：`parseCsv(text, { typeInference: true })` → 从 A1 覆盖写入既有
    活动表（事务；空格不覆盖既有格、空串清除、Date → 1900 序列 t='d'）。
  - `replaceWorkbook(target, source)`：导入 UI 的「替换当前工作簿」——结构变更（删表/加表）
    不走 undo（Phase 3 门面边界），每个 sheet 数据写入 = 单 undo 单元；
    `copySheetContent(target, source)`：样式按内容重新 intern 到目标池；选区对齐源表
    （importXlsx 源表默认 A1 → UI 导入后活动表为 A1，不残留目标旧选区；选区不进 undo）。
- **映射细节**：
  - 日期：模型存 1900 系统序列数（`t='d'`）；导出 = 数字 + 日期 numFmt，hucre 读回 Date
    （UTC），导入端 `dateToSerial1900` 转回序列（含 Lotus 伪闰日修正；serial 60 边界 ±1 天
    误差与 Excel 一致，round-trip 用远离边界的日期验证）。
  - 样式导入：fill 只取 solid/条纹 pattern 的 fgColor 与渐变首色（none/gray125 忽略）；
    border 线型 12 种收敛到模型 5 种（`HUCRE_BORDER_STYLE_MAP`），颜色缺省黑，theme 色经
    `wb.themeColors` 调色板解析；**font**（color/bold/italic/underline 非 false /
    strikethrough/size；name 等忽略）、**alignment**（left/center/right；vertical
    center↔middle；wrapText↔wrap；其余水平/垂直值不设）；样式一律经 `StylePool.intern`
    内容去重（同样式只 intern 一次）。导出反向映射（font.size pt 直存）。
  - 合并区域内的非锚点格（模型不支持覆盖格数据）导入时跳过不写。
  - 公式导入后缓存值由本地引擎重算（Excel 不支持的函数 → #ERROR!，与模型求值语义一致）。
- **UI 入口**（`tools/builtin.ts`，file 组）：**导入**（`popup: 'import'`，`UFilePicker`
  accept .xlsx/.csv：csv 写活动表，xlsx 经 `messageConfirm.danger` 后 `replaceWorkbook`）/
  **导出**（单按钮 `popup: 'export'` → 面板选 Excel(.xlsx) / CSV(.csv)，
  `tools/download.ts` 的 `downloadBlob` + `exportWorkbookFile` / `exportSheetCsvFile`；
  面板不参与事务）。`SheetContext.workbook` 只读引用供工作簿级导出；
  `createSheetContext(sheet, workbook?)` 第二参传入工作簿（无头/单 sheet 可省略，导出空操作）。
- **导入确认交互**（`popups/import-popup.vue` onClosed）：弹窗关闭动画（0.25s）
  **完成后**才执行 `replaceWorkbook`——前提是 message-confirm 根元素带基础
  `transition`（desktop 侧修复：Vue transition-group 的 hasTransition 在加
  leave-active 类前检查元素当前样式，根元素无 transition → after-leave 同步
  触发 → onClosed 阻塞弹窗关闭，实测点击后卡 1.6s 才关）。执行前先
  `message({ message: '正在导入…', duration: 0 })`（常驻反馈，阻塞期可见），
  `try/catch/finally` 兜底：成功 `message.success`，失败 `message.error`（
  replaceWorkbook 失败会留半替换状态，无法回滚——至少明确报错不误报成功），
  `finally` 关 loading。**replaceWorkbook 后等 2 帧再 success**（vrender 重建后
  首次渲染是同步阻塞任务，rAF 被其阻塞——等 2 帧后渲染必完成，用户看到
  「导入完成」后立即交互不再撞渲染任务，实测 5s → 16ms）。
- **xlsx 解析在 Web Worker**（`popups/import.worker.ts`）：importXlsx 是同步重活
  （hucre 解析 + 模型构建，196 sheet / 75 万格实测 3~5s），主线程直接跑会冻结
  UI（选文件后 3~4s 无反馈才弹确认框）。worker 返回纯数据快照（结构化克隆），
  主线程 `restore` 重建 Workbook（无 undo 历史——替换语义由 replaceWorkbook
  负责）；worker 不可用（构造抛错/onerror）降级主线程解析。解析期反馈：选文件后
  import-popup 经 **provide/inject 写入解析中状态**（`vue/parsing.ts` 的
  `SHEET_PARSING_KEY`），sheet.vue 在 grid 容器挂 **desktop 的 `v-loading`
  指令**（`v-loading="parsing"`，加载动画正常转）。**用 provide/inject 而非
  emit**：选文件后面板关闭（v-if 卸载 import-popup），卸载组件的 emit 无法送达
  父组件（实测 parsing 收不到）；inject 拿到的是父作用域 ref 对象，卸载后修改
  `ref.value` 仍驱动父组件响应式更新。**实现注意**：① worker 内用运行时动态
  `import()`（顶层静态
  import 在 vite dev 的 worker 上下文会 `Workbook is not defined`）；② 用
  `new Worker(new URL('./import.worker.ts', import.meta.url))` 而非 `?worker`
  虚拟导入（vp pack/rolldown 报 UNLOADABLE_DEPENDENCY）；③ URL 按
  `import.meta.env?.DEV` 区分 .ts/.js，且 worker 必须显式列入 pack entry
  （unbundle 模式只编译 entry 可达模块）才会进 dist。
- **已知边界**：模型专有错误码 `#ERROR!`/`#CYCLE!` 不在 Excel 错误集内，导出为普通字符串
  （类型丢失）；Excel 共享公式（拖拽填充产生）非主格读回 `formula=''`，导入为静态缓存值
  （公式语义丢失）；导入按表序处理，反向跨表引用遇空表时缓存 `#REF!`（任一后续写入触发
  重算即自愈）；CSV 日期导出为 1900 序列数字。
  **OOXML `<selection>` 元数据（hucre ^0.6.2）**：读侧 sheetView 不解析
  `activeCell`/`sqref`，写侧 `SheetView` 类型无 selection 字段——导入 xlsx **一律默认 A1**
  （无法恢复文件中的选中格）；导出仅写 `activeTab`（活动表索引）。未来 hucre 支持或
  自行补丁 XML 时再开选区互操作。

## 公式引擎

- **入口**：`Sheet.setCellFormula(addr, '=SUM(A1:B2)')`（`'='` 前缀可省；空白公式 = 清除单元格）；
  `setCellValue` 识别 `'='` 前缀自动走公式路径（grid 编辑回写由此获得公式能力）。
  `setCell` 写带 `f` 的 CellData 同样触发重算。
- **存储**：`f` 存公式原文（不含 `=`），`v / t` 存计算缓存；解析失败 → `v='#ERROR!', t='e'`（f 保留）。
- **重算编排**：`Sheet.executeCommand` 执行命令后从 mutation 提取变更格 →
  `DependencyGraph.recalc` 标脏（向上 BFS）+ 拓扑序重算（递归向下，memo）→
  派生补丁立即应用并作为附加 mutation **并入同一 undo 单元**。
  undo/redo 纯补丁回放（不重算），依赖图状态由 `applyPatch → syncCell` 双向维持。
- **跨表**：`DependencyGraph` 是工作簿级单例（`new Sheet()` 自建、`Workbook` 注入共享）；
  `CellPatch.sheet` 标记跨表派生补丁的目标 sheet，回放经源 sheet 历史按此路由。
  引用按表名解析，不存在 → `#REF!`。
- **循环检测是求值期动态检测**（在途栈回边 → 环上格 #CYCLE!）：`IF` 未选分支中的
  静态自引用不算环；打破循环（编辑/删除环上格）后标脏重算自动恢复。
- **引用语义 = 原始存储**（同 Excel）：被合并覆盖的格按空（0/''）；区域展开只迭代
  稀疏存在的格（`CellStore.entriesInRange`）。
- **聚合函数区分参数来源**（Excel 语义）：区域内的文本/布尔被 SUM/COUNT 等忽略，
  直接参数则强转（`SUM("abc")` → #VALUE!）；IF 为 lazy 函数（未选分支不求值）。
- 运算符集：`+ - * / ^`（右结合）、一元 `+ -`（紧于幂次：-2^2=4）、`%` 后缀、`&`、
  比较 `= <> < <= > >=`；优先级同 Excel。函数注册表可经 `registerFormulaFunction` 扩展；
  `listFormulaFunctions()` 枚举名称 + 可选 `meta`（params / 中文 description）供补全 UI。
- 合并与公式：合并按值保留规则搬迁 CellData（含公式原文，引用不随位置调整）；
  被覆盖格上的公式随清空从依赖图移除。

## 工具扩展机制（tools/）

- **注册表**：`ToolRegistry` + 全局 `defaultToolRegistry`（`registerTool` / `unregisterTool`）。
  工具定义 `{ id, title, icon?, tooltip?, group?, order?, visible?(ctx), disabled?(ctx), onClick(ctx) }`；
  分组渲染（组间分隔符）：组序 = 各组最早注册位置，组内按 `(order, 注册序)` 升序，缺省组 `'default'`。
  同 id 重复注册 = **替换并保留原注册位置**（HMR / 覆盖内置工具友好）；unregister 不存在的 id 返回 false。
- **SheetContext 是工具的唯一操作门面**（`createSheetContext(() => activeSheet)`）：选区读写、
  取值（getCellData / getDisplayValue / getCellInfo / getCellStyle）、命令执行（setCellValue /
  setCells / setCellStyle / clearCellStyle / mergeCells / executeCommand / 事务）、undo/redo、
  `selection-change` / `history-change` 订阅。
  不暴露 Sheet 实例，写方法全走命令系统——扩展天然可 undo，无法绕过命令系统。
  传入动态解析器时 tab 切换后同一上下文自动指向当前 sheet；事件订阅在调用时绑定当前 sheet，
  切换后需重新订阅（USheet 内部已处理）。
- **内置工具清单**（`tools/builtin.ts`，全部带 `@veltra/icons/normal` 图标；组序固定
  `history ｜ cell ｜ text ｜ edit ｜ file`，见 `use-tool-groups.ts` 的 `BUILTIN_GROUP_ORDER`）：

  | 组 | 工具 id | 说明 |
  | --- | --- | --- |
  | history | `undo` / `redo` | `disabled` 读 `canUndo/canRedo` |
  | cell | `border` / `fill-color` / `merge` / `unmerge` | 边框/填充弹层；合并禁用规则见上 |
  | text | `bold`/`italic`/`underline`/`strikethrough`/`font-color`/`font-size`/`align-*`/`valign-*`/`wrap-text` | toggle + 弹层；`active` 高亮 |
  | edit | `find` | 查找替换条（Ctrl/Cmd+F） |
  | file | `import` / `export` | 导入面板；导出单按钮 → xlsx/csv 选择面板 |

  已移除（入口在行列头/body 右键菜单）：structure（插入/删除行列）、freeze（冻结×4）、
  分立的 `export-xlsx`/`export-csv`。与第三方工具同通道，可 unregister 或同 id 覆盖。
- **注册时机**：`src/index.ts` 顶层 `import './tools/builtin'`（与 default-registry 同构；
  经包入口导入即注册，深导入 core 子路径的无头场景不涉及）。注册表全局共享——
  所有 USheet 实例渲染同一组工具，各自 SheetContext 绑定各自工作簿（多实例互不影响）。
  曾因放在 vue 层注册被 pack treeshake 丢弃，教训：副作用注册必须挂在包入口模块。
- `tools/` 不 import `vue` 运行时；`icon` 类型为 unknown（值为 `@veltra/icons` 组件，
  vue 层 `<component :is>` 渲染）。下载辅助在 `tools/download.ts`。

## USheet 组件（vue/）

- 结构：`sheet.vue` 为精简编排层（组合各可组合函数 + 拼装区块），区块拆分为
  `sheet-toolbar.vue`（图标按钮 + `UTip` tooltip，有 icon 时不显示文字；无 icon 回落文字；
  原生 `title` 兜底 disabled 悬停）+ `formula-bar.vue`（公式栏，可选）+ grid
  （SheetGrid，`use-sheet-grid.ts` 管生命周期）+ `sheet-tabs.vue`（底部 tabs）+
  `popups/`（弹层型工具面板，v-if 挂载即全新状态）。
  编排逻辑按职责入可组合函数：`use-sheet-state.ts`（状态源 + 事件绑定）、
  `use-tool-popup.ts`（弹层开关 + 面板事务）、`use-tool-groups.ts`（工具栏视图模型 + 组序）、
  `use-sheet-grid.ts`（网格重建 + 右键菜单）、`use-find-replace.ts`（查找替换）；
  无状态辅助入 `popup-helpers.ts`。
- **工具栏单行溢出滚动**：`use-toolbar-scroll.ts`（对齐 `use-sheet-tabs-bar` 交互模式）——
  工具内容超出视口时显示左右箭头（`ArrowLeft`/`ArrowRight`），点击按视口宽 80% 步进滚动、
  纵向滚轮转横滚；**不再 `flex-wrap` 换行**（换行会挤压 grid 高度）。结构三层：
  `.toolbar`（外层 flex）> `.toolbar-scroll`（`flex:1; overflow-x:auto`，隐藏滚动条）+
  箭头 > `.toolbar-list`（`inline-flex` 内容自适应宽度）。判定基于容器宽度
  （ResizeObserver + scroll 事件 + 内容源 watch），与视口无关——playground 页面非窄屏
  响应式，e2e 用「强制 `.sheet-demo__sheet` 宽度 320px」触发溢出
  （`scripts/phase7-toolbar-overflow-e2e.mjs`，12 项断言：箭头显隐 / 单行高度 / 步进 /
  滚轮 / 滚到底最右工具可见）。
- Props：`workbook?`（缺省内部自建单 sheet 工作簿）、`rows?`(100)、`cols?`(26)、
  `showToolbar?`(true)、`showFormulaBar?`(true)、`showTabs?`(true)；Emits：`active-sheet-change`；
  Exposed（`SheetExposed`）：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`。
- **弹层打开时序（真实浏览器必读）**：`openPopup` 的调用**必须经 `setTimeout(0)` 宏任务延迟**，
  不能用 `queueMicrotask`——真实浏览器中每个事件监听器执行完都会触发 microtask checkpoint，
  `queueMicrotask(openPopup)` 会在**同一 click 事件冒泡到 window 之前**执行：面板刚渲染，
  冒泡到 window 的 `onWindowClick` 就把它关闭（面板闪开即关，表现为「点击弹层工具没反应」）。
  工具栏按钮与 Ctrl+F（`onGlobalKeydown`）入口统一用
  `setTimeout(() => openPopup(tool), 0)`（均在 `use-tool-popup.ts`）。happy-dom 的 microtask
  时序与真实浏览器不同（dispatchEvent 同步返回后才执行 microtask），组件测试测不出此问题，
  改动弹层打开方式后必须用 Playwright 真实浏览器验证（断言 popup 打开后稳定存在，而非只跑组件测试）。
- **弹层定位（UDropdown 锚点跟随，2026-08）**：弹层型工具面板 = `UDropdown`（`trigger: 'custom'`，
  从 `@veltra/desktop` **主入口**导入），**Teleport 到 `#pop-container`**（body 级，彻底绕开
  `.u-sheet` overflow 裁剪——不再挂在 `toolbar-wrap` 下手写 absolute 定位）。定位由
  floating-ui（`usePop`：`offset(6)` + `flip()` + `shift()`）承担：面板左缘对齐触发按钮
  （`alignment: 'start'`）、自动翻转、边界移位。
  - **锚点传递**：`handleToolClick` 同步读 `event.currentTarget` → `popupAnchor`（use-tool-popup）→
    sheet.vue `watch(popupTool)` 里 `dropdown.open({ trigger: popupAnchor.value })`。
  - **⚠️ open() 必须同步调用（时序坑）**：不能 `await nextTick` 后再 open——`usePop` 在
    content 挂载时执行**首次定位 + 滚动监听绑定**（`addScrollEvents`），若 `customTriggerRef`
    晚于 content 挂载才设置，首次 `update` 时 trigger 缺失 → 面板停在 (0,0) 且滚动监听未绑定
    （表现为「面板出现但不在按钮下方、滚工具栏不关闭」）。watch 回调内直接同步调 `open()`。
  - **滚动自动关闭**：工具栏滚动 / 窗口 resize → `usePop.onTriggerPositionChange` →
    UDropdown 自动 `close()` → `update:visible(false)` → `closePopup()` 提交面板事务。
    依赖 `@veltra/utils` 的 `getScrollParents` **横向可滚动父级也计入**
    （`scrollWidth > clientWidth`）——`.toolbar-scroll` 是横向滚动容器，否则横滚不触发关闭。
  - **测试注意**：面板 Teleport 后不在 mount 容器内，组件测试断言需 `#pop-container` 前缀；
    视觉/交互验证用 Playwright（`scripts/phase8-popup-anchor-e2e.mjs`，9 项断言：
    左缘对齐 / offset 6px / 位置跟随 / 窄容器 flip-shift / 滚动关闭 / 点外关闭 / toggle）。
- 工具栏状态刷新：`use-sheet-state.ts` 订阅注册表 change / workbook（active-sheet-change、
  sheets-change）/ 活动 sheet（selection/history/cell/merge-change）→ bump 版本号 →
  `use-tool-groups.ts` 的 computed 重算 `visible`/`disabled`。tab 切换走 **LRU 实例缓存**
  （见下方「SheetGrid 实例缓存」）+ 重绑 sheet 事件。
- **SheetGrid 实例缓存（LRU，性能关键）**：`use-sheet-grid.ts` 维护
  `Map<Sheet, { grid, el, lastUsed, rows, cols }>`（容量 3），每个实例独立容器 div
  （`.u-sheet__grid-instance`，absolute 堆叠于 `.u-sheet__grid` 内），非激活容器
  `visibility:hidden`（保持尺寸、不触发 VTable resize，切回仅翻转可见性 + `syncFromModel`
  选区回驱/冻结校正 ≈ 10ms，大文件 30 sheet 来回切换不再重建）。实测：未命中重建
  ~300ms（行高优化后）/ 命中 ~10ms。
  - **失效路径**：`structure-change` / `props.rows·cols` 变化 / workbook 切换 / 导入替换 →
    `rebuildGrid`（`invalidateAll` 清缓存 + 重建激活）；删除 sheet → `sheets-change` →
    `pruneCache` 释放已删除实例（条件注意：存活或激活的保留，其余释放）；卸载 →
    `invalidateAll`。
  - **隐藏实例过期校验**：`createGrid` 时为实例自持 `structure-change` 订阅（vue 层
    只绑定激活 sheet 的 structure-change），隐藏期间**任何**程序化行列变更（插入/删除/
    undo，含净零尺寸变化）置 dirty 标记——`activateGrid` 命中缓存时 dirty 即释放重建，
    否则切回显示旧结构。删除激活 sheet 的联动：`active-sheet-change` handler 在
    `activateGrid` 后补一次 `pruneCache`（sheets-change 先派发时旧实例仍是 active 被
    保留，需切换完成后清理）。
  - 数据/样式/行高由实例常驻的 sheet 事件订阅持续同步（隐藏期间跨表重算不丢）；
    交互（键盘/pointerdown/右键）只绑定激活实例容器，隐藏容器不可聚焦无冲突。
  - 内存：每实例 = canvas + scenegraph（容量即上限）；sheet 列表变化及时 prune。
- **右键菜单**（`use-sheet-grid.ts` + `sheet-context-menu.ts`）：VTable `CONTEXTMENU_CELL`
  （`rightdown` 派发）→ `contextmenu.pop()`（从 `@veltra/desktop` 主入口导入，勿深导入
  `components/contextmenu`——dist 无 index.js）。`SheetGridContextMenuInfo` 带
  `kind: 'body' | 'row-header' | 'col-header'`（及 header 的 `row`/`col`）。
  - **body**：六项「合并 / 取消合并 / 插入行 / 插入列 / 删除行 / 删除列」；插入行/列改为
    菜单内嵌 `insert-count-menu-item.vue`（`UNumberInput` + 确认 / Enter；`keepOpen` +
    `render`，提交后 `inject(ContextmenuRootDIKey).onItemClickEnd()` 关闭），不再经
    `openToolPopup` 打开独立面板。落在选区外的 body 格先选中该格。
  - **行号**：在上方/下方插入 [N] 行（N 默认 = 选区覆盖行数，1..1000）/ 删除行 /
    冻结到当前行 / 取消冻结（无冻结时 disabled）；落点不在选区 → 先选中整行
    （列跨渲染宽度 `max(props.cols, sheet.cols)`）。
  - **列头**：左侧/右侧插入列 / 删除列 / 冻结到当前列 / 取消冻结（对称）。
  - 插入/删除相对**选区**首末行（列），非右键单行；冻结读 `ctx.frozen`，不进 undo。
  `eventOptions.preventDefaultContextMenu: true` 禁浏览器默认菜单。不暴露自定义 `menus` prop。
- **底部 sheet tabs 交互（Phase 3，`sheet-tabs.vue`）**：tab 点击切换（同前）；末尾「+」按钮 `addSheet` +
  `activateSheet` 自动激活新表；tab 右键（原生 `contextmenu`，与单元格右键互不干扰）弹出
  菜单「重命名 / 删除」——重命名进入行内输入（Enter 提交、Esc 取消、失焦提交；冲突
  `message.warn` 提示且不写入），删除走 `messageConfirm.danger` 二次确认，最后一个 sheet
  的删除项 disabled（`confirmRemoveSheet` 再兜底）。tab 键用 sheet 对象引用（改名不重建
  DOM、行内输入状态保留）；改名后经 `sheet-rename` 事件换新数组引用刷新 tab 文本。
  重命名输入框在 v-for 内渲染：`useTemplateRef` 收集为**数组**（Vue 3.5 v-for ref 语义），
  聚焦全选取 `renameInputRef.value?.[0]?.select()`。
- 组件高度由宿主控制（`.u-sheet` flex 列布局，grid 区 `flex:1; min-height:0`，宿主需给高度）。
- 样式：`vue/style.scss` 走 `pkg:@veltra/styles` token；**元素类用 `m.e(name)`（`&__x`），
  `m.bem(单参)` 是后代组件选择器（如 `.u-button .u-icon`）不是 BEM 元素**（用错会导致
  `.u-sheet__grid` 等规则缺失、grid 高度塌陷为 0）。
- 样式入口 `vue/style.ts`（宿主 `import '@veltra/sheet/vue/style'`，并副作用引入
  `@veltra/desktop/components/contextmenu/style`）；`sideEffects` 含
  `src/**/style.ts`、`src/**/*.scss`、`src/tools/builtin.ts` 及对应 dist 产物。

## 公式栏（Phase 4：名称框 + fx；Phase 6：补全 + 引用选择）

- **布局**：`vue/formula-bar.vue`，位于 toolbar 与 grid 之间；`showFormulaBar?` prop（默认 true）控制显隐。
  样式走 `pkg:@veltra/styles` token，元素类 `u-sheet__formula-bar / name-box / fx-editor / fx-input / fx-btn / fx-suggest*`。
- **名称框**（左）：显示当前选区（单格 = `A1`，区域 = `A1:B2`，复用 `core/address.ts` 序列化；
  点合并被覆盖格显示锚点地址）。输入合法地址/区域回车 → `selectCell`/`selectRange` 跳转
  （Phase 2 选区回驱自动滚动可见）；非法输入 `message.warn` 提示、不写入并还原显示；Esc 还原。
- **fx 输入栏**（右）：显示活动格内容——公式格 = `'=' + f` 原文（对齐 `FormulaAwareInputEditor`
  先例）、普通格 = 原始值文本、空格 = 空；无选区时禁用。聚焦进入编辑态：Enter / ✓ 提交
  （`ctx.setCellValue`，`'='` 前缀自动公式路径；提交写进入编辑时的活动格并保持当前选区，同 Excel）、
  Esc / ✗ 取消还原、失焦提交（✓/✗ / 候选列表 `mousedown.prevent` 拦截失焦竞态）；Shift+Enter 换行。
- **函数补全**（Phase 6）：`=` 开头且光标在函数名 token 上（或紧跟 `=` 的空前缀）时弹出候选
  （`listFormulaFunctions` 前缀过滤，上限 10；显示签名 + 中文说明）。↑↓ 导航，Tab / Enter / 点击
  确认为 `NAME(` 且光标入括号；Esc 先关候选再按才取消编辑。候选列表在 `fx-editor`
  （`position: relative`）内绝对定位，避免被 `.u-sheet` overflow 裁剪。镜像只读期不弹补全。
- **引用选择**（Phase 6）：光标前非空字符 ∈ `{=, (, ,, +, -, *, /, ^, &, <, >}` 时进入引用选择——
  画布点选插入 `A1`、拖选插入 `A1:B2`（不回写模型选区）。核心：grid `pointerdown` capture 挂起
  blur 提交 + `SheetGridOptions.interceptSelection` / `onSelectionIntercept`（编排层驱动，grid 不感知公式）。
  插入后 re-focus textarea，可连续框选（如 `=SUM(A1:B2)+C1`）。非引用选择场景失焦仍正常提交。
- **函数元数据**：`FormulaFunctionMeta { params, description }`；`listFormulaFunctions()` 枚举注册表
  （无 meta 时仅名称）。13 个内置函数均带中文说明。
- **双向同步与编辑态锁**：订阅活动 sheet 的 `selection-change` / `cell-change`——网格侧变化即时
  刷新名称框与输入栏；公式栏编辑期间忽略网格回写事件（编辑态锁，输入不被覆盖）；
  网格双击编辑提交后公式栏同步显示。
- **tab 切换适配**：`sheet` prop 变化 → watch 重绑订阅并刷新（USheet 已有重建/重绑模式）。
- **网格编辑镜像**：`SheetGridOptions.onEditStart` → 公式栏只读镜像；提交/取消后退出镜像。
  多行输入自动增高（textarea scrollHeight，CSS min-height 兜底）。
- **后续项（未做）**：网格内编辑器同等补全与框选；公式内引用 token 彩色高亮与画布选区联动；
  拖动调整已插入的引用区域；参数级高亮（当前第 N 个参数）；跨 sheet 引用辅助。

## 核心语义约定

- **坐标 0-based**：`{ row: 0, col: 0 }` 即 A1；`CellRange` 为闭区间且 start 恒为左上角。
- **空单元格不占存储**：`setCell` 空数据（无公式且 `v` 为 null/undefined/''）即删除；`rowCount/colCount` 只是渲染高水位，不分配空间。
- **合并**：锚点恒为区域左上角，数据只存锚点格。`merge(range)` 会解除相交旧合并并取**包围盒**；值保留规则（行主序第一个有值格落锚点，其余清空）编排于 `Sheet.mergeCells`，`MergeManager` 只管几何。
- **两种读取语义分开**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入与选中（`setCellValue` / `selectCell`）内部先 `resolveAnchor`，永远落锚点。
- `getCellInfo(addr)` 返回 `{ kind: 'normal' | 'merged-anchor' | 'merged-covered', anchor, mergeRange? }`，是「区分普通格/合并格」的 API 基础。

## VTable 适配层要点（1.26.5 spike 结论）

- **冻结可用**（无需降级）：`BaseTableConstructorOptions` 含 `frozenRowCount?` / `frozenColCount?`，
  ListTable 构造透传（`refreshRowColCount` 应用）；运行时 `table.frozenRowCount = n` / `table.frozenColCount = n`
  setter 即时生效（同步 internalProps + options + stateManager → scenegraph 重建冻结布局）。
  边界：`frozenColCount ≥ colCount` 归 0；冻结列总宽超 `maxFrozenWidth`（默认 '80%'）时压缩列数。
  坐标映射：非转置 ListTable 中**列头列与数据列共享同一表格列**（col 1 = 模型 A 列），
  模型冻结 N 行/列 = VTable frozen N+1（列头行 / 行号列各占 1）。
- **选区回驱 API**：`table.selectCells([CellRange])`（表格坐标闭区间）更新高亮；
  `table.scrollToCell({col,row})` 滚动可见且感知冻结偏移。两者均表格坐标（模型 +1,+1）。
  `selectCells` 会同步派发 `SELECTED_CELL`（`endSelectCells` fire），回驱需防递归标志。

- `customMergeCell` 函数式配置**逐格动态求值、无缓存**；闭包直读 `MergeManager`，合并变更后 `setRecords` 重建场景树即生效，无需 `updateOption`。
- **`CustomMerge` 必须携带 `text`，且 `text` 要读 VTable records（`table.getCellOriginValue(锚点坐标)`）而非模型**：
  - `BaseTable.getCellRange` 仅在 `text`/`customLayout`/`customRender` 有效时才返回自定义合并区域。缺了 `text` 会导致：合并格渲染为空；选区/编辑不扩展为整个合并区域（能点到被覆盖格）；编辑提交不写锚点。带上 `text` 后选区扩展、编辑器矩形、`doExit` 提交锚点（`changeCellValue(range.start, …)`）全部自动成立。
  - 编辑提交的顺序是：先更新 record → 重绘（重读 `customMerge.text`）→ 最后才发 `change_cell_value` 回写模型。若 `text` 闭包读模型，重绘拿到的是回写前的旧值——表现为「编辑后点击其它单元格，输入内容消失」（实际模型已提交，是渲染了旧文本）。读 records 则与 VTable 的更新次序天然一致（records 本就是模型的镜像：构造/setRecords/changeCellValue 三处同步）。
- 编辑器：每个 grid 实例注册自己的 `FormulaAwareInputEditor`（InputEditor 子类，hook 闭包
  本实例 sheet），`onStart` 把公式格的初始文本替换为公式原文（'=f'，同 Excel）；
  名称按 `veltra-sheet-input-N` 递增（register.editor 无注销 API）。
- **编辑提交回写（change_cell_value）**：提交期间模型变更（含公式重算派生格）先入
  `pendingTableSync` 队列，提交结束统一 `changeCellValue(…, false, false)` 回推——
  VTable 自己只把被编辑格的 record 改成输入文本，公式格必须回推计算值、派生格它不知道。
- 双击编辑走 vrender Gesture 的 `doubletap` 识别（非原生 dblclick），Playwright 合成的 dblclick 无法触发——浏览器自动化验证编辑链路时改用 `getCellRange` + `changeCellValue` 走同一提交路径，或 `startEditCell(col, row)` + `completeEditCell()` 程序化编辑（此时容器里有两个 input：VTable 内部键盘 input（`input-container`）与编辑器 input（`vtable`），取后者，可用 `editorManager.editingEditor.getInputElement()`）。
- Enter 键行为由 `keyboardOptions` 决定：`moveFocusCellOnEnter: true` 时 Enter 是下移选区而非进入编辑（VTable 内部分支优先级如此），自动化不要指望 Enter 打开编辑器。
- **编辑态方向键**：`moveEditCellOnArrowKeys: false`——双击进入编辑后方向键只移动输入框光标；
  未编辑时 VTable 自身的选区方向键导航不受影响。
- 键盘 undo/redo 绑定在 grid 容器的 keydown 上（Cmd/Ctrl+Z、Cmd/Ctrl+Shift+Z、Ctrl+Y）；事件来自编辑器 input/textarea 时不拦截（保留文本编辑自身的撤销）。点击单元格后焦点落在 `.vtable` 容器 div（tabindex=0），keydown 可冒泡到容器；编辑提交完成后焦点回 BODY，快捷键需重新点击网格聚焦。
- **拖选接入**：`DRAG_SELECT_END` → `table.getSelectedCellRanges()[0]`（表格坐标）→ 坐标换算 +
  `createRange` 规范化 → `sheet.selectRange`（合并等区域操作的前提；单格点击走 `SELECTED_CELL`）。
- **主题**：`grid/vtable-theme.ts` 必须用 `themes.DEFAULT.extends(...)`——裸对象主题不会
  继承 DEFAULT，缺省 `borderColor` 回落内部 `#000`（刺眼黑线）。body `#FFF`、行号/列头
  `#F5F5F5`、网格/外框 `#E1E4E8`（导出常量 `GRID_BORDER`，sheet-grid 网格线回落共用）、
  选区边框 `#2170E7`、`textOverflow: 'clip'`、`padding: [2, 6, 2, 6]`（覆盖 DEFAULT
  `[10, 16, 10, 16]`）；`cellBorderClipDirection: 'bottom-right'`——右/下边框 1px 描边收入
  本格格内（默认 `'top-left'` 落在右/下邻居第 1 像素内，被邻居后画的填充盖住，
  外边框右边/下边「不生效」的根因 B）。canvas 主题用固定色，不桥接 CSS 变量。
- **行列尺寸拖拽**：`resize.columnResizeMode: 'header'`（仅列头 A/B/C…）；行高不能用
  `rowResizeMode: 'header'`（VTable `isHeader` 不含行号列 body），故 `rowResizeMode: 'all'`
  - 包装 `_canResizeRow` 限制到 `isSeriesNumber`。`defaultRowHeight: 28`；`Sheet` 稀疏
    `rowHeights`（`getRowHeight` / `setRowHeight`，**不进 undo**）；`RESIZE_ROW_END` 同步，
    tab 重建时还原。
- **填充柄**：`excelOptions.fillHandle: true`；`MOUSEDOWN_FILL_HANDLE` 记源选区，
  `DRAG_FILL_HANDLE_END` → `core/fill.generateFill` → `sheet.setCells`（单 undo 单元）。
  规则：公式格字符串级位移（尊重 `$`）；数字/日期等差（单格步长 1）；否则 tile（空格覆盖清空）。
  双击填充柄本期不做。
- 事件用 `ListTable.EVENT_TYPE` 静态访问器（`core.EVENT_TYPE` 在 d.ts 是 `import type` 重导出，运行时为 undefined）。
- **坐标偏移**：`rowSeriesNumber` 行号列**不计入** `rowHeaderLevelCount`；偏移量在首个表格实例上用 `columnHeaderLevelCount` + `isSeriesNumber` 逐列探测并缓存（`getOffsets`）。
- 无头测试：happy-dom 不实现 canvas 2d，`src/grid/__test__/canvas-mock.ts` 用 Proxy mock 了 `getContext('2d')`（vp test setupFiles 注入）。

## 依赖

- **dependencies**：`@visactor/vtable`、`@visactor/vtable-editors`（同 desktop 先例，随包发布）、
  `hucre`（^0.6.2，XLSX/CSV 读写，零依赖纯 TS）
- **peer**：`@cat-kit/core`、`vue`、`@veltra/desktop`（右键 `contextmenu.pop` + 导入 `UFilePicker` /
  `UIcon` / 工具栏 `UTip`）、`@veltra/icons`（工具栏图标 + tabs 箭头）、`@veltra/utils`
  （bem / DeconstructValue）、`@veltra/styles`（SCSS token）
- **被依赖**：playground

## 大数据量（Phase 6：演示 + 性能基线）

- **演示页**：`playground/src/sheet-big-data/index.vue`（nav-config `sheet-big-data`）。
  规模 1 万 / 5 万 / 10 万行 × 12 列，mulberry32 seeded PRNG（同 seed 可复现）。
  指标面板：数据生成 / 批量写入 / 首次渲染 / 查找 / 导出耗时（`performance.now()`）+
  样式池大小 vs 单元格数与去重率。
- **写入路径（演示页实现）**：数据先写入模型（`sheet.setCells(items)` 一次调用 = 单 undo
  单元；作为初始化 `history.clear()` 不进 undo），**之后才挂载 USheet**——写入期间
  cell-change 无订阅者，耗时 = 纯模型路径（store + 命令系统 + 依赖图 syncCell），
  视图由 VTable 挂载时一次性构建 records 承担。「批量写入」与「首次渲染」分离计时。
  无公式数据下重算编排零开销（变更格无 v/t/f 变化以外补丁 → recalc 空转）。
- **样式池去重**：每格分配 20 色循环填充（`stylePool.intern` 先取 StyleId），
  池条目数恒为 20 ≪ 120 万单元格；导出时 xlsx 样式表仅 20 条定义。
- **hucre 流式导出评估（结论）**：`hucre/xlsx` 确实导出 `XlsxStreamWriter`
  （`addRow(CellValue[])` 逐行 + `finish(): Promise<Uint8Array>`，支持 columns /
  freezePane / maxRowsPerSheet 分 sheet 滚动）。**但它不支持单元格样式（fill/border）、
  公式、合并、行高**——只适合纯值超大数据导出；带样式/公式的模型导出仍走
  `exportWorkbookXlsx`（全量内存构造）。结论：本期不引入流式导出路径，需求明确时
  可新增 `core/io` 流式导出（纯值 + columns/freezePane），保持无头可测。
- **已知瓶颈（代码层确认，浏览器实测待补）**：
  - `setCells` 逐补丁 emit `cell-change` → grid 逐格 `changeCellValue` + `updateCellContent`
    ——**挂载后**批量写入 10 万行级会触发十万级视图同步调用（演示页以「先写后挂载」规避；
    若需挂载中批量写入，后续可给 SheetGrid 加「静默批量 + 结束时 setRecords 一次」开关）。
  - 10 万行 × 12 列单次 `setCells` 的 items 数组 + 历史补丁（before/after 差量）峰值内存
    数百 MB 级（写入后 `history.clear()` 释放）；生成器 + 写入为同步阻塞。
  - `exportWorkbookXlsx` 构造 `rows × cols` 稠密数组 + ZIP，120 万格内存峰值与耗时
    显著（流式备选见上）。
- **实测基线（2026-08 Playwright / chromium 真实浏览器，10 万行 × 12 列 = 120 万单元格，
  seeded 数据、批量写入后挂载）**：

  | 指标                          | 实测                     | 目标            |
  | ----------------------------- | ------------------------ | --------------- |
  | 数据生成                      | 226 ms                   | —               |
  | 批量写入（`setCells` 单事务） | **505 ms**               | <10s ✅         |
  | 首次渲染（挂载到首帧）        | 569 ms                   | 流畅 ✅         |
  | 查找（关键词命中）            | **440 ms**               | <2s ✅          |
  | 导出 xlsx                     | **5.9 s**（含 ZIP 构造） | 文件可打开 ✅   |
  | 样式池条目 / 去重率           | 20 条 / ×60,000          | 池条目数十级 ✅ |

  冻结首行在 120 万格下生效（`setFrozen(1,0)` → VTable `frozenRowCount=2`）。

## 行列插入/删除（Phase 7）

- **入口**：`Sheet.insertRows(at, count=1)` / `insertCols` / `deleteRows` / `deleteCols`；
  `SheetContext` 同签名暴露。工具栏**不再**提供 structure 组按钮——入口仅右键菜单：
  body「插入行/插入列」（内嵌 `insert-count-menu-item`，默认 N = 选区覆盖行/列数）/
  「删除行/删除列」；行号/列头菜单对称提供在上方/下方（左侧/右侧）插入与删除。
  一次插入 = 单 undo 单元。
- **结构变更 = 命令**（`InsertCellsCommand`，单 undo 单元）：redo = 结构操作 + 公式引用平移
  CellPatch；undo = 先恢复「仍在表内」公式 before → **反向结构操作** → 再恢复删除区间内
  单元格（`prepareDeletedCellPatches`，含普通值与公式格）。`StructurePatch` 携带
  `beforeRows/beforeCols` 精确还原表格尺寸（insert/delete 的尺寸计算不可逆）。
- **平移范围（Excel 语义）**：数据、合并区、稀疏行高、公式引用全部平移；**表格尺寸**
  `Sheet.rows/cols`（随快照持久化，0 = 未声明由视图 props 决定）同步增减。
  - **视图声明尺寸**：`Sheet.ensureTableSize(rows, cols)`（`@internal`，扩张语义 max 合并、
    不进 undo、不发事件）由 SheetGrid 构造时调用，把渲染 props 写入模型——否则 `_rows` 从 0
    起步、插入点小于 props 时 `max(props, sheet.rows)` 恒取 props，渲染窗口不增长
    （表现为插入行/列后数据平移但行/列数不变）。删除行后模型尺寸可低于 props，
    视图由 `max` 兜底保持 props 行数（Excel 语义）。
  - 插入：`start >= at` 整体平移；`start < at <= end` 区域**扩展**（合并与公式区域同）。
  - 删除 [at, at+count)：完全在区间内 → 移除；相交 → 按保留行/列**裁剪**（锚点被删时新锚点取区间起点，下方上移填补）；区间下方整体上移。
  - **公式引用**（`core/formula/shift.ts`，token 级保真）：引用被删 → 公式格转 `#REF!`
    （清 f + v/t=错误，可 undo 恢复）；`$1` 行绝对不随行平移、`$A` 列绝对不随列平移；
    跨表引用（共享公式图）同步平移，**其他 sheet 的公式格坐标不动、仅引用文本平移**。
- **Grid 联动**：`SheetGrid` 渲染尺寸 = `max(props, sheet.rows/cols)`；
  `structure-change` 事件（vue 层）→ 重建网格（数据/选区/冻结/行高随重建恢复）；
  选区回驱钳制越界坐标（行列删除后收敛）。
- **验证**：`core/__test__/row-col-shift.test.ts`（21，CellStore/MergeManager 平移与裁剪）、
  `formula-shift.test.ts`（20，引用平移含绝对/跨表/#REF!）、`structure-change.test.ts`
  （13，Sheet 端到端：undo/redo 往返、跨表、快照、尺寸还原）；Playwright 端到端 6 项
  （插入/删除/undo/右键菜单/表尾插入）。
## 已知限制

- **跨表交错撤销**：undo 历史按 sheet 分栈，跨表重算的派生补丁跟随源 sheet 的条目。
  若「改 Sheet2 → 再改 Sheet1 被联动的格 → 在 Sheet2 上 undo」，源 sheet 的 undo 会把
  Sheet1 的格还原到源条目记录的旧状态，Sheet1 自己的那条历史仍在栈中（继续 undo 可能
  短暂显示过期缓存，任意重算触发后自愈）。Excel 的单一工作簿撤销栈无此问题。
- 编辑提交回写的是输入文本；`Sheet.setCellValue` / `CellStore.setCellValue` 经
  `normalizeInputValue` 把数字文本 / TRUE·FALSE 规范化为 number/boolean（对齐 Excel
  键入语义，保证 `SUM(A1:C1)` 等区域聚合可计入）。前导 `'` 强制为文本；显式
  `setCell`/`setCells` 带 `t:'s'` 的路径不受影响。公式求值对直接参数仍按 Excel
  规则强转数字文本。
- **选区双向同步**：VTable → 模型（点击 `SELECTED_CELL` / 拖选 `DRAG_SELECT_END`）与
  模型 → VTable（`selection-change` → `selectCells` 高亮 + `scrollToCell` 滚动）双向打通；
  回驱期间 VTable 事件不回写模型（`syncingSelection` 防递归）。
- sheet tab 切换 = LRU 实例缓存命中（零重建，滚动位置/视口保留）或未命中时新建实例
  （模型选区 / 行高 / 冻结状态保留：模型选区经回驱恢复高亮，行高与冻结经构造还原）。
- 行高不进 undo；列宽未持久化到模型。
- **替换为整格覆盖语义**（非 Excel 子串替换）：命中格整格替换为替换文本；**公式格不参与替换**
  （写入 `{v,t}` 会覆盖公式原文 f，已由 `isReplaceable` 过滤）；替换文本空 = 清空该格。
- 查找条每次打开清空关键词；每击键实时查找（无防抖）；替换框 Enter 行为同「下一个」——
  均为体验简化，非数据正确性问题。
- 冻结列数 = 渲染列数（或行数）时 VTable 的 `frozenColCount`/`frozenRowCount` 归 0
  （VTable 原生行为：冻结区上限受 `maxFrozenWidth`/视口约束），极端场景表现为冻结失效。
- 字体族 / 数字格式 / 图表 / 协同编辑：本期不做，模型层预留扩展点。
  单元格样式已落地（Phase 1 填充+边框；Phase 4 字体/对齐/换行）；行列插入删除已落地（Phase 7）。
- **自动换行行高估算偏差**：字宽按字号 × 系数近似，非 canvas 精确测字；合并格 wrap
  未按合并跨度加宽列宽；估算只升不降——关闭 wrap / 内容变短后不自动压回默认行高
  （保留已写入的稀疏行高，含导入与拖拽）。
- **公式栏基础版边界**（Phase 6）：补全 / 引用选择仅 fx 输入栏（网格内编辑器无同等能力）；
  无引用彩色高亮联动、无拖动调整已插入引用、无参数级高亮、无跨 sheet 引用辅助；
  `-` 一元/二元歧义不区分（`A1-` 后框选 → `A1-B2`，合法且误判无害）。

## 验证

```bash
cd packages/sheet && vp test   # 单包测试（core 无头 + ListTable smoke + USheet 组件；vp test 无包过滤器）
vp run -F @veltra/sheet build  # 单包构建（= vp pack，产物含 d.ts）
bun run lint                   # 仓库根
```
