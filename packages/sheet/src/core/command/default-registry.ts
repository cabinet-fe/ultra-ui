import { MergeCellsCommand, UnmergeCellsCommand } from './merge-cells'
import { CommandRegistry } from './registry'
import { SetCellValueCommand } from './set-cell-value'

/**
 * 默认命令注册表：内置命令模块加载时注册一次，全局共享（命令无状态）。
 * Sheet 默认经此表执行命令；阶段 4 工具扩展可继续注册自定义命令。
 */
export const defaultCommandRegistry = new CommandRegistry()

defaultCommandRegistry.register(SetCellValueCommand)
defaultCommandRegistry.register(MergeCellsCommand)
defaultCommandRegistry.register(UnmergeCellsCommand)
