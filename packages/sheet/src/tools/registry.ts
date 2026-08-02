import { TypedEventEmitter } from '../core/events'
import type { SheetContext } from './context'

/**
 * 工具注册表：USheet 工具栏的扩展点。
 *
 * - 工具是框架无关的纯定义（icon 由 vue 层渲染，故此处类型为 unknown）
 * - 分组渲染：同组工具连续排列，组间渲染分隔符；
 *   组序 = 各组最早注册位置，组内按 (order, 注册序) 升序
 * - 同 id 重复注册 = 替换定义并保留原注册位置（HMR / 覆盖内置工具友好）
 * - 默认注册表全局共享：所有 USheet 实例渲染同一组工具
 *   （与 defaultCommandRegistry 同语义；每个实例的 SheetContext 各自绑定当前 sheet）
 */

/** 工具定义 */
export interface SheetTool {
  /** 唯一 id；同 id 重复注册视为替换（保留原位置） */
  id: string
  /** 按钮文本 */
  title: string
  /** 图标（Vue 组件，由 USheet 渲染；tools 层不依赖 vue 故为 unknown） */
  icon?: unknown
  /** 悬浮提示；缺省用 title */
  tooltip?: string
  /** 分组名（组间渲染分隔符）；缺省 'default' */
  group?: string
  /** 组内排序（升序，相同 order 按注册先后）；缺省 0 */
  order?: number
  /** 是否可见（工具栏状态刷新时求值）；缺省可见 */
  visible?(ctx: SheetContext): boolean
  /** 是否禁用（工具栏状态刷新时求值）；缺省可用 */
  disabled?(ctx: SheetContext): boolean
  /** 点击执行；ctx 是唯一操作入口（写操作全走命令系统，天然可撤销） */
  onClick(ctx: SheetContext): void
}

/** 分组视图（供工具栏渲染） */
export interface SheetToolGroup {
  name: string
  tools: SheetTool[]
}

/** 缺省分组名 */
export const DEFAULT_TOOL_GROUP = 'default'

type ToolEntry = { tool: SheetTool; seq: number }

type ToolRegistryEvents = { change: null }

export class ToolRegistry {
  private entries = new Map<string, ToolEntry>()
  private seq = 0
  private emitter = new TypedEventEmitter<ToolRegistryEvents>()

  /** 注册工具；同 id 重复注册 = 替换定义并保留原注册位置 */
  register(tool: SheetTool): void {
    if (!tool.id) throw new Error('工具注册失败：id 不能为空')
    if (!tool.title) throw new Error(`工具注册失败：${tool.id} 缺少 title`)
    if (typeof tool.onClick !== 'function') {
      throw new Error(`工具注册失败：${tool.id} 缺少 onClick`)
    }
    const prev = this.entries.get(tool.id)
    this.entries.set(tool.id, { tool, seq: prev?.seq ?? this.seq++ })
    this.emitter.emit('change', null)
  }

  /** 注销工具；id 不存在时返回 false（不触发 change） */
  unregister(id: string): boolean {
    const existed = this.entries.delete(id)
    if (existed) this.emitter.emit('change', null)
    return existed
  }

  get(id: string): SheetTool | undefined {
    return this.entries.get(id)?.tool
  }

  has(id: string): boolean {
    return this.entries.has(id)
  }

  get size(): number {
    return this.entries.size
  }

  /** 分组视图：组序 = 各组最早注册位置；组内按 (order, 注册序) 升序 */
  getGroups(): SheetToolGroup[] {
    const groups = new Map<string, { entries: ToolEntry[]; firstSeq: number }>()
    for (const entry of this.entries.values()) {
      const name = entry.tool.group ?? DEFAULT_TOOL_GROUP
      let group = groups.get(name)
      if (!group) {
        group = { entries: [], firstSeq: entry.seq }
        groups.set(name, group)
      }
      group.entries.push(entry)
    }
    return [...groups.entries()]
      .sort((a, b) => a[1].firstSeq - b[1].firstSeq)
      .map(([name, group]) => ({
        name,
        tools: group.entries
          .slice()
          .sort((a, b) => (a.tool.order ?? 0) - (b.tool.order ?? 0) || a.seq - b.seq)
          .map((entry) => entry.tool)
      }))
  }

  /** 订阅注册表变化（register / unregister），返回取消订阅函数 */
  onChange(handler: () => void): () => void {
    return this.emitter.on('change', handler)
  }
}

/**
 * 全局默认注册表（USheet 默认渲染这里的工具；内置工具也注册于此）。
 * 工具是应用级扩展：注册一次，所有 USheet 实例共享。
 */
export const defaultToolRegistry = new ToolRegistry()

/** 注册工具到默认注册表 */
export function registerTool(tool: SheetTool): void {
  defaultToolRegistry.register(tool)
}

/** 从默认注册表注销工具；id 不存在时返回 false */
export function unregisterTool(id: string): boolean {
  return defaultToolRegistry.unregister(id)
}
