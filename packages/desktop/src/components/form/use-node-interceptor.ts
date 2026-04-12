import { o } from '@cat-kit/core'
import { createIncrease, extractNormalVNodes } from '@veltra/utils'
import { onBeforeUnmount, useSlots, type VNode } from 'vue'

import type { FormProps } from '../../types'

interface Options {
  props: FormProps
}

export type SlotRenderItem =
  | {
      isFormItem: true
      formItemProps: Record<string, any>
      node: VNode
      field: undefined
      modelValue?: any
    }
  | {
      isFormItem: false
      formItemProps: Record<string, any>
      node: VNode
      field: string
      modelValue?: any
    }

const id = createIncrease(1)

/**
 * 虚拟node拦截
 * @param options 选项
 * @returns
 */
export function useNodeInterceptor(options: Options): {
  getSlotsNodes: () => SlotRenderItem[] | null
} {
  const { props } = options
  const slots = useSlots()

  const formId = id()

  function getSlotsNodes() {
    const { model } = props
    const nodes = slots.default?.({ model, data: model?.data })
    if (!nodes?.length) return null

    const flattedNodes = extractNormalVNodes(nodes)

    const results: SlotRenderItem[] = []

    // 渲染表单后得到的应当校验的字段
    const fields: string[] = []

    let i = 0
    while (i < flattedNodes.length) {
      const node = flattedNodes[i]!
      i++

      const { props, type } = node
      const item = {
        isFormItem: (type as any)?.name === 'FormItem',
        formItemProps: o((props ?? {}) as Record<string, any>).pick([
          'label',
          'field',
          'span',
          'tips',
          'readonly'
        ]),
        node,
        field: props?.field,
        modelValue: props?.['model-value'] ?? props?.modelValue
      }

      item.field && fields.push(item.field)
      results.push(item)
    }

    model.formKeys.set(formId, fields)
    return results
  }

  onBeforeUnmount(() => {
    props.model?.formKeys.delete(formId)
  })

  return { getSlotsNodes }
}
