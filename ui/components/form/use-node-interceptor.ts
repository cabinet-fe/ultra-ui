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

interface Options {
  props: FormProps
}

/**
 * 虚拟node拦截
 * @param options 选项
 * @returns
 */
export function useNodeInterceptor(options: Options) {
  const { props } = options
  const slots = useSlots()

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

  return function getSlotsNodes() {
    const nodes = slots.default?.()
    if (!nodes?.length) return null

    const data = props.model?.data
    if (!data) return nodes

    const flattedNodes = flatNodes(nodes)

    return flattedNodes.map(node => {
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

        return createVNode(
          FormItem,
          pick(node.props || {}, ['label', 'field', 'span', 'tips']),
          () => node
        )
      }
      return node
    })
  }
}
