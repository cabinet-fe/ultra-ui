import { o } from '@cat-kit/core'
import { extractNormalVNodes } from '@veltra/utils'
import { useSlots, type VNode } from 'vue'

export type SlotRenderItem = {
  isFormItem: boolean
  formItemProps?: Record<string, any>
  node: VNode
  field?: string
  modelValue?: any
}

/**
 * 虚拟node拦截
 * @returns
 */
export function useNodeInterceptor(): { getSlotsNodes: () => SlotRenderItem[] | null } {
  const slots = useSlots()

  function getSlotsNodes() {
    const nodes = slots.default?.()
    if (!nodes?.length) return null

    const flattedNodes = extractNormalVNodes(nodes)

    const results: SlotRenderItem[] = []

    let i = 0
    while (i < flattedNodes.length) {
      const node = flattedNodes[i]!
      i++

      const { props, type } = node
      const field = props?.field as string | undefined
      const isFormItem = (type as any)?.name === 'FormItem'
      const formItemProps = o((props ?? {}) as Record<string, any>).pick([
        'label',
        'rules',
        'span',
        'tips',
        'readonly',
        'field'
      ]) as Record<string, any>

      results.push({
        isFormItem,
        formItemProps,
        node,
        field,
        modelValue: props?.['model-value'] ?? props?.modelValue
      })
    }

    return results
  }

  return { getSlotsNodes }
}
