---
title: "sheet-core 命令体系与撤销重做（Command / HistoryManager）"
description: "从 @veltra/sheet-core 导入的命令系统：写操作经 defaultCommandRegistry 执行产生 Patch 补丁，HistoryManager 双向回放实现 undo/redo；覆盖 SetCellValueCommand、SetCellFormulaCommand、SetCellStyleCommand、InsertCellsCommand、MergeCellsCommand、图片与 Cell Meta 全部 12 个内置命令的 Params 与撤销重做事务。"
aliases: ["命令系统", "命令", "撤销重做", "undo redo", "补丁回放", "CommandRegistry", "操作历史"]
keywords: ["CommandContext", "CommandResult", "defaultCommandRegistry", "Patch", "Mutation", "CellPatch", "MergePatch", "StructurePatch", "ImagePatch", "CellMetaPatch", "AxisStylePatch", "SetCellValueCommand", "SetCellFormulaCommand", "SetCellStyleCommand", "InsertCellsCommand", "MergeCellsCommand", "UnmergeCellsCommand", "UpdateImageCommand", "beginTransaction", "rollback"]
---

# sheet-core 命令体系与撤销重做（Command / HistoryManager）

`@veltra/sheet-core` 主入口导出命令体系：`Command` / `CommandContext` / `CommandResult` 类型、`defaultCommandRegistry` 默认注册表、`HistoryManager` 撤销重做栈与 12 个内置命令对象。`Sheet` 的一切写操作（值 / 公式 / 样式 / 合并 / 行列结构 / 图片 / Cell Meta）都执行为命令：handler 产出 `Patch` 差量补丁，立即应用后推入 `sheet.history`；undo / redo 对同一批补丁双向回放（redo 应用 `after`，undo 应用 `before`），公式重算的派生补丁并入同一 undo 单元。

## 快速上手

```ts
import { Sheet } from '@veltra/sheet-core';

const sheet = new Sheet('Sheet1');

sheet.setCellValue({ row: 0, col: 0 }, 10); // 内部经 SetCellValueCommand 执行
sheet.setCellValue({ row: 0, col: 0 }, 20);
console.log(sheet.canUndo, sheet.canRedo); // => true false

sheet.undo(); // => true，A1 回到 10
console.log(sheet.getDisplayValue({ row: 0, col: 0 })); // => 10

sheet.redo(); // => true，A1 再次为 20
console.log(sheet.getDisplayValue({ row: 0, col: 0 })); // => 20
console.log(sheet.canUndo, sheet.canRedo); // => true false
```

## API 签名

