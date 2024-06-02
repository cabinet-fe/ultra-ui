import type { FormProps } from '@ui/types/components/form'
import { useSlots, type VNode } from 'vue'
import { pick } from 'cat-kit/fe'
import { extractNormalVNodes } from '@ui/utils'

interface Options {
  props: FormProps
}

const FORM_ITEM_PROPS = ['label', 'field', 'span', 'tips', 'readonly']

/**
 * 虚拟node拦截
 * @param options 选项
 * @returns
 */
export function useNodeInterceptor(options: Options) {
  const { props } = options
  const slots = useSlots()

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
        }
      | {
          isFormItem: false
          formItemProps: Record<string, any>
          node: VNode
          field: undefined
        }
    > = []

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
        field: props?.field
      }

      item.field && fields.push(item.field)
      results.push(item)
    }

    props.model.validateKeys = fields

    return results
  }

  return {
    getSlotsNodes
  }
}
