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
 * 工具栏分组视图模型：工具的 visible/disabled/active 是 (ctx) => boolean 纯函数，
 * 依赖 stateTick 版本号（选区 / 历史 / 单元格 / 合并 / 冻结 / 注册表变化时 bump）触发重算。
 */
export function useToolGroups(
  context: SheetContext,
  stateTick: Ref<number>
): ComputedRef<ToolGroupView[]> {
  return computed(() => {
    void stateTick.value // 依赖状态源：选区 / 历史 / 单元格 / 合并 / 冻结 / 注册表
    return defaultToolRegistry
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
  })
}