```ts
/** 补丁回放方向：undo 应用 before，redo 应用 after */
export type PatchDirection = 'undo' | 'redo'

/** 单元格数据差量补丁（原始存储语义；undefined = 该侧无此格） */
export interface CellPatch {
  kind: 'cell'
  addr: CellAddress
  /** 目标 sheet（跨表公式重算的派生补丁落在其它 sheet）；缺省 = 命令所在 sheet */
  sheet?: Sheet
  before?: CellData
  after?: CellData
}

/** 合并记录差量补丁（before/after = 该侧是否存在此合并） */
export interface MergePatch {
  kind: 'merge'
  range: CellRange
  before: boolean
  after: boolean
}

/** 行列插入/删除（undo = 反向结构操作） */
export type StructureChange =
  | { kind: 'insert-rows'; at: number; count: number }
  | { kind: 'delete-rows'; at: number; count: number }
  | { kind: 'insert-cols'; at: number; count: number }
  | { kind: 'delete-cols'; at: number; count: number }

/** 结构变更补丁（undo 时按 beforeRows/beforeCols 精确还原尺寸） */
export interface StructurePatch {
  kind: 'structure'
  change: StructureChange
  beforeRows: number
  beforeCols: number
}

/** 整表快照替换补丁（导入替换 / undo 回放走 restoreContent，发 content-reset） */
export interface SnapshotPatch {
  kind: 'snapshot'
  snapshot: SheetSnapshot
}

/** 图片差量补丁（插入 / 删除 / 更新；before/after = 该侧图片快照） */
export interface ImagePatch {
  kind: 'image'
  id: string
  before?: SheetImage
  after?: SheetImage
}

/** Cell Meta 差量补丁（按地址 + namespace） */
export interface CellMetaPatch {
  kind: 'cell-meta'
  addr: CellAddress
  namespace: string
  before?: unknown
  after?: unknown
}

/** 行/列默认样式差量补丁（StyleId 引用同一 styles 池） */
export interface AxisStylePatch {
  kind: 'axis-style'
  axis: 'row' | 'col'
  index: number
  before?: number
  after?: number
}

export type Patch =
  | CellPatch
  | MergePatch
  | StructurePatch
  | SnapshotPatch
  | ImagePatch
  | CellMetaPatch
  | AxisStylePatch

/** 一次命令执行产生的变更单元：redo 按序应用，undo 逆序应用 */
export interface Mutation {
  redo: Patch[]
  undo: Patch[]
}

export interface CommandResult<R = unknown> {
  /** 空数组 = 无实际变更，不入历史 */
  mutations: Mutation[]
  /** 命令附带返回值（MergeCellsCommand 返回最终生效区域、InsertImageCommand 返回 id） */
  result?: R
}

export interface CommandContext {
  sheet: Sheet
  /** 命令执行与 undo/redo 回放共用的唯一变更通道 */
  applyPatch(patch: Patch, direction: PatchDirection): void
}

export interface Command<P = unknown, R = unknown> {
  readonly id: string
  handler(ctx: CommandContext, params: P): CommandResult<R> | undefined
}

/** 全局共享默认注册表（CommandRegistry 实例，该类不在导出白名单）；12 个内置命令模块加载时登记一次 */
export declare const defaultCommandRegistry: {
  register(command: Command): void // 同 id 重复注册抛 Error('命令重复注册: <id>')
  get(id: string): Command | undefined
  execute<R>(ctx: CommandContext, id: string, params: unknown): CommandResult<R> | undefined // 未注册的 id 抛 Error('命令未注册: <id>')
}

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
}

export class HistoryManager {
  constructor(
    applyPatch: (patch: Patch, direction: PatchDirection) => void,
    capacity?: number // 默认 200
  )
  get canUndo(): boolean
  get canRedo(): boolean
  get undoSize(): number
  get redoSize(): number
  get inTransaction(): boolean
}
```

`defaultCommandRegistry` 是 `CommandRegistry` 的实例（`CommandRegistry` 类本身不在导出白名单），实例方法 `register(command)` / `get(id)` / `execute<R>(ctx, id, params)` 语义见 `## 方法与事件`。

```ts
export interface SetCellValueItem {
  addr: CellAddress
  /** 空数据（无公式且 v 为 null/undefined/''）= 清除 */
  data?: CellData
}
export interface SetCellValueParams {
  /** 批量写入；一次调用 = 一个 undo 单元 */
  items: SetCellValueItem[]
}

export interface SetCellFormulaParams {
  addr: CellAddress
  /** 公式文本（不含 '='） */
  formula: string
}

export interface SetCellStyleItem {
  addr: CellAddress
  /** 部分样式合并（CellStylePatch 语义）；与 clear 互斥，缺省 = 无操作 */
  partial?: CellStylePatch
  /** 清除该格样式；与 partial 互斥，clear 优先 */
  clear?: boolean
}
export interface SetCellStyleParams {
  items: SetCellStyleItem[]
}

export interface SetAxisStyleItem {
  /** 行号或列号（0-based） */
  index: number
  /** 部分样式合并；与 clear 互斥 */
  partial?: CellStylePatch
  /** 清除该行/列默认样式；与 partial 互斥，clear 优先 */
  clear?: boolean
}
export interface SetAxisStyleParams {
  axis: 'row' | 'col'
  items: SetAxisStyleItem[]
}

export interface InsertCellsParams {
  change: StructureChange
}

export interface MergeCellsParams {
  range: CellRange
}
export interface UnmergeCellsParams {
  range: CellRange
}

export interface InsertImageParams {
  image: ImageInput
}
export interface RemoveImageParams {
  id: string
}
export interface ImageUpdateFields {
  anchor?: SheetImageAnchor
  width?: number
  height?: number
  altText?: string
  title?: string
}
export interface UpdateImageParams {
  id: string
  patch: ImageUpdateFields
}

export interface SetCellMetaParams {
  addr: CellAddress
  namespace: string
  payload: unknown
}
export interface ClearCellMetaParams {
  addr: CellAddress
  namespace: string
}
```

