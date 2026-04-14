# use-component-props

```typescript
import { extractNormalVNodes } from '@veltra/utils'
import { defineComponent, isRef, type MaybeRef, createVNode, cloneVNode, type Component } from 'vue'

/**
 * 生成一个用于设置组件通用属性的组件
 * @param props 组件通用的属性
 * @returns
 */
export function useComponentProps<T extends Record<string, any>>(
  props: MaybeRef<T & Record<string, any>>
): Component {
  return defineComponent({
    name: 'ComponentCommonProps',
    inheritAttrs: false,

    props: {
      /** 渲染一个标准html5标签 */
      tag: { type: String }
    },

    setup(componentProps, { slots, attrs }) {
      const isPropsRef = isRef(props)
      // 非 ref 时 keys 固定，缓存避免每次 render 重复计算
      const staticKeys = isPropsRef ? null : Object.keys(props)

      const mergeNodesProps = (commonProps: Record<string, any>) => {
        const nodes = extractNormalVNodes(slots.default?.() ?? [])
        if (!nodes?.length) return undefined

        const keys = staticKeys ?? Object.keys(commonProps)
        return nodes.map((node) => {
          const mergedProps: Record<string, any> = {}
          let count = 0
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i]!
            // node中已定义的属性优先
            if (node.props?.[key] !== undefined) continue
            mergedProps[key] = attrs[key] !== undefined ? attrs[key] : commonProps[key]
            count++
          }
          return count > 0 ? cloneVNode(node, mergedProps) : node
        })
      }

      return () => {
        const _props = isPropsRef ? props.value : props
        const nodes = mergeNodesProps(_props)

        if (componentProps.tag) {
          if (!nodes) return undefined
          const tagProps = Object.keys(attrs).reduce<Record<string, any>>((acc, cur) => {
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
```
