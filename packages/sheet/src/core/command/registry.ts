import type { Command, CommandContext, CommandResult } from './types'

/**
 * 命令注册表：register / execute。
 * 命令无状态，可全局共享（见 default-registry）；阶段 4 工具扩展可注册自定义命令。
 */
export class CommandRegistry {
  private commands = new Map<string, Command>()

  /** 注册命令；同 id 重复注册视为错误 */
  register(command: Command): void {
    if (this.commands.has(command.id)) {
      throw new Error(`命令重复注册: ${command.id}`)
    }
    this.commands.set(command.id, command)
  }

  get(id: string): Command | undefined {
    return this.commands.get(id)
  }

  /** 执行命令；未注册的 id 抛错 */
  execute<R>(ctx: CommandContext, id: string, params: unknown): CommandResult<R> | undefined {
    const command = this.commands.get(id)
    if (!command) {
      throw new Error(`命令未注册: ${id}`)
    }
    return command.handler(ctx, params) as CommandResult<R> | undefined
  }
}
