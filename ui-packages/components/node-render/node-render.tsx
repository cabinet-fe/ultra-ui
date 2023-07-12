import { PropType, VNode, cloneVNode, defineComponent } from 'vue'

export default defineComponent({
  name: 'UNodeRender',

  props: {
    content: {
      type: [Object, Array] as PropType<
        null | undefined | Array<VNode> | VNode
      >
    }
  },
  setup(props, { attrs }) {
    return () => {
      if (!props.content) return null
      if (Array.isArray(props.content)) {
        return props.content
      }
      return cloneVNode(props.content, attrs, true)
    }
  }
})
