# @veltra/sheet — 基于 VTable 的电子表格包：开发规划（总览）

> 阶段任务清单见各分文件：
> - [阶段 1：数据模型 + 单元格操作 + VTable 渲染接入](./veltra-sheet-phase-1.md)
> - [阶段 2：Undo/Redo 命令系统](./veltra-sheet-phase-2.md)
> - [阶段 3：公式引擎](./veltra-sheet-phase-3.md)
> - [阶段 4：工具扩展机制 + USheet 组件 + 收尾](./veltra-sheet-phase-4.md)

## 背景与目标

新增 `packages/sheet`（`@veltra/sheet`），底层渲染基于 `@visactor/vtable`（仓库已有 1.26.5 使用先例：`packages/desktop/src/components/file-viewer/previewers/sheet-previewer.vue` 的 `ListTable`），不使用官方 vtable-sheet 插件。

核心原则：**数据模型完全自持有，VTable 只做渲染与输入的"视图层"**。所有单元格操作（取值、合并、公式、undo）都作用在自己的模型上，VTable 通过适配层被动刷新——这是避开官方插件 bug 的根本方式，也是 undo/redo、公式能可控实现的前提。

功能范围（本期）：
1. 单元格读写、合并单元格（锚点 = 区域左上角）
2. 基础公式 + 跨 sheet 引用（不含图表）
3. 稀疏矩阵存储（低内存）
4. 工具扩展注册机制 + 工具栏
5. undo/redo（命令 + 逆操作补丁，业界主流方案）

明确不做（预留扩展点即可）：单元格样式系统（加粗/颜色/数字格式化）、图表、协同编辑、行列插入删除的结构化操作 API（内部模型支持，UI 后置）。

## 关键设计决策

### 1. 分层架构

```
@veltra/sheet
├── core/（框架无关纯 TS，可单测、可无头运行）
│   ├── address.ts        # A1 地址系统
│   ├── cell-store.ts     # 稀疏矩阵存储
│   ├── merge-manager.ts  # 合并单元格
│   ├── selection.ts      # 选区模型
│   ├── sheet.ts          # Sheet = store + merge + selection
│   ├── workbook.ts       # Workbook = 多 Sheet
│   ├── command/          # 命令系统 + HistoryManager（undo/redo）
│   └── formula/          # 公式引擎（tokenizer/parser/evaluator/依赖图）
├── grid/                 # VTable 适配层（渲染桥接、编辑器接入、事件回写）
├── tools/                # 工具注册表 + 内置工具
├── vue/                  # USheet 组件（toolbar + grid + sheet tabs）
└── types/                # 对外类型（遵循仓库 <Name>Props 约定）
```

Vue 包装放到最后（阶段 4），前三个阶段 core + grid 用 playground 演示页直接驱动验证。core 不 import vue，保证可单测、将来也可被非 Vue 宿主复用。

### 2. 单元格数据格式（参考 univer `ICellData`，裁剪版）

```ts
/** 单元格值类型 */
type CellType = 'n' | 's' | 'b' | 'str' | 'e' | 'd'
// n=数字 s=字符串 b=布尔 str=公式结果字符串 e=错误(#REF!等) d=日期(存序列数)

interface CellData {
  v?: string | number | boolean | null  // 原始值（公式格为计算缓存值）
  t?: CellType                          // 缺省按 v 推断
  f?: string                            // 公式文本（不含 '='），如 'SUM(A1:B2)+Sheet2!C3'
  // s?: StyleId                        // 预留：样式（本期不实现）
}
```

- 空单元格 = 存储中不存在该 key，而非存空对象（稀疏的第一原则）。
- `getCellData(addr)` 返回原始存储（被合并覆盖的非锚点格 → `undefined`）；`getDisplayValue(addr)` 先解析锚点再取值。两个语义分开，是"区分普通格/合并格"的 API 基础。

### 3. 稀疏矩阵

