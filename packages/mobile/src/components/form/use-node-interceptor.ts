import { o } from '@cat-kit/core'
import { extractNormalVNodes } from '@veltra/utils'
import { useSlots, type VNode } from 'vue'

export type SlotRenderItem = {
  isFormItem: boolean
  formItemProps?: Record<string, any>
  node: VNode
  field?: string
  modelValue?: any
  /** v-for 身份：调用方 :key 优先，否则 type+field+出现次序 */
  renderKey: string | number | symbol
}

function getVNodeTypeName(node: VNode): string {
  const type = node.type as { name?: string; __name?: string } | string
  if (typeof type === 'string') return type
  if (typeof type === 'object' && type) return type.name || type.__name || ''
  return ''
}

/**
 * 虚拟node拦截：带 field 的裸控件由 UForm 包进 UFormItem，表单项与其余节点原样渲染
 * @returns
 */
export function useNodeInterceptor(): { getSlotsNodes: () => SlotRenderItem[] | null } {
  const slots = useSlots()

  function getSlotsNodes() {
    const nodes = slots.default?.()
    if (!nodes?.length) return null

    const flattedNodes = extractNormalVNodes(nodes)

    const results: SlotRenderItem[] = []
    const seen = new Map<string, number>()

    let i = 0
    while (i < flattedNodes.length) {
      const node = flattedNodes[i]!
      i++

      const { props, type } = node
      const field = props?.field as string | undefined
      const isFormItem = (type as any)?.name === 'UFormItem'

      const formItemProps = o((props ?? {}) as Record<string, any>).pick([
        'label',
        'rules',
        'span',
        'tips',
        'readonly',
        'field'
      ]) as Record<string, any>

      let renderKey: string | number | symbol
      if (node.key != null) {
        renderKey = node.key
      } else {
        const base = `${getVNodeTypeName(node)}:${field ?? ''}`
        const n = seen.get(base) ?? 0
        seen.set(base, n + 1)
        renderKey = n === 0 ? `uform:${base}` : `uform:${base}#${n}`
      }

      results.push({
        isFormItem,
        formItemProps,
        node,
        field,
        modelValue: props?.['model-value'] ?? props?.modelValue,
        renderKey
      })
    }

    return results
  }

  return { getSlotsNodes }
}
