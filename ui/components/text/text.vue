<template>
  <p :class="classList" :style="style">
    <UNodeRender :content="getTextVNode()" ref="aa" />
  </p>
</template>

<script lang="ts" setup>
import {
  type CSSProperties,
  type VNode,
  computed,
  useSlots,
  h,
  createTextVNode
} from 'vue'
import type { TextProps } from '@ui/types/components/text'
import { bem, withUnit, isTextNode, getHighlightChunks } from '@ui/utils'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Text'
})

const props = withDefaults(defineProps<TextProps>(), {
  as: 'content'
})

const cls = bem('text')

const classList = computed(() => {
  return [
    cls.b,
    bem.is(props.as),
    bem.is('bold', props.bold),
    bem.is('italic', props.italic)
  ]
})

const style = computed(() => {
  const style: CSSProperties = {
    fontSize: withUnit(props.fontSize, 'px')
  }
  const { deleted, underline } = props
  if (deleted) {
    style.textDecoration = 'line-through'
  }
  if (underline) {
    style.textDecoration = 'underline'
  }

  return style
})

const slots = useSlots()
const getTextVNode = () => {
  const nodes = slots.default?.()
  if (!nodes?.length) return undefined

  // 只允许渲染文本
  const textNodes = nodes.filter(node => isTextNode(node))

  const { highlight } = props

  if (!highlight) {
    return textNodes
  }

  return textNodes.reduce((nodes, textNode) => {
    const chunks = getHighlightChunks(
      textNode.children as string,
      Array.isArray(highlight) ? highlight : [highlight]
    )

    chunks.forEach(chunk => {
      if (chunk.highlight) {
        nodes.push(h('mark', chunk.text))
      } else {
        nodes.push(createTextVNode(chunk.text))
      }
    })

    return nodes
  }, [] as VNode[])
}
</script>
