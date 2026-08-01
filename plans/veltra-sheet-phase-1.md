# 阶段 1：数据模型 + 单元格操作 + VTable 渲染接入（核心）

> 总览与设计决策见 [veltra-sheet-plan.md](./veltra-sheet-plan.md)。本阶段是后续一切的地基，重点保证单元格数据格式与合并语义的正确性。

## 任务清单

### 1.1 包脚手架

- [ ] 创建 `packages/sheet/`：`package.json`（`@visactor/vtable` 进 dependencies，同 desktop 先例；`@cat-kit/core`、`vue` 等进 peerDependencies）、`tsconfig.json`（extends `@cat-kit/tsconfig/tsconfig.web.json`）、`vite.config.ts`（`pack` 块 + `run.tasks.build`，仿 `packages/utils/vite.config.ts`）
- [ ] 编写 `packages/sheet/AGENTS.md`（包结构、API 约定、已知限制）
- [ ] 根 `AGENTS.md`：目录结构、包索引表、依赖关系图补 `@veltra/sheet`
- [ ] playground 注册演示页：`nav-config.ts` 加 `sheet` 条目，`playground/src/sheet/index.vue`

### 1.2 地址系统 `core/address.ts`（纯函数）

- [ ] `CellAddress { row, col }`（0-based）、`CellRange { start, end }` 类型定义
- [ ] A1 记法双向转换：`A1`↔`{0,0}`，列名 `A..Z,AA..` 与列号互转
- [ ] range 解析/格式化（`B2:D5` ↔ CellRange）
- [ ] range 运算：相交判断、包含判断、**包围盒（bounding box）**、遍历迭代器

### 1.3 稀疏存储 `core/cell-store.ts`

- [ ] `Map<number, Map<number, CellData>>`（row → col → data）实现
- [ ] `CellData` / `CellType` 类型定义（`v` / `t` / `f`，预留样式位，见总览决策 2）
- [ ] `getCell / setCell / deleteCell`，set 空值即删除（空单元格不占存储）
- [ ] `rowCount / colCount` 高水位维护（只用于渲染行数，不分配空间）
- [ ] `entries()` 迭代器（只遍历真实存在的格）、`snapshot() / restore()` 序列化

### 1.4 合并管理器 `core/merge-manager.ts`

- [ ] 数据结构：`merges: Map<anchorKey, CellRange>` + 覆盖索引 `coverIndex: Map<cellKey, anchorKey>`（O(1) 查询）
- [ ] `merge(range)`：解除相交旧合并 → 新区域 = 包围盒 → 值保留规则（仅包围盒左上方向第一个有值格的值落锚点，其余覆盖格清空）
- [ ] `unmerge(range)`：解除相交合并，仅原锚点保留值
- [ ] `resolveAnchor(addr)` / `isCovered(addr)` / `getMergeAt(addr)`
- [ ] `getCellInfo(addr)` 返回 `{ kind: 'normal' | 'merged-anchor' | 'merged-covered', anchor, mergeRange? }`

### 1.5 选区模型 `core/selection.ts`

- [ ] activeCell + ranges 数据结构
- [ ] `selectCell(addr)` 内部先 `resolveAnchor`（activeCell 永远指向锚点）
- [ ] 选区变更事件

### 1.6 Sheet / Workbook `core/sheet.ts`、`core/workbook.ts`

- [ ] `Sheet` = cell-store + merge-manager + selection 的组合，统一操作入口
- [ ] `getCellData`（原始存储语义）与 `getDisplayValue`（锚点解析语义）分离
- [ ] `Workbook` 管理多 sheet：增删、激活（公式跨表引用的载体，本阶段只要数据结构）
- [ ] 事件：`cell-change` / `selection-change`

### 1.7 VTable 适配层 `grid/sheet-grid.ts`

- [ ] **API 验证 spike（本任务先做）**：小原型确认 1.26.5 的 `customMergeCell` / 编辑器 / 键盘导航 / 事件在 ListTable 上组合行为符合预期；不符则用 `updateOption` 重建合并映射的备选方案
- [ ] 封装 `ListTable`：列头 `A,B,C…` 生成、行号列（`rowSeriesNumber`）、`widthMode: 'standard'`
- [ ] 模型 → VTable：records 由 store 行视图桥接；`customMergeCell` 从 MergeManager 映射
- [ ] VTable → 模型：`change_cell_value` 回写 store；`selected_cell` 经 `resolveAnchor` 更新选区
- [ ] 编辑接入：`@visactor/vtable-editors` 的 `InputEditor` + `editor` 配置、`editCellTrigger: 'doubleclick'`、键盘导航（`keyboardOptions`）

### 1.8 公开 API 与演示

- [ ] `Sheet` 暴露 `setCellValue / getCellInfo / mergeCells / unmergeCells / getSelection`
- [ ] playground 演示页：可输入、可选中、合并/取消合并按钮、实时显示当前选中格的 `getCellInfo` JSON（直接证明普通格/合并格区分正确）

## 验证清单

### 单测（`vp test`，core 全部无头覆盖）

- [ ] 地址：`A1`/`Z99`/`AA10` 双向转换正确；range 解析、相交、包含、包围盒（含跨区域合并的包围盒用例）
- [ ] 数据格式：数字/字符串/布尔/空的 `CellData` 写入读出类型判别正确
- [ ] 稀疏性：空值写入即删除；store 大小不随行列数增长
- [ ] 合并-基本：`merge(B2:C3)` 后 `getCellInfo(B2)` = `merged-anchor`；`getCellInfo(C3)` = `merged-covered` 且 anchor=B2；`getCellInfo(A1)` = `normal`
- [ ] 合并-值语义：合并前 B2、C3 各有值 → 合并后仅 B2 值保留；`getCellData(C3)` = undefined；`getDisplayValue(C3)` = B2 的值
- [ ] **合并-嵌套场景（用户点名）**：已有 `merge(B2:C3)`，再对 `C3:D4` 执行 merge → 旧合并解除，新合并 = 包围盒 `B2:D4`，锚点 = B2，数据按保留规则落 B2
- [ ] 合并-边界：单行合并、单列合并、与既有合并相邻但不重叠 → 互不影响；`unmerge` 后仅锚点留值
- [ ] 选区：`selectCell(C3)`（被覆盖）→ activeCell = B2
- [ ] 稀疏性能：10⁵ 行高水位 + 200 个真实单元格，断言 `entries()` 迭代数 = 200、序列化输出只含 200 格
- [ ] grid 适配层：happy-dom + ListTable smoke test（能挂载、能回写）

### 人工（playground，`cd playground && vp dev`）

- [ ] 点击普通格 / 合并格锚点 / 合并格内部，演示页 cellInfo 三者区分正确、合并地址恒为左上角
- [ ] 双击编辑、回车/方向键导航、合并与取消合并按钮行为正确

### 通用门槛

- [ ] `bun run lint` / `bun run test` / `bun run build` 全绿