## 参数说明

内置命令 id 与 Params（经 `sheet.executeCommand(id, params)` 或对应 `Sheet` 方法调用）：

| Command | id | Params | Sheet 入口 |
| --- | --- | --- | --- |
| `SetCellValueCommand` | `sheet.command.set-cell-value` | `{ items }` | `setCellValue` / `setCells` |
| `SetCellFormulaCommand` | `sheet.command.set-cell-formula` | `{ addr, formula }` | `setCellFormula` |
| `SetCellStyleCommand` | `sheet.command.set-cell-style` | `{ items }` | `setCellStyle` / `setCellStyles` / `clearCellStyle` |
| `SetAxisStyleCommand` | `sheet.command.set-axis-style` | `{ axis, items }` | `setRowStyle` / `setColStyle` 等 |
| `InsertCellsCommand` | `sheet.command.insert-cells` | `{ change }` | `insertRows` / `insertCols` / `deleteRows` / `deleteCols` |
| `MergeCellsCommand` | `sheet.command.merge-cells` | `{ range }` | `mergeCells` |
| `UnmergeCellsCommand` | `sheet.command.unmerge-cells` | `{ range }` | `unmergeCells` |
| `InsertImageCommand` | `sheet.insert-image` | `{ image }` | `insertImage` |
| `RemoveImageCommand` | `sheet.remove-image` | `{ id }` | `removeImage` |
| `UpdateImageCommand` | `sheet.update-image` | `{ id, patch }` | `updateImage` |
| `SetCellMetaCommand` | `sheet.set-cell-meta` | `{ addr, namespace, payload }` | `setCellMeta` |
| `ClearCellMetaCommand` | `sheet.clear-cell-meta` | `{ addr, namespace }` | `clearCellMeta` |

Params 字段五要素：

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `items`（SetCellValue） | `SetCellValueItem[]` | — | 是 | 逐项解析合并锚点；与 before 相等的项跳过不产生补丁；写值保留既有样式（`data.s` 显式给出时优先） |
| `items[].data` | `CellData` | — | 否 | 空数据 = 清除该格 |
| `addr` | `CellAddress` | — | 是 | 0-based；被覆盖格自动解析到锚点 |
| `formula`（SetCellFormula） | `string` | — | 是 | 不含 `'='`（`Sheet.setCellFormula` 负责剥离）；与既有公式相同 = 无变更不入历史 |
| `items`（SetCellStyle） | `SetCellStyleItem[]` | — | 是 | 同一锚点的重复项合并为一个补丁；`partial` 与 `clear` 互斥，`clear` 优先；二者都缺省 = 无操作 |
| `axis`（SetAxisStyle） | `'row' \| 'col'` | — | 是 | 决定 `items[].index` 是行号还是列号 |
| `items[].index`（SetAxisStyle） | `number` | — | 是 | 非负整数；非整数或负数跳过；同 index 重复项只取第一个 |
| `change`（InsertCells） | `StructureChange` | — | 是 | `kind` 四选一；`count <= 0` 返回 `undefined`（无操作不入历史） |
| `range`（Merge / Unmerge） | `CellRange` | — | 是 | 合并与既有合并相交时取包围盒；解除只影响与 `range` 相交的合并 |
| `image`（InsertImage） | `ImageInput` | — | 是 | `data` / `type` / `anchor` 必填；`id` 缺省经 `createImageId()` 生成；id 已存在 = 无操作（不覆盖既有图） |
| `id`（Remove / UpdateImage） | `string` | — | 是 | 不存在 = 无操作不入历史 |
| `patch`（UpdateImage） | `ImageUpdateFields` | — | 是 | 只更新出现的字段；`width` / `height` 传 `0` 不生效（`!= null` 判断）；锚点整段替换 |
| `namespace`（Set / ClearCellMeta） | `string` | — | 是 | 空白字符串 = 无操作不入历史 |
| `payload`（SetCellMeta） | `unknown` | — | 是 | 必须可序列化；与既有 payload 相等（JSON 比较）= 无操作；`undefined` 等价删除 |

