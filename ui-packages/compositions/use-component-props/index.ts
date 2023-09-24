import {
  defineComponent,
  isRef,
  shallowRef,
  type VNode,
  type MaybeRef,
  watchEffect,
  h
} from 'vue'

/**
 * 生成一个用于设置组件通用属性的组件
 * @param props 组件通用的属性
 * @returns
 */
export function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T>
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

    setup(componentProps, { slots }) {
      const nodes = shallowRef<VNode[]>()

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
          if (node.props) {
            Object.keys(props).forEach(key => {
              node.props![key] = props[key]
            })
          } else {
            node.props = props
          }
          i++
        }

        return nodes
      }

      // 传入的值如果是动态值则需要重新渲染VNode
      watchEffect(() => {
        nodes.value = mergeNodesProps(isRef(props) ? props.value : props)
      })

      return () => {
        if (componentProps.tag) {
          return h(componentProps.tag, nodes.value)
        }
        return nodes.value
      }
    }
  })
}
