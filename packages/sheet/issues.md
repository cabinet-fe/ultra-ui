# @veltra/sheet 问题排查清单

> 排查范围：`packages/sheet/src` 全部源码（core / grid / vue / tools），逐文件阅读 + 全仓引用 grep + VTable 内部实现交叉验证。
> 排序原则：P0 = 正确性缺陷 / 内存泄露 / 严重性能；P1 = 算法复杂度与结构性问题；P2 = 死代码与清理项。
> AGENTS.md 已明确记录的「已知限制 / 已知瓶颈」原则上不重复列入；实际比文档更严重或文档未覆盖的加重事实会注明。

## 修复状态：全部 32 项已修复并验证（2026-08）

修复要点（详见各条目内注；验证：`bun run lint` 0 error、全仓 632 测试通过、全量 build 通过）：

- P0-1 编辑器全局注册泄露 → 单例 + hook 按发起编辑的 table 经 `WeakMap<ListTable, SheetGrid>`
  反查所属 grid（后取代 `editorTarget` 动态目标，修复多实例编辑串台；grid 不再持有编辑器注册）；
- P0-2 context 过期 workbook → `createSheetContext` 第二参支持解析函数；
- P0-3 / P0-4 / P0-5 / P0-12 / P0-25 → 微任务批量合并（merge-change 一次 refresh、
  cell-change 阈值内一次重建、隐藏实例只置脏、公式栏按活动格过滤 + autosize 合并、
  stateTick bump 合并）；
- P0-6 → Ctrl/Cmd+F 判定焦点在实例容器内；
- P1-7/8/9/10/11/13/18 → 稀疏迭代、批量标脏、缓存二分导航、按列找行、peek 只读访问器、
  MAX/MIN 循环、fill 复用 tokenizer；
- P2-14/28 → `@cat-kit/core`（debounce）与 `@cat-kit/fe`（saveBlob）实际复用，peer 增补；
- P2-31 → 包入口改为公开 API 白名单显式导出。

## P0 — 高优先级

- [x] **1. VTable 编辑器全局注册泄露：每次 grid 创建都永久泄露一份 SheetGrid + Sheet 模型**
  `grid/sheet-grid.ts:88-89, 297-323, 366-370`。`register.editor('veltra-sheet-input-' + editorSeq++)` 写入 VTable 模块级全局 `editors = {}`（已核实 `vtable/es/edit/editors.js` 与 `register.js`）：名称单调递增永不复用，且 VTable **只有 `clearAll()` 全清（连带 themes），没有单条注销 API**；`release()` 不触碰该注册表。编辑器 3 个 hook 闭包捕获 `this`（SheetGrid）→ 拖住 `sheet`（整个模型）与 `table.options`（含 records 镜像数组）。触发路径：LRU 未命中、structure-change 重建、导入替换、删除 sheet 后 pruneCache——重度会话累积几十~几百个实例；**被删除 sheet 的整个模型也被泄露闭包拖住无法 GC**。修复方向：编辑器改为「单例 + 动态目标」（全局注册一个，hook 读当前激活实例），或固定名字池覆盖注册让旧实例可被 GC。

- [x] **2. SheetContext 捕获过期 workbook：切换 `props.workbook` 后导出工具导出旧工作簿（正确性缺陷）**
  `vue/use-sheet-state.ts:48`。`workbook` 是 `computed(() => props.workbook ?? internalWorkbook)`（:37），但 `createSheetContext(() => activeSheet.value, workbook.value)` 的第二参在 setup 时取**值快照**；`watch(props.workbook)`（:123-135）只重绑事件与重建 grid，不重建 context → `ctx.workbook` 永久指向初始工作簿。`tools/download.ts` 的 `exportWorkbookFile` / `exportSheetCsvFile` 经 `ctx.workbook` 取数，宿主动态切换 workbook prop 后导出的是旧数据。修复方向：context 的 workbook 同样改为动态解析，或在 watch 中重建 context。

- [x] **3. `merge-change` → 全量 `refresh()` 风暴：每个合并补丁一次 O(rows) 全表重建**
  `grid/sheet-grid.ts:1030-1034`（每个 merge-change 都 `setRecords(buildRecords())`）+ `core/sheet.ts:655`（applyPatch 对**每个** merge 补丁 emit 一次）+ `core/io/import.ts:288-289`（`copySheetContent` 逐个 `mergeCells`）。两个放大场景：① **xlsx 导入**含 M 个合并的 sheet 写入活动表时活动 grid 恒在订阅 → M 次全量 scenegraph 重建（预算套表单表数百上千合并很常见，每次百 ms 级，总量可达数十秒），文档未记录此路径；② 单次 `MergeCellsCommand` 解除 K 个相交合并 → K+1 次全量重建。修复方向：Sheet 层按命令批量（命令结束发一次），或 grid 侧微任务/rAF 合并。

