import type { FormProps } from '@ui/types/components/form'
import {
  useSlots,
  type VNode,
  createTextVNode,
  type VNodeArrayChildren,
  isVNode,
  createVNode
} from 'vue'
import FormItem from '../form-item/form-item.vue'
import { pick } from 'cat-kit/fe'
import { isFragment, isTemplate } from '@ui/utils'

function flatNodes(nodes: VNodeArrayChildren, results: VNode[] = []) {
  nodes.forEach(node => {
    if (!isVNode(node)) {
      if (typeof node === 'string' || typeof node === 'number') {
        results.push(createTextVNode(String(node)))
      }
      return
    }
    if (
      (isFragment(node) || isTemplate(node)) &&
      Array.isArray(node.children)
    ) {
      flatNodes(node.children, results)
    } else {
      results.push(node)
    }
  })
  return results
}

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
    const nodes = slots.default?.({
      data: props.model?.data,
      model: props.model
    })
    if (!nodes?.length) return null

    const data = props.model?.data
    if (!data) return nodes

    const flattedNodes = flatNodes(nodes)

    const results: VNode[] = []

    let i = 0
    while (i < flattedNodes.length) {
      const node = flattedNodes[i]!
      const { props, type } = node
      // 原本应该加上 isObj(type) && ('name' in type)
      // 此处为了性能忽略
      // @ts-ignore
      if (props?.field && type.name !== 'FormItem') {
        const field = props.field
        props.modelValue = data[field]

        const modelUpdater = props['onUpdate:modelValue']
        if (modelUpdater) {
          props['onUpdate:modelValue'] = [
            ...(typeof modelUpdater === 'function'
              ? [modelUpdater]
              : modelUpdater),
            (value: any) => {
              data[field] = value
            }
          ]
        } else {
          props['onUpdate:modelValue'] = (value: any) => {
            data[field] = value
          }
        }

        results.push(
          createVNode(
            FormItem,
            pick(node.props || {}, FORM_ITEM_PROPS),
            () => node
          )
        )
      } else {
        results.push(node)
      }

      i++
    }

    return results
  }

  return {
    getSlotsNodes
  }
}
