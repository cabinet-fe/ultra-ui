import type { FormProps } from '@ui/types/components/form'
import {
  useSlots,
  h,
  type VNode,
  createTextVNode,
  type VNodeArrayChildren,
  isVNode
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
      if (node.props?.field) {
        const field = node.props.field
        node.props.modelValue = data[field]

        const modelUpdater = node.props['onUpdate:modelValue']
        if (modelUpdater) {
          node.props['onUpdate:modelValue'] = [
            ...(typeof modelUpdater === 'function'
              ? [modelUpdater]
              : modelUpdater),
            (value: any) => {
              data[field] = value
            }
          ]
        } else {
          node.props['onUpdate:modelValue'] = (value: any) => {
            data[field] = value
          }
        }
      }

      // 自定义表单项
      // @ts-ignore
      if (node.type?.name !== 'FormItem') {
        return h(
          FormItem,
          pick(node.props || {}, ['label', 'field', 'span', 'tips']),
          () => node
        )
      }
      return node
    })
  }
}
