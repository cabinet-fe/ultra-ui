<template>
  <p :class="classList" :style="style">
    <template v-for="(chunk, i) of chunks" :key="i">
      <mark v-if="chunk.highlight">{{ chunk.text }}</mark>
      <template v-else>{{ chunk.text }}</template>
    </template>
  </p>
</template>

<script lang="ts" setup>
import { getHighlightChunks, isTextNode, withUnit } from '@veltra/utils'
import { type CSSProperties, computed, useSlots } from 'vue'

import { bem } from '../../shared/bem'
import type { TextProps } from '../../types/text'

// Text 是 Vue 保留组件名（vue/no-reserved-component-names），与 desktop 一致带 U 前缀
defineOptions({ name: 'UText' })

const {
  as = 'content',
  fontSize,
  deleted,
  underline,
  bold,
  italic,
  highlight
} = defineProps<TextProps>()

const cls = bem('text')

const classList = computed(() => {
  return [cls.b, bem.is(as), bem.is('bold', bold), bem.is('italic', italic)]
})

const style = computed<CSSProperties>(() => {
  const style: CSSProperties = { fontSize: withUnit(fontSize, 'px') }

  if (deleted) {
    style.textDecoration = 'line-through'
  }
  if (underline) {
    style.textDecoration = 'underline'
  }

  return style
})

const slots = useSlots()

/** 只渲染文本节点；传 highlight 时按关键词切分为高亮块 */
const chunks = computed(() => {
  const text = (slots.default?.() ?? [])
    .filter(isTextNode)
    .map((node) => String(node.children))
    .join('')

  if (!text) return []
  if (!highlight) return [{ text }]

  return getHighlightChunks(text, [highlight].flat())
})
</script>
