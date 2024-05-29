import type { FormProps } from '@ui/types/components/form'
import { useSlots } from 'vue'
import { pick } from 'cat-kit/fe'
import { extractNormalVNodes } from '@ui/utils'

interface Options {
  props: FormProps
}

const FORM_ITEM_PROPS = ['label', 'field', 'span', 'tips']

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

    return flattedNodes.map(node => {
      const { props, type } = node

      return {
        wrapItem: !!props?.field && (type as any)?.name !== 'FormItem',
        formItemProps: pick(props ?? {}, FORM_ITEM_PROPS),
        node,
        field: props?.field
      }
    })
  }

  return {
    getSlotsNodes
  }
}
