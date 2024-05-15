import {
  type PropType,
  type VNode,
  type VNodeArrayChildren,
  defineComponent,
  isVNode
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
        if (content.props) {
          Object.assign(content.props, attrs)
        } else {
          content.props = attrs
        }

        return content
      }
      return props.content
    }
  }
})
