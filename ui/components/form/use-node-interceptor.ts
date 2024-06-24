import type { FormProps } from '@ui/types/components/form'
import { onBeforeUnmount, useSlots, type VNode } from 'vue'
import { pick } from 'cat-kit/fe'
import { createIncrease, extractNormalVNodes } from '@ui/utils'

interface Options {
  props: FormProps
}

const FORM_ITEM_PROPS = ['label', 'field', 'span', 'tips', 'readonly']

const id = createIncrease(1)

/**
 * 虚拟node拦截
 * @param options 选项
 * @returns
 */
export function useNodeInterceptor(options: Options) {
  const { props } = options
  const slots = useSlots()

  const formId = id()

  function getSlotsNodes() {
    const { model } = props
    const nodes = slots.default?.({
      model,
      data: model?.data
    })
    if (!nodes?.length) return null

    const flattedNodes = extractNormalVNodes(nodes)

    const results: Array<
      | {
          isFormItem: true
          formItemProps: Record<string, any>
          node: VNode
          field: string
          modelValue?: any
        }
      | {
          isFormItem: false
          formItemProps: Record<string, any>
          node: VNode
          field: undefined
          modelValue?: any
        }
    > = []

    // 渲染表单后得到的应当校验的字段
    const fields: string[] = []

    let i = 0
    while (i < flattedNodes.length) {
      const node = flattedNodes[i]!
      i++

      const { props, type } = node
      const item = {
        isFormItem: !!props?.field && (type as any)?.name !== 'FormItem',
        formItemProps: pick(props ?? {}, FORM_ITEM_PROPS),
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

  return {
    getSlotsNodes
  }
}
