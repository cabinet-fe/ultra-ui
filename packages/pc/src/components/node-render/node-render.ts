import {
  type DefineComponent,
  type VNode,
  type VNodeArrayChildren,
  cloneVNode,
  defineComponent,
  isVNode,
  mergeProps,
  useAttrs
} from 'vue'

const NodeRender: DefineComponent<{
  content:
    | null
    | undefined
    | VNodeArrayChildren
    | VNode
    | string
    | number
    | boolean
}> = defineComponent({
  name: 'NodeRender',

  inheritAttrs: false,

  props: ['content'],

  setup(props, { slots }) {
    const attrs = useAttrs()

    return () => {
      const { content } = props

      if (content === undefined) {
        return slots.default?.()
      }

      if (Array.isArray(content)) {
        return content
      }

      if (isVNode(content)) {
        const hasAttrs = attrs && Object.keys(attrs).length > 0
        if (!hasAttrs) {
          return content
        }
        return cloneVNode(content, mergeProps(content.props ?? {}, attrs))
      }

      return content
    }
  }
})

export default NodeRender
