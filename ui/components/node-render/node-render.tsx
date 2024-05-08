import {
  type PropType,
  type VNode,
  type VNodeArrayChildren,
  cloneVNode,
  defineComponent,
  isVNode
} from 'vue'

export default defineComponent({
  name: 'NodeRender',

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
      if (!props.content) {
        return slots.default?.()
      }
      if (Array.isArray(props.content)) {
        return props.content
      }

      if (isVNode(props.content)) {
        return cloneVNode(props.content, attrs, true)
      }
      return props.content
    }
  }
})
