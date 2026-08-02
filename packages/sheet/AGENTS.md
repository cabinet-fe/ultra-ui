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
│   ├── merge-manager.ts  # 合并单元格（只管几何，不管数据）
│   ├── selection.ts      # 选区模型（activeCell 恒为锚点）
│   ├── sheet.ts          # Sheet = store + merge + selection + history，统一操作入口
│   ├── workbook.ts       # Workbook = 多 Sheet（共享公式依赖图）
│   ├── events.ts         # 包内轻量类型化事件发射器（内部基建）
│   ├── command/          # 命令系统（undo/redo）
│   │   ├── types.ts          # Command / Mutation / Patch（CellPatch | MergePatch，before/after 差量）
│   │   ├── registry.ts       # CommandRegistry（register / execute）
│   │   ├── history.ts        # HistoryManager（undo/redo 栈 + 事务 + 容量上限 200）
│   │   ├── set-cell-value.ts # SetCellValueCommand（批量，供粘贴/填充复用）
│   │   ├── set-cell-formula.ts # SetCellFormulaCommand（只写 f，缓存由重算派生补丁填充）
│   │   ├── merge-cells.ts    # MergeCellsCommand / UnmergeCellsCommand
│   │   └── default-registry.ts # 默认注册表（内置命令在此注册，全局共享）
│   └── formula/          # 公式引擎（纯 TS，可无头运行）
│       ├── errors.ts         # 错误值体系（#DIV/0! #VALUE! #NAME? #REF! #ERROR! #CYCLE!）
│       ├── ast.ts            # AST 节点 + collectReferences
│       ├── tokenizer.ts      # 分词器（FormulaParseError）
│       ├── parser.ts         # Pratt parser（优先级同 Excel）
│       ├── evaluator.ts      # AST 求值 + 强转规则（纯函数，读取经 FormulaEvalContext 注入）
│       ├── functions.ts      # 函数注册表（registerFormulaFunction 可扩展）+ 13 个基础函数
│       └── dependency-graph.ts # DependencyGraph（工作簿级：sheet 注册表 + 双向索引 + 增量重算）
├── grid/
│   ├── __test__/         # SheetGrid smoke + canvas mock（vp test setupFiles）
│   └── sheet-grid.ts     # VTable 适配层（ListTable 封装、编辑器接入、事件回写、键盘绑定、拖选接入）
├── tools/                # 工具扩展机制（不 import vue）
│   ├── __test__/         # registry / context / builtin 单测
│   ├── registry.ts       # ToolRegistry + defaultToolRegistry（registerTool / unregisterTool）
│   ├── context.ts        # SheetContext 门面（工具的唯一操作入口）+ createSheetContext
│   └── builtin.ts        # 内置工具（undo/redo/合并/取消合并），经包入口注册
├── vue/                  # USheet 组件（Vue 依赖只在这一层）
│   ├── __test__/         # 组件测试（happy-dom + canvas mock）
│   ├── sheet.vue         # toolbar（渲染注册工具）+ grid + 底部 sheet tabs
│   ├── index.ts          # 导出 USheet
│   ├── style.scss        # pkg:@veltra/styles token（m.e 元素、m.is 状态，不写硬编码颜色）
│   └── style.ts          # 样式入口（sideEffects）
└── types/                # 对外类型（<Name>Props 约定）
    └── sheet.ts          # SheetProps / SheetEmits / _SheetExposed / SheetExposed
