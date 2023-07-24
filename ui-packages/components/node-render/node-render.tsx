import { type PropType, type VNode, type VNodeArrayChildren, cloneVNode, defineComponent, isVNode } from 'vue'

export default defineComponent({
  name: 'UNodeRender',

  props: {
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
  setup(props, { attrs }) {
    return () => {
      if (!props.content) return null
      if (Array.isArray(props.content)) {
        return props.content
      }
      if (isVNode(props.content)) {
        cloneVNode(props.content, attrs, true)
      }
      return props.content
    }
  }
})