- [x] **4. `cell-change` 逐补丁同步实际代价比文档记录严重约一个数量级，且导入路径的同步成果被整体丢弃**
  `grid/sheet-grid.ts:1013-1027, 1063-1106, 733-762`。文档「已知瓶颈」只记了 changeCellValue + updateCellContent；实际每补丁 = 1 次 `changeCellValue` + 1~5 次 `updateCellContent`（含合并跨度放大）+ `syncWrapRowHeight` 的 **O(cols) 行扫描**（每次 `getStoredStyle` 含 store 拷贝 + 样式池深克隆）。10 万补丁 × 26 列 ≈ 260 万次样式解析 + 约 50 万次场景调用。两个文档未记录的加重事实：① `replaceWorkbook → copySheetContent` 写活动表时活动 grid 恒在（无法用演示页「先写后挂载」规避），且完成后 `syncFromWorkbook → rebuildGrid → invalidateAll` 把 grid 整体释放重建——**期间全部视图同步工作 100% 被丢弃**；② 删除非 0 号位的激活 sheet 时，`active-sheet-change` 会为相邻 sheet 先构造一次完整 grid（~300ms）随即被 invalidateAll 丢弃。修复方向：文档已预留的「静默批量 + 结束 setRecords 一次」开关，导入路径默认开启。

- [x] **5. 公式栏 `cell-change` 每补丁 `nextTick(autosizeFx)`：批量写入时同帧 N 次强制同步布局**
  `vue/formula-bar.vue:372-383, 183-196`。`handleCellChange` 不比对 `addr` 是否为活动格，每个补丁都 `refreshFx()` → `closeSuggest()`（`suggestItems.value = []` 新引用必触发响应式）+ `void nextTick(autosizeFx)`。已核实 Vue 3.5 `nextTick(fn)` 不去重，N 个补丁 = N 个微任务全部执行 `autosizeFx`（写 `height='0px'` 后读 `scrollHeight` = 强制同步 reflow）。填充柄、全部替换、导入、undo 大批量时 N 可达万级 → 秒级卡顿。修复方向：按活动格过滤 + 脏标记每帧合并一次。

- [x] **6. 全局 Ctrl/Cmd+F 监听劫持浏览器查找 + 多实例同时弹查找条**
  `vue/use-tool-popup.ts:94-104`。window 级 keydown 无条件 `event.preventDefault()`：① 焦点在页面任何位置（与 sheet 无关）都屏蔽浏览器原生查找；② 同页多个 USheet 实例各自挂同一全局监听，按一次 Ctrl+F **每个实例都弹出自己的查找条**——与 AGENTS.md「多实例互不影响」矛盾。修复方向：判定事件源/焦点是否在本实例容器内，或仅激活实例响应。

## P1 — 中优先级

- [x] **7. `CellStore.entriesInRange` 宽区域稠密列扫描：极端公式单次重算主线程冻结**
  `core/cell-store.ts:160-169`（调用方 `core/formula/dependency-graph.ts:285`）。对有数据的行按范围**逐列** `rowMap.get`：代价 = O(范围行数 + 有数据行 × 范围列数)。parser 允许 3 字母列（`CELL_REF_RE`），`=SUM(A1:XFD100000)` 合法 → 10⁵ 行 × 16384 列 ≈ 1.6×10⁹ 次查询，该节点每次重算秒级~十秒级冻结。修复：迭代 `rowMap` 自身键再按列范围过滤（行内稀疏键数 ≪ 范围列数时数量级优化）。

- [x] **8. 依赖图 ranged 反向索引批量放大：O(变更格数 × 区域引用数)**
  `core/formula/dependency-graph.ts:192-200, 217-220, 401-412`。`recalc(changed)` 对每个变更格全量线性扫描该表所有区域引用，BFS 标脏时每个 dirty 节点再各扫一遍。批量粘贴/填充 N 格 + 表内 R 个区域引用 → O(N×R)；N=10⁵、R=10³ → 10⁸ 次 `rangeContainsAddress`。文档记了「区域引用走线性扫描」的设计结论，但未记批量放大效应。