## 方法与事件

### 通用执行模式

- `sheet.executeCommand<R>(id, params)` → `R | undefined`：经 `defaultCommandRegistry` 查表执行 handler；handler 内对 redo 补丁逐项 `ctx.applyPatch(patch, 'redo')`；执行完成后公式增量重算的派生补丁作为附加 mutation 并入同一 undo 单元，一起 `history.push`。`mutations` 为空（无实际变更）不入历史、不发派生重算。id 未注册抛 `Error('命令未注册: <id>')`。
- `defaultCommandRegistry.register(command)`：注册自定义命令；同 id 重复注册抛 `Error('命令重复注册: <id>')`。命令必须无状态（全局共享）。
- `sheet.history` 即 `HistoryManager`（`applyPatch` 由 Sheet 注入，命令执行与回放共用一条变更通道）。

### HistoryManager（undo / redo 与事务）

- `push(mutations)`：命令产物入栈；事务进行中则缓冲；空列表忽略；新命令入栈清空 redo 栈。
- `undo()` / `redo()` → `boolean`：撤销 / 重做一个单元；事务进行中或栈空返回 `false`。undo 把条目移入 redo 栈，redo 移回 undo 栈。
- `beginTransaction()` / `commit()`：事务内所有命令的 mutation 合并为一个 undo 单元；可嵌套（深度计数，拍平到最外层）。无进行中事务时 `commit()` 抛 `Error('HistoryManager.commit：没有进行中的事务')`。
- `rollback()`：逆序应用缓冲区中各 mutation 的 undo 补丁还原模型，丢弃缓冲并结束事务（含嵌套）；不动 undo/redo 栈。
- `clear()`：清空 undo / redo 栈与事务缓冲。
- 容量默认 200（构造第二参可调），超出淘汰最旧条目；`undoSize` / `redoSize` 供调试。
- `onChange(handler)` → `() => void`：订阅 `HistoryState`（`canUndo` / `canRedo`）。`Sheet` 已把它转发为 `history-change` 事件。

### 内置命令行为

- `SetCellValueCommand`：逐项解析锚点、捕获 before/after 并立即应用；编辑值保留既有样式（样式属于单元格，不随值写入丢失）。返回 `result: undefined`。
- `SetCellFormulaCommand`：只登记公式原文 `f`，计算缓存 `v`/`t` 由执行后的增量重算以派生补丁填充；解析失败按 `#ERROR!`；既有样式保留。
- `SetCellStyleCommand`：锚点去重后按 `mergeCellStyle` 部分合并（`fill` 存在即覆盖、`border` 边级、`font`/`align` 逐字段、`numFmt` 整体替换，`null` 删除）；空结果删除 `s` 字段（不破坏空单元格不占存储）。
- `SetAxisStyleCommand`：行/列默认样式经 StylePool intern；空结果清除该行/列条目；发 `axis-style-change`。
- `InsertCellsCommand`：redo = 正向结构操作（数据/合并/行高列宽/行列样式/图片锚点/尺寸平移）+ 公式引用平移 CellPatch；undo = 先恢复平移公式 → 反向结构 → 恢复删除区间单元格/图片/收缩前锚点。删除区间内公式引用断链为 `#REF!`。
- `MergeCellsCommand`：值保留 = 包围盒内行主序第一个有值格写入新锚点，其余清空；边界外边框合成写入锚点；返回 `result: CellRange`（最终生效区域）。
- `UnmergeCellsCommand`：解除相交合并，undo 恢复合并记录；被覆盖格本就无值。
- `InsertImageCommand`：返回 `result: string`（生成的图片 id）。
- `SetCellMetaCommand` / `ClearCellMetaCommand`：Cell Meta 侧车写入 / 清除；单元格只读标记（`CELL_READONLY_META_NAMESPACE`）走同一通道。

