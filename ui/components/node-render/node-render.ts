import {
  type DefineComponent,
  type VNode,
  type VNodeArrayChildren,
  defineComponent,
  isVNode,
  mergeProps
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

  render() {
    const { content, $slots, $attrs, $props } = this

    if (content === undefined) {
      return $slots.default?.()
    }

    if (Array.isArray(content)) {
      return content
    }

    if (isVNode(content)) {
      content.props = $attrs ? mergeProps(content.props ?? {}, $attrs) : $props
      return content
    }

    return content
  }
})

export default NodeRender
