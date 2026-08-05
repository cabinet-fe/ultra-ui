import { computed, type ComputedRef, type Ref } from 'vue'

import type { SheetContext } from '../tools/context'
import { defaultToolRegistry, type SheetTool } from '../tools/registry'

/** 工具栏按钮视图模型 */
export interface ToolGroupItem {
  tool: SheetTool
  disabled: boolean
  active: boolean
}

/** 工具栏分组视图模型（组间渲染分隔符） */
export interface ToolGroupView {
  name: string
  tools: ToolGroupItem[]
}

/**
 * 内置组稳定顺序：history ｜ cell ｜ text ｜ edit ｜ insert ｜ file。
 * 未列出的自定义组按注册先后排在已知组之后。
 */
const BUILTIN_GROUP_ORDER = ['history', 'cell', 'text', 'edit', 'insert', 'file'] as const

/**
 * 工具栏分组视图模型：工具的 visible/disabled/active 是 (ctx) => boolean 纯函数，
 * 依赖 stateTick 版本号（选区 / 历史 / 单元格 / 合并 / 冻结 / 注册表变化时 bump）触发重算。
 */
export function useToolGroups(
  context: SheetContext,
  stateTick: Ref<number>
): ComputedRef<ToolGroupView[]> {
  return computed(() => {
    void stateTick.value // 依赖状态源：选区 / 历史 / 单元格 / 合并 / 冻结 / 注册表
    const groups = defaultToolRegistry
      .getGroups()
      .map((group) => ({
        name: group.name,
        tools: group.tools
          .map((tool) => ({
            tool,
            visible: tool.visible?.(context) ?? true,
            disabled: tool.disabled?.(context) ?? false,
            active: tool.active?.(context) ?? false
          }))
          .filter((item) => item.visible)
      }))
      .filter((group) => group.tools.length > 0)

    const orderIndex = new Map<string, number>(
      BUILTIN_GROUP_ORDER.map((name, index) => [name, index])
    )
    return groups.sort((a, b) => {
      const ai = orderIndex.get(a.name) ?? BUILTIN_GROUP_ORDER.length
      const bi = orderIndex.get(b.name) ?? BUILTIN_GROUP_ORDER.length
      if (ai !== bi) return ai - bi
      // 未知组之间保持 getGroups() 注册序（已稳定）
      return 0
    })
  })
}