```

## 命令系统（undo/redo）

- **一切写操作都是命令**：`Sheet.setCellValue / setCell / setCells / setCellFormula / mergeCells / unmergeCells`
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
  比较 `= <> < <= > >=`；优先级同 Excel。函数注册表可经 `registerFormulaFunction` 扩展。
- 合并与公式：合并按值保留规则搬迁 CellData（含公式原文，引用不随位置调整）；
  被覆盖格上的公式随清空从依赖图移除。

## 工具扩展机制（tools/）

- **注册表**：`ToolRegistry` + 全局 `defaultToolRegistry`（`registerTool` / `unregisterTool`）。
  工具定义 `{ id, title, icon?, tooltip?, group?, order?, visible?(ctx), disabled?(ctx), onClick(ctx) }`；
  分组渲染（组间分隔符）：组序 = 各组最早注册位置，组内按 `(order, 注册序)` 升序，缺省组 `'default'`。
  同 id 重复注册 = **替换并保留原注册位置**（HMR / 覆盖内置工具友好）；unregister 不存在的 id 返回 false。
- **SheetContext 是工具的唯一操作门面**（`createSheetContext(() => activeSheet)`）：选区读写、
  取值（getCellData / getDisplayValue / getCellInfo）、命令执行（setCellValue / setCells /
  mergeCells / executeCommand / 事务）、undo/redo、`selection-change` / `history-change` 订阅。
  不暴露 Sheet 实例，写方法全走命令系统——扩展天然可 undo，无法绕过命令系统。
  传入动态解析器时 tab 切换后同一上下文自动指向当前 sheet；事件订阅在调用时绑定当前 sheet，
  切换后需重新订阅（USheet 内部已处理）。
- **内置工具**（`tools/builtin.ts`）：undo/redo（`disabled` 读 `ctx.canUndo/canRedo`，随
  history-change 置灰）、合并（单格选区禁用；选区恰等于既有合并时禁用，避免空操作历史条目）、
  取消合并（活动格不在合并内禁用）。与第三方工具同通道，可 unregister 或同 id 覆盖。
- **注册时机**：`src/index.ts` 顶层 `import './tools/builtin'`（与 default-registry 同构；
  经包入口导入即注册，深导入 core 子路径的无头场景不涉及）。注册表全局共享——
  所有 USheet 实例渲染同一组工具，各自 SheetContext 绑定各自工作簿（多实例互不影响）。
  曾因放在 vue 层注册被 pack treeshake 丢弃，教训：副作用注册必须挂在包入口模块。
- `tools/` 不 import vue；`icon` 类型为 unknown（由 vue 层 `<component :is>` 渲染）。

## USheet 组件（vue/）

- 结构：toolbar（渲染 `defaultToolRegistry` 分组工具 + 分隔符）+ grid（SheetGrid）+ 底部 sheet tabs。
- Props：`workbook?`（缺省内部自建单 sheet 工作簿）、`rows?`(100)、`cols?`(26)、
  `showToolbar?`(true)、`showTabs?`(true)；Emits：`active-sheet-change`；
  Exposed（`SheetExposed`）：`workbook`、`getActiveSheet()`、`getContext()`、`getGrid()`。
- 工具栏状态刷新：订阅注册表 change / workbook（active-sheet-change、sheets-change）/
  活动 sheet（selection/history/cell/merge-change）→ bump 版本号 → computed 重算
  `visible`/`disabled`。tab 切换 = 重建 SheetGrid（旧实例 release）+ 重绑 sheet 事件。
- 组件高度由宿主控制（`.u-sheet` flex 列布局，grid 区 `flex:1; min-height:0`，宿主需给高度）。
- 样式：`vue/style.scss` 走 `pkg:@veltra/styles` token；**元素类用 `m.e(name)`（`&__x`），
  `m.bem(单参)` 是后代组件选择器（如 `.u-button .u-icon`）不是 BEM 元素**（用错会导致
  `.u-sheet__grid` 等规则缺失、grid 高度塌陷为 0）。
- 样式入口 `vue/style.ts`（宿主 `import '@veltra/sheet/vue/style'`）；`sideEffects` 含
  `src/**/style.ts`、`src/**/*.scss`、`src/tools/builtin.ts` 及对应 dist 产物。

## 核心语义约定

- **坐标 0-based**：`{ row: 0, col: 0 }` 即 A1；`CellRange` 为闭区间且 start 恒为左上角。
- **空单元格不占存储**：`setCell` 空数据（无公式且 `v` 为 null/undefined/''）即删除；`rowCount/colCount` 只是渲染高水位，不分配空间。
- **合并**：锚点恒为区域左上角，数据只存锚点格。`merge(range)` 会解除相交旧合并并取**包围盒**；值保留规则（行主序第一个有值格落锚点，其余清空）编排于 `Sheet.mergeCells`，`MergeManager` 只管几何。
- **两种读取语义分开**：`getCellData` = 原始存储（被覆盖格 → undefined）；`getDisplayValue` = 锚点解析。写入与选中（`setCellValue` / `selectCell`）内部先 `resolveAnchor`，永远落锚点。
- `getCellInfo(addr)` 返回 `{ kind: 'normal' | 'merged-anchor' | 'merged-covered', anchor, mergeRange? }`，是「区分普通格/合并格」的 API 基础。

## VTable 适配层要点（1.26.5 spike 结论）

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
- 键盘 undo/redo 绑定在 grid 容器的 keydown 上（Cmd/Ctrl+Z、Cmd/Ctrl+Shift+Z、Ctrl+Y）；事件来自编辑器 input/textarea 时不拦截（保留文本编辑自身的撤销）。点击单元格后焦点落在 `.vtable` 容器 div（tabindex=0），keydown 可冒泡到容器；编辑提交完成后焦点回 BODY，快捷键需重新点击网格聚焦。
- **拖选接入**：`DRAG_SELECT_END` → `table.getSelectedCellRanges()[0]`（表格坐标）→ 坐标换算 +
  `createRange` 规范化 → `sheet.selectRange`（合并等区域操作的前提；单格点击走 `SELECTED_CELL`）。
- 事件用 `ListTable.EVENT_TYPE` 静态访问器（`core.EVENT_TYPE` 在 d.ts 是 `import type` 重导出，运行时为 undefined）。
- **坐标偏移**：`rowSeriesNumber` 行号列**不计入** `rowHeaderLevelCount`；偏移量在首个表格实例上用 `columnHeaderLevelCount` + `isSeriesNumber` 逐列探测并缓存（`getOffsets`）。
- 无头测试：happy-dom 不实现 canvas 2d，`src/grid/__test__/canvas-mock.ts` 用 Proxy mock 了 `getContext('2d')`（vp test setupFiles 注入）。

## 依赖

- **dependencies**：`@visactor/vtable`、`@visactor/vtable-editors`（同 desktop 先例，随包发布）
- **peer**：`@cat-kit/core`、`vue`、`@veltra/utils`（bem / DeconstructValue）、`@veltra/styles`（SCSS token）
- **被依赖**：playground

## 已知限制

- **sheet 重命名**：name 是公开可变字段，依赖图注册表按名索引——改名后旧名引用缓存保持
  旧值、下次重算变 `#REF!`（引用不跟随改名）。
