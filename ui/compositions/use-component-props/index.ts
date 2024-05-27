import { defineComponent, isRef, type MaybeRef, createVNode } from 'vue'

/**
 * 生成一个用于设置组件通用属性的组件
 * @param props 组件通用的属性
 * @returns
 */
export function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T & Record<string, any>>
) {
  return defineComponent({
    name: 'ComponentCommonProps',
    inheritAttrs: false,

    props: {
      /** 渲染一个标准html5标签 */
      tag: {
        type: String
      }
    },

    setup(componentProps, { slots, attrs }) {
      /**
       * 合并VNode的属性
       */
      const mergeNodesProps = (props: Record<string, any>) => {
        if (!props) {
          console.error('mergeNodesProps期望有1个参数props, 此处为0个')
          return undefined
        }
        const nodes = slots.default?.()
        if (!nodes?.length) return undefined

        let i = 0
        while (i < nodes.length) {
          const node = nodes[i]!

          if (!node.props) {
            node.props = {}
          }
          Object.keys(props).forEach(key => {
            node.props![key] = props[key]
            if (attrs[key] !== undefined) {
              node.props![key] = attrs[key]
            }
          })
          i++
        }

        return nodes
      }

      return () => {
        const _props = isRef(props) ? props.value : props
        const nodes = mergeNodesProps(_props)

        if (componentProps.tag) {
          const tagProps = Object.keys(attrs).reduce((acc, cur) => {
            if (!(cur in _props)) {
              acc[cur] = attrs[cur]
            }
            return acc
          }, {})
          return createVNode(componentProps.tag, tagProps, nodes)
        }
        return nodes
      }
    }
  })
}