- [x] **9. `findNext`/`findPrev` 每次导航重跑 `findAll` 全表扫描，已有缓存被闲置**
  `core/find.ts:77-111` + `vue/use-find-replace.ts:76-94`。`useFindReplace` 已把全量命中缓存进 `findMatches`，但「下一个/上一个」调的 `findNext`/`findPrev` 各自重新执行 `findAll`（全 store 遍历 + 排序）——10 万行实测单次 ~440ms，即每次按 Enter 导航都卡约 0.4s。附带常数因子：`textMatches` 每格重复 `query.toLowerCase()`（find.ts:51-52，百万格 = 百万次重复分配）；`findAll` 丢弃 `entries()` 已产出的 data 再经 `getDisplayValue` 重读一遍（find.ts:61-62）。修复：在缓存数组上做下标移动/二分。

- [x] **10. `RESIZE_COLUMN_END` 处理器全表扫描（含逐格拷贝）找该列所在行**
  `grid/sheet-grid.ts:872-882`。每次列宽拖拽结束 = O(store 总格数) 迭代，且 `entries()` 每格 `{...data}` 防御性拷贝分配。百万格表拖一次列宽 = 100 万次分配，只为找该列有数据的行；列宽拖拽是连续高频操作。

- [x] **11. 渲染路径逐格短生命周期分配：每格样式解析 ≈ 5 次 store 拷贝 + 5 次样式池深克隆**
  `grid/sheet-grid.ts:543-593` + `core/cell-store.ts:111-114` + `core/style/style-pool.ts:155-159`。`resolveCellStyle` 每格执行 `getStoredStyle`（`store.getCell` 的 `{...data}` 拷贝 + `stylePool.get` 的 cloneStyle 深克隆）+ 最多 4 次 `getFacingEdge`（同样一套）；全屏约 800 可见格/帧，滚动持续触发（VTable 函数式 style 无缓存，该路径极热）。修复：为渲染层提供不拷贝的只读访问器（`store.peekCell` / `stylePool.peek`）。

- [x] **12. 隐藏 LRU 实例的常驻订阅无可见性闸门：隐藏期间批量变更照跑全套逐补丁视图同步**
  `grid/sheet-grid.ts:1011-1028` + `vue/use-sheet-grid.ts:176-182`。缓存的隐藏 grid（最多 2 个）保持 `cell-change` 常驻订阅（设计意图是隐藏期间跨表重算不丢），但该 sheet 发生大批量变更时（跨表重算波及、程序化写入、undo）对**不可见 canvas** 执行与 #4 相同的全套逐补丁同步。更省的策略：隐藏期只置 dirty 标记，`activateGrid` 命中时一次 `setRecords`。

- [x] **13. `MAX`/`MIN` 对超大区域 `Math.max(...numbers)` 展开爆栈，结果被静默兜成 `#ERROR!`**
  `core/formula/functions.ts:166, 176`。区域数字超过引擎实参上限（V8 约 6.5 万）→ RangeError → 被 dependency-graph 的 catch 兜成 `#ERROR!`：`=MAX(A1:A200000)` 必现，结果错误且用户无感知。修复：for 循环比较。

- [x] **14. `@cat-kit/core` 是死 peer 依赖：声明但全包零 import**
  `package.json:35` + `vite.config.ts:42`（neverBundle 列表）。grep 全包 src/test 无任何 `@cat-kit` import，宿主却被强制安装。处置：从 peerDependencies、neverBundle、AGENTS.md「依赖」一节移除；或实际复用（见 #28）。

- [x] **15. `vue/style.ts` 样式入口缺 6 个实际渲染的 desktop 组件样式**
  `vue/style.ts`（只引入 contextmenu/dropdown/number-input/palette/scroll/tip）。但 UI 实际渲染：`v-loading`（sheet.vue:60）、`message`/`messageConfirm`（import-popup.vue、sheet-tabs.vue、formula-bar.vue）、`UInput`（find-popup.vue:71）、`UFilePicker`（import-popup.vue:11）、`UIcon`（sheet-toolbar.vue:59、sheet-tabs.vue:55），对应样式入口均未引入。playground 因 main.ts 全局引入而被掩盖；仅依赖 `@veltra/sheet/vue/style` 的宿主会得到无样式组件。

- [x] **16. `import.ts:253` 死条件导致无效删除补丁**
  `core/io/import.ts:249-254`。第 249 行已 `if (value == null) continue`，第 253 行 `data === undefined && value == null` 中 `value == null` 恒为 false → 条件恒假、`continue` 从不触发，`hucreCellToData` 返回 undefined 的格被以 `{ addr, data: undefined }` 推入 items（无效删除补丁）。应改为 `if (data === undefined) continue`（与 :282 补漏循环一致）。

