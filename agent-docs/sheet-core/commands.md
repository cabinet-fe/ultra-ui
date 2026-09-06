---
title: sheet-core 命令系统、操作派发与 Undo/Redo 历史撤销重做
description: 基于 defaultCommandRegistry 的电子表格命令模型与撤销重做系统，涵盖 setCellValue、setCells、setCellFormula、setCellReadonly、mergeCells 等标准 Command 执行机制与 HistoryManager 历史补丁管理
---

`@veltra/sheet-core` 的模型写操作一律走命令：经 `defaultCommandRegistry` 执行，补丁写入 `Sheet.history`（`HistoryManager`），从而可 `undo()` / `redo()`。宿主日常调用 `Sheet` 上的 `setCellValue`、`setCells`、`setCellFormula`、`setCellStyle`、`mergeCells`、`insertRows`、`insertImage` 等方法即可，不必手拼命令 id。

```ts
import { Sheet } from '@veltra/sheet-core'

const sheet = new Sheet('Sheet1')
sheet.setCellValue({ row: 0, col: 0 }, 10)
sheet.setCellValue({ row: 0, col: 0 }, 20)
sheet.undo() // A1 回到 10
sheet.redo() // A1 再次为 20
```

## defaultCommandRegistry

`defaultCommandRegistry` 是全局共享、无状态的默认注册表，模块加载时登记内置命令。`Sheet.executeCommand(id, params)` 走这张表；执行后公式增量重算的派生补丁并入同一 undo 单元。

未注册的 id 会抛错。同 id 重复 `register` 也会抛错。自定义命令可 `defaultCommandRegistry.register({ id, handler })`，`handler` 签名为 `(ctx: CommandContext, params) => CommandResult | undefined`：对 redo 补丁逐项 `ctx.applyPatch(patch, 'redo')`，返回 `{ mutations, result? }`。空 `mutations` 不入历史。

命令 handler 经 `CommandContext.applyPatch` 写入差量；undo/redo 按 `PatchDirection` 回放同一批补丁。

## undo / redo 与事务

`HistoryManager` 挂在 `sheet.history`：

- 一个 undo 单元 = 一次命令，或一次事务里拍平的全部 mutation。
- `sheet.beginTransaction()` / `commit()` / `rollback()` 可嵌套，拍平到最外层；`rollback` 还原已应用变更并放弃事务。
- 容量默认 200，超出淘汰最旧条目；新命令入栈清空 redo。
- `sheet.undo()` / `redo()` 返回 `boolean`（无可做时为 `false`）。`canUndo` / `canRedo` 可读。

**不进 undo**：选区、冻结、行高、列宽；工作簿结构操作（增删改名 sheet）走 `Workbook`，也不进 undo。undo 按 sheet 分栈。

## 公开 Command 类

主入口导出的命令对象（及其 params 类型）如下。日常请优先用对应的 `Sheet` 方法。

| Command | id | Sheet 入口 |
| --- | --- | --- |
| `SetCellValueCommand` | `sheet.command.set-cell-value` | `setCellValue` / `setCells` |
| `SetCellFormulaCommand` | `sheet.command.set-cell-formula` | `setCellFormula` |
| `SetCellStyleCommand` | `sheet.command.set-cell-style` | `setCellStyle` / `clearCellStyle` |
| `SetAxisStyleCommand` | `sheet.command.set-axis-style` | `setRowStyle` / `setColStyle` |
| `InsertCellsCommand` | `sheet.command.insert-cells` | `insertRows` / `insertCols` / `deleteRows` / `deleteCols` |
| `MergeCellsCommand` | `sheet.command.merge-cells` | `mergeCells` |
| `UnmergeCellsCommand` | `sheet.command.unmerge-cells` | `unmergeCells` |
| `InsertImageCommand` | `sheet.insert-image` | `insertImage` |
| `RemoveImageCommand` | `sheet.remove-image` | `removeImage` |
| `UpdateImageCommand` | `sheet.update-image` | `updateImage` |
| `SetCellMetaCommand` | `sheet.set-cell-meta` | `setCellMeta`（`setCellReadonly` 亦走此通道） |
| `ClearCellMetaCommand` | `sheet.clear-cell-meta` | `clearCellMeta` |

直接执行示例：

```ts
import { SetCellValueCommand, type SetCellValueParams } from '@veltra/sheet-core'

const params: SetCellValueParams = {
  items: [{ addr: { row: 0, col: 0 }, data: { v: 42, t: 'n' } }]
}
sheet.executeCommand(SetCellValueCommand.id, params)
```

补丁类型（`Patch` 联合）包括 `CellPatch`、`MergePatch`、`StructurePatch`、`SnapshotPatch`、`ImagePatch`、`CellMetaPatch`、`AxisStylePatch`。同一批补丁双向回放：redo 用 `after`，undo 用 `before`。
