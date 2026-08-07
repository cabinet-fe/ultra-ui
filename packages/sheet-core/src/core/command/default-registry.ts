import { ClearCellMetaCommand, SetCellMetaCommand } from './cell-meta'
import { InsertImageCommand, RemoveImageCommand, UpdateImageCommand } from './image'
import { InsertCellsCommand } from './insert-delete-cells'
import { MergeCellsBatchCommand, MergeCellsCommand, UnmergeCellsCommand } from './merge-cells'
import { CommandRegistry } from './registry'
import { RestoreSheetCommand } from './restore-sheet'
import { SetCellFormulaCommand } from './set-cell-formula'
import { SetCellStyleCommand } from './set-cell-style'
import { SetCellValueCommand } from './set-cell-value'

/**
 * 默认命令注册表：内置命令模块加载时注册一次，全局共享（命令无状态）。
 * Sheet 默认经此表执行命令；阶段 4 工具扩展可继续注册自定义命令。
 */
export const defaultCommandRegistry = new CommandRegistry()

defaultCommandRegistry.register(SetCellValueCommand)
defaultCommandRegistry.register(SetCellFormulaCommand)
defaultCommandRegistry.register(InsertCellsCommand)
defaultCommandRegistry.register(SetCellStyleCommand)
defaultCommandRegistry.register(MergeCellsCommand)
defaultCommandRegistry.register(MergeCellsBatchCommand)
defaultCommandRegistry.register(UnmergeCellsCommand)
defaultCommandRegistry.register(RestoreSheetCommand)
defaultCommandRegistry.register(InsertImageCommand)
defaultCommandRegistry.register(RemoveImageCommand)
defaultCommandRegistry.register(UpdateImageCommand)
defaultCommandRegistry.register(SetCellMetaCommand)
defaultCommandRegistry.register(ClearCellMetaCommand)