## 典型示例

### 经 executeCommand 直调命令并撤销重做

```ts
import { Sheet, SetCellValueCommand, type SetCellValueParams } from '@veltra/sheet-core';

const sheet = new Sheet('Data');

// 直调命令：与 sheet.setCells 等价（经 defaultCommandRegistry）
const params: SetCellValueParams = {
  items: [
    { addr: { row: 0, col: 0 }, data: { v: '姓名', t: 's' } },
    { addr: { row: 0, col: 1 }, data: { v: '分数', t: 's' } },
    { addr: { row: 1, col: 0 }, data: { v: 'Alice', t: 's' } },
    { addr: { row: 1, col: 1 }, data: { v: 92, t: 'n' } }
  ]
};
sheet.executeCommand(SetCellValueCommand.id, params);

// 一次批量 = 一个 undo 单元：undo 一步清掉 4 个格
sheet.undo();
console.log(sheet.getCellData({ row: 1, col: 1 })); // => undefined

// 重做恢复整批
sheet.redo();
console.log(sheet.getDisplayValue({ row: 1, col: 1 })); // => 92
```

### 事务：多命令合并为单 undo 单元与回滚

```ts
import { Sheet } from '@veltra/sheet-core';

const sheet = new Sheet('Report');

// 事务内多条命令在 commit 时合并为一个 undo 单元
sheet.beginTransaction();
try {
  sheet.setCellValue({ row: 0, col: 0 }, '合计');
  sheet.setCellStyle(
    { start: { row: 0, col: 0 }, end: { row: 0, col: 1 } },
    { font: { bold: true }, fill: { color: '#FFF7E6' } }
  );
  sheet.commit();
  sheet.undo(); // 一步同时撤销值与样式
  console.log(sheet.getCellData({ row: 0, col: 0 })); // => undefined
} catch (error) {
  sheet.rollback(); // 还原事务内已应用的变更并放弃，不动历史栈
  throw error;
}

// 事务可嵌套：beginTransaction 深度计数，最外层 commit 才入栈
sheet.beginTransaction();
sheet.setCellValue({ row: 2, col: 0 }, 'A');
sheet.beginTransaction();
sheet.setCellValue({ row: 2, col: 1 }, 'B');
sheet.commit();
console.log(sheet.history.inTransaction); // => true（还差最外层）
sheet.commit();
sheet.undo();
console.log(sheet.getCellData({ row: 2, col: 0 })); // => undefined（两步一并撤销）
```

### 公式与合并的 undo / redo 联动

