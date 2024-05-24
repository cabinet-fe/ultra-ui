import {
  type PropType,
  type VNode,
  type VNodeArrayChildren,
  defineComponent,
  isVNode,
  mergeProps
} from 'vue'

export default defineComponent({
  name: 'NodeRender',

  inheritAttrs: false,

  props: {
    /** 渲染内容 */
    content: {
      type: [Object, Array, String, Boolean, Number] as PropType<
        | null
        | undefined
        | VNodeArrayChildren
        | VNode
        | string
        | number
        | boolean
      >
    }
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { content } = props

      if (!content) {
        return slots.default?.()
      }

      if (Array.isArray(content)) {
        return content
      }

      if (isVNode(content)) {
        content.props = attrs ? mergeProps(content.props ?? {}, attrs) : props
        return content
      }
      return props.content
    }
  }
})