- **sheet 删除**：`removeSheet` 清理该表公式节点但不触发其它表重算——引用它的公式缓存
  保持旧值，直到任意变更触发重算后变 `#REF!`。
- **跨表交错撤销**：undo 历史按 sheet 分栈，跨表重算的派生补丁跟随源 sheet 的条目。
  若「改 Sheet2 → 再改 Sheet1 被联动的格 → 在 Sheet2 上 undo」，源 sheet 的 undo 会把
  Sheet1 的格还原到源条目记录的旧状态，Sheet1 自己的那条历史仍在栈中（继续 undo 可能
  短暂显示过期缓存，任意重算触发后自愈）。Excel 的单一工作簿撤销栈无此问题。
- 编辑提交回写的是输入文本（数字文本以字符串存储；公式求值按 Excel 规则强转）。
- **选区单向同步**：VTable → 模型（点击 `SELECTED_CELL` / 拖选 `DRAG_SELECT_END`）；
  模型 API（`selectCell` / `selectRange` / SheetContext）改选区不回驱 VTable 高亮。
- sheet tab 切换 = 重建 SheetGrid（release + new），VTable 侧的视觉选区/滚动位置不保留（模型选区保留）。
- 行列插入删除、单元格样式系统、图表、协同编辑：本期不做，模型层预留扩展点。

## 验证

```bash
cd packages/sheet && vp test   # 单包测试（core 无头 + ListTable smoke + USheet 组件；vp test 无包过滤器）
vp run -F @veltra/sheet build  # 单包构建（= vp pack，产物含 d.ts）
bun run lint                   # 仓库根
```
