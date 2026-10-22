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

/** 裸控件 → 自动生成的 UFormItem 透传的属性白名单 */
const FORM_ITEM_KEYS = [
  'label',
  'labelPosition',
  'labelWidth',
  'rules',
  'span',
  'tips',
  'readonly',
  'field'
] as const

/**
 * 从裸控件 vnode 的 props 中挑出表单项属性。
 * 模板 kebab 写法（label-position）在 vnode 原始 props 里不转驼峰，
 * 因此驼峰 / kebab 双向取值，缺失的键不进入结果。
 */
function pickFormItemProps(raw: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key of FORM_ITEM_KEYS) {
    const kebab = key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)
    const value = raw[key] ?? raw[kebab]
    if (value !== undefined) result[key] = value
  }

  return result
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

      const formItemProps = pickFormItemProps((props ?? {}) as Record<string, any>)

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