`Map<number, Map<number, CellData>>`（row → col → data）实现，不用字符串 key 拼接（省内存、避免序列化开销）：
- `get/set/delete(row, col)`，set 空值即删除
- 维护 `rowCount/colCount` 高水位（用于渲染行数，而非分配空间）
- 迭代器只遍历真实存在的单元格 —— 序列化、重算、复制粘贴的复杂度都是 O（实际单元格数）
- 验证：10⁵ 行 × 稀疏百格的场景，内存与耗时只与单元格数相关

### 4. 合并单元格语义（用户重点要求）

- 数据结构：`MergeManager` 持 `merges: Map<anchorKey, CellRange>` + 覆盖索引 `coverIndex: Map<cellKey, anchorKey>`（区域内每格 → 锚点，O(1) 查询）。
- **锚点恒为区域左上角**，数据只存在锚点格。
- `merge(range)` 规则（覆盖"合并已合并区域 + 普通格"场景）：
  1. 找出与 range 相交的所有既有合并 → 全部解除
  2. 新合并区域 = range 与这些既有合并的**包围盒（bounding box）**
  3. 数据保留规则同 Excel/univer：仅保留包围盒左上角方向上第一个有值的单元格的值，写入新锚点，其余被覆盖格清空
- `unmerge(range)`：解除相交合并，只有原锚点保留值。
- 点击合并区域任意格 → `resolveAnchor(addr)` → 选区定位到锚点格，`getCellInfo` 返回 `{ kind: 'merged-anchor' | 'merged-covered' | 'normal', anchor, mergeRange? }`。

### 5. Undo/Redo：命令 + 逆操作补丁（参考 univer CommandService、Lexical history）

排除整表快照（内存爆炸）与 OT/CRDT（无协同需求，过度设计）。采用业界单用户最佳实践：
- 一切模型变更都是 `Command`，Command 执行时产出 `Mutation[]`
- 每个 Mutation 携带 `{ redo: Patch[], undo: Patch[] }`——Patch 是受影响单元格的 before/after 差量（含合并记录差量），不是全量快照
- `HistoryManager`：undoStack / redoStack，**事务**（一次粘贴/一次公式重算波及多格 = 一个 undo 单元），栈容量上限（默认 200）
- 重算产生的派生值变更与源变更合并进同一事务

### 6. 公式引擎：自研轻量引擎

排除 HyperFormula（GPL-3.0 传染性，不能进组件库）；univer 引擎与其中央数据模型耦合过深无法单拆。自研范围可控：
- tokenizer → Pratt parser → AST → evaluator，约 800~1200 行
- 依赖图：公式格 → 引用格集合的正/反双向索引；变更时标脏 + 拓扑序增量重算；循环引用检测 → `#CYCLE!`
- 跨表引用 `Sheet2!A1`、带引号表名 `'My Sheet'!A1`、区域 `A1:B9`、跨表区域 `'S2'!A1:B2`
- 函数注册表（可扩展）：SUM AVERAGE MAX MIN COUNT COUNTA IF AND OR NOT ROUND ABS CONCATENATE 等基础集

### 7. 阶段顺序（4 步）

用户指定第 1 步为单元格操作；**undo/redo 提到第 2 步、公式第 3 步**：公式的一次重算波及多格，必须是原子撤销单元——先建命令系统，公式落地时天然获得 undo 能力，避免返工。工具扩展放最后（此时 SheetAPI 已完整，内置 undo/redo/合并按钮正好 dogfood 扩展机制）。

## 风险与备注

- **VTable API 验证 spike 前置**（阶段 1）：`customMergeCell`、编辑器、键盘导航在 ListTable 上的组合行为是最大不确定点，先小原型验证再展开。若 `customMergeCell` 不满足动态增删合并，备选方案是变更时 `updateOption` 重建（官方 vtable-sheet 即类似做法）。
- 合并区域内的样式、边框渲染细节（VTable 主题定制）留到样式系统阶段，本期以功能正确为先。
- sheet 重命名/删除对公式引用的联动列为已知限制，在包 `AGENTS.md` 记录。
- 每个阶段结束后按需 `vp changeset`；全部完成后跑 `bun run skill:gen`。
- 每个阶段的通用验收门槛：`bun run lint`、`bun run test`、`bun run build` 全绿。