```ts
import { Sheet, createRange } from '@veltra/sheet-core';

const sheet = new Sheet('Calc');

sheet.setCellValue({ row: 0, col: 0 }, 1);
sheet.setCellValue({ row: 1, col: 0 }, 2);
sheet.setCellFormula({ row: 2, col: 0 }, '=SUM(A1:A2)'); // '=' 前缀可省
console.log(sheet.getDisplayValue({ row: 2, col: 0 })); // => 3

// 合并 A1:B2：值保留规则 = 行主序第一个有值格（A1 的 1）保留，A2 的 2 清空；
// 清空触发公式增量重算，派生补丁（A3 重算为 1+0）并入同一 undo 单元
const final = sheet.mergeCells(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }));
console.log(final.start); // => { row: 0, col: 0 }
console.log(sheet.getDisplayValue({ row: 2, col: 0 })); // => 1（=SUM(A1:A2) 重算结果）

// undo 一步撤销合并 + 被清空的值还原 + 公式缓存派生补丁回放（不重算）
sheet.undo();
console.log(sheet.getCellInfo({ row: 0, col: 1 }).kind); // => 'normal'
console.log(sheet.getDisplayValue({ row: 1, col: 0 })); // => 2（A2 值还原）
console.log(sheet.getDisplayValue({ row: 2, col: 0 })); // => 3（缓存补丁回放恢复）

// redo 回放合并命令与其派生补丁
sheet.redo();
console.log(sheet.getCellInfo({ row: 0, col: 1 }).kind); // => 'merged-covered'
console.log(sheet.getDisplayValue({ row: 2, col: 0 })); // => 1（A2 被合并清空后的重算缓存）
```

## 注意事项

> [!WARNING]
> - undo 按 sheet 分栈：`sheet.undo()` 只回放本表历史；跨表公式重算的派生补丁随源命令所在 sheet 的历史回放（按 `CellPatch.sheet` 路由到目标表）。
> - 不进 undo 的写操作：工作簿结构（`Workbook.addSheet` / `removeSheet` / `renameSheet`）、选区、冻结、行高、列宽；新 `Sheet` 的 `addSheet` 初始数据基线也已 `history.clear()`。
> - 命令的 undo/redo 是纯补丁回放（不重算）：公式缓存由补丁恢复；undo/redo 后图状态由 `applyPatch` 内的依赖图同步维持。
> - 禁止绕过命令直接改 `sheet.store`：不产生补丁、不进 undo、依赖图不同步。宿主写操作一律走 `Sheet` 方法或 `executeCommand`。
> - `mutations` 为空的命令（无实际变更、`count <= 0` 的结构操作、不存在的 id 删除等）不入历史，也不清空 redo 栈。
> - 新命令入栈即清空 redo 栈：undo 后执行新写操作， redo 不可恢复（`canRedo` 变 `false`）。
> - `RestoreSheetCommand`（`sheet.restore-sheet`）在主入口白名单之外（仅类型 `SnapshotPatch` 导出）；整表替换经 IO 导入链路使用，宿主不要手拼该 id。
> - `MergeCellsBatchCommand`（`sheet.command.merge-cells-batch`）的类型不在主入口导出（`Sheet.mergeCellsBatch(ranges)` 可用）；批量合并请走 Sheet 方法。

## 常见问题

### 报错 `Error: 命令未注册: <id>`

`executeCommand` 的 id 拼写错误或命令未登记。修复：

```ts
import { defaultCommandRegistry, Command } from '@veltra/sheet-core';

// 自定义命令：先注册再执行
const command: Command<{ text: string }> = {
  id: 'my.command.set-text',
  handler(ctx, params) {
    const patch = { kind: 'cell' as const, addr: { row: 0, col: 0 }, after: { v: params.text, t: 's' as const } };
    ctx.applyPatch(patch, 'redo');
    return { mutations: [{ redo: [patch], undo: [patch] }] };
  }
};
defaultCommandRegistry.register(command); // 模块加载处登记一次
```

内置命令 id 见 `## 参数说明` 表。

### 报错 `Error: 命令重复注册: <id>`

对同一 id 调用了两次 `register`。命令无状态、全局共享：模块加载处登记一次即可，不要在每个实例构造时注册。

### 报错 `Error: HistoryManager.commit：没有进行中的事务`

`commit()` / `rollback()` 与 `beginTransaction()` 不配对。修复：每个 `beginTransaction()` 必须对应一次最外层 `commit()`；异常路径先 `rollback()` 再抛出。

```ts
sheet.beginTransaction();
try {
  sheet.setCellValue({ row: 0, col: 0 }, 'x');
  sheet.commit();
} catch (error) {
  sheet.rollback(); // 还原事务内已应用变更并结束事务
  throw error;
}
```