- [x] **17. 横向溢出滚动逻辑三处近逐字复制**
  `vue/use-sheet-tabs-bar.ts:32-75`、`vue/use-toolbar-scroll.ts:31-56` 与 `packages/desktop/src/components/tabs/use-tabs-bar.ts:36-83`：`updateNavState` / `scrollByStep` / `handleWheel` / `ensureActiveVisible` 四段逻辑逐行相同。正确解法是下沉到 compositions/utils 共享，而非跨包复制第三份。另：sheet 侧两个 composable 返回的 `updateNavState` / `ensureActiveVisible` 均无消费者，可从 return 收窄。

- [x] **18. `fill.ts` 自研引用位移与 `formula/shift.ts` 双套并行机制**
  `core/fill.ts:180-313`（约 130 行手写扫描器：`skipExcelString`/`matchSheetPrefix`/`matchCellOrRange`/`shiftOneRef`）vs `core/formula/shift.ts`（基于 `tokenizeFormula`）。两套「$ 感知 + 表名前缀 + 字符串字面量跳过」机械完全重复；fill 按 delta 平移、shift 按区间平移，底层引用匹配可统一走 tokenizer。若不合并，至少注释说明并存理由。

## P2 — 低优先级（清理项）

- [x] **19. 完全无引用的公开导出**：`addressFromKey`（`core/address.ts:33`）、`rangeSize`（`core/address.ts:164`）——全仓（含测试、playground）零调用，直接删除。

- [x] **20. 仅同文件使用却公开导出的实现细节**（取消 `export` 即可，零风险）：`COL_KEY_BASE`（address.ts:25）、`addressesEqual`（address.ts:105）、`cloneStyle` / `serializeStyleKey`（style-pool.ts:78,96）、`compareScalars`（evaluator.ts:91）、`DEFAULT_HISTORY_CAPACITY`（history.ts:15）。

- [x] **21. 死代码 4 处**：`TypedEventEmitter.clear()`（`core/events.ts:34`，五个持有方零调用）；`Sheet.off` / `Workbook.off`（sheet.ts:625、workbook.ts:129，所有订阅方都用 `on()` 返回的取消闭包）；`openToolPopup`（`vue/use-tool-popup.ts:78-81`，已核实仅定义 + return，右键菜单内嵌化改造残留；return 里的 `openPopup` 同样无消费者可一并收窄）；`tools/builtin.ts:31` 对 `./download` 三个函数的再导出（不可达——消费方 export-popup.vue、测试均直接深导入 `./download`）。

- [x] **22. 未使用样式 2 块**：`.u-sheet__insert-row` / `.u-sheet__insert-input`（`vue/style.scss:372-380`，insert 独立弹层改造为右键菜单内嵌项前的残留，模板/TS 零命中）。style.scss 其余 53 个类已逐一核对均有对应元素。

- [x] **23. `setTimeout(openPopup)` 在组件卸载后仍执行，事务悬挂**
  `vue/use-tool-popup.ts:68, 80, 103`（配合 :39 `beginTransaction` 与 :111-115 `onBeforeUnmount(closePopup)`）。点击工具后立刻卸载（路由切换）→ `closePopup` 空转（popupTool 仍为 null）→ timeout 回调照常 `openPopup` → 事务型面板 `beginTransaction` 后再无 commit/rollback。低概率边缘时序，修复：保存 timeout id 并在卸载时 clear。

- [x] **24. `SelectionModel.setState` 无相等性去重**（`core/selection.ts:83-86`）：重复点击同一格/同区域每次 emit → grid 全量选区回驱（clearSelectionOverlays + selectCells）+ 公式栏刷新 + stateTick bump。

- [x] **25. 选区/单元格变更直接 bump `stateTick` → 工具栏整树重渲染**
  `vue/use-sheet-state.ts:60-69` + `vue/use-tool-groups.ts:33-48`。方向键连续移动、批量写入逐补丁 `cell-change` 都会触发约 20 个按钮的 `visible/disabled/active` 重算与重渲染。Vue 调度器合并了同步爆发、且重渲染隔离在 toolbar 子树，实际开销有限，但机制上属「高频事件驱动模板重渲染」，可作后续优化点（如按工具粒度订阅）。

- [x] **26. DependencyGraph 反向索引外层 Map 按历史表名残留空壳**（`core/formula/dependency-graph.ts:374-386`）：exact 内层清空删 key，但外层 `Map<sheetName, ...>` 条目与 ranged 空 Set 不回收；按历史表名数量封顶，可忽略级。

- [x] **27. import worker `postMessage({ buffer })` 未走 transfer**（`vue/popups/import-popup.vue:101`）：大文件多一份 ArrayBuffer 拷贝。（worker 本身的 terminate 在成功/失败/降级三路径均已调用，已核实无泄漏。）

- [x] **28. 可换现成 API 的手写实现**：`downloadBlob` → `@cat-kit/fe` 的 `saveBlob`（`tools/download.ts:5-12`，peer 链上 desktop/compositions 已依赖该包）；导入成功后手写双 rAF → `@veltra/utils` 的 `nextFrame`（`vue/popups/import-popup.vue:146-151`，实现一致且 sheet 已依赖该包）；查找每击键实时全扫无防抖 → `@cat-kit/core` 的 `debounce`（`vue/use-find-replace.ts:137`，440ms/次全扫下连续击键明显卡顿；文档记为有意简化，若采纳则正好成为 @cat-kit/core 的正当用途）。

- [x] **29. `NUMERIC_TEXT_RE` 跨文件重复定义**：`core/cell-store.ts:35` 与 `core/formula/evaluator.ts:33` 同一正则两份拷贝（注释互相引用「对齐」），提取到一处导出复用。

- [x] **30. `InsertCellsCommand.id` 命名不一致**：`core/command/insert-delete-cells.ts:42` 为 `'insert-cells'`，其余内置命令均为 `sheet.command.*` 命名空间；当前仅 Sheet 内部按常量引用，统一改名安全。

- [x] **31. 约 24 个「仅测试引用」的公开导出**：`rangeContainsRange`、`mergeCellStyle`、`shiftFormulaRefs`、`styleToHucre`、`rangeToHucre`、`hucreStyleToModel`、`dateToSerial1900`、`copySheetContent`、`fontSizePtToPx`、`cellStyleToVTableStyle`、`estimateWrapRowHeight`、`getFormulaFunction`、`normalizeStyle`、`DEFAULT_TOOL_GROUP`、`ToolRegistry`（类）、`CommandRegistry`（类）、`CellStore.setCellValue`、`Sheet.setCell`、`Sheet.setCellStyles`、`MergeManager.merge` / `isMerged` / `isCovered`、`SelectionModel.clear`、`DependencyGraph.getSheet`、`HistoryManager.inTransaction` 等——实质内部符号经包入口公开导出；测试本就深导入，从 `src/index.ts` 聚合导出剔除不影响测试。注意：AGENTS.md 把 `Sheet.setCell` / `setCellStyles` / `CellStore.setCellValue` 文档化为公开写 API，与「生产零调用」的实际不符，需同步文档或补真实调用方。（`SheetGrid.getTable()` 注释已声明调试/测试用，属有意保留，不在此列。）

- [x] **32. wrap 行高估算的行扫描逻辑重复**：`grid/sheet-grid.ts:712-726`（`estimateWrapRowHeightForRow`）与 `:733-747`（`syncWrapRowHeight` 前半）是同一套「逐列扫 wrap 格取最大估算高」，仅列宽来源不同，可提取共享函数。

## 已排除的疑似点（查证后确认无问题）

- 事件订阅配对：除 #1 外，vue 层（window 监听、sheet/workbook 订阅）、grid 层（disposers + `table.release()`）、ResizeObserver/scroll/wheel、import worker terminate 均清理完整。
- `getOffsets` 缓存：列头/行号布局在实例生命周期内不变，无失效问题。
- `customMergeCell`：无合并时每格仅 2 次 Map 查询无分配，O(1)。
- import.ts 空槽快速跳过 / 补漏双遍历 / 尺寸收敛：代码与 AGENTS.md 描述一致。
- style-pool 只增不减、records 镜像双份、history 200 条 × 大补丁内存、LRU 3 实例 canvas：均已文档化，代码与文档一致，未见额外浪费。
- `core/events.ts` 自研 `TypedEventEmitter`：@cat-kit/core 公开 API 中无等价事件发射器（其 `Observable` 是属性订阅语义），不算造轮子。
- 1900 日期序列、A1 地址、公式引擎、填充柄等领域逻辑：cat-kit 无等价物，自研合理。
- 巨型组件：最大 SFC `formula-bar.vue` 443 行，低于阈值；useTemplateRef、v-for key、shallowRef 使用均符合规范。
