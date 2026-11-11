<template>
  <span v-if="node.type === 'empty'" :class="[cls.e('tool-data-value'), bem.is('muted')]">—</span>

  <span v-else-if="node.type === 'scalar'" :class="[cls.e('tool-data-value'), bem.is(node.tone)]">{{
    node.text
  }}</span>

  <pre
    v-else-if="node.type === 'text'"
    :class="[cls.e('tool-data-text'), bem.is('code', node.code)]"
    >{{ shownText }}</pre>

  <div v-else-if="node.type === 'chips'" :class="cls.e('tool-data-chips')">
    <span
      v-for="(item, index) in node.items"
      :key="index"
      :class="cls.e('tool-data-chip')"
      :title="item"
    >
      {{ item }}
    </span>
  </div>

  <div
    v-else-if="node.type === 'fields'"
    :class="[cls.e('tool-data-fields'), bem.is('nested', depth > 0)]"
  >
    <div v-for="field in node.fields" :key="field.key" :class="cls.e('tool-data-field')">
      <span :class="cls.e('tool-data-key')" :title="field.key">{{ field.label }}</span>
      <div :class="cls.e('tool-data-field-value')">
        <ToolNode :node="field.value" :depth="depth + 1" />
      </div>
    </div>
  </div>

  <ol v-else-if="node.type === 'list'" :class="cls.e('tool-data-list')">
    <li v-for="(item, index) in node.items" :key="index" :class="cls.e('tool-data-list-item')">
      <span :class="cls.e('tool-data-list-index')">{{ index + 1 }}</span>
      <div :class="cls.e('tool-data-list-body')">
        <ToolNode :node="item" :depth="depth + 1" />
      </div>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import { AiChatDIKey } from './di'
import type { ToolNode as ToolNodeValue } from './tool-format'
import { clipText, TOOL_TEXT_PREVIEW } from './tool-format'

defineOptions({ name: 'UAiChatToolNode' })

const { node, depth = 0 } = defineProps<{
  node: ToolNodeValue
  /** 嵌套深度：>0 时字段区加引导线，避免层级看起来像同级 */
  depth?: number
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** 嵌套文本节点始终单行化 + 截断（无展开入口），完整内容走区块级「原始」 */
const shownText = computed(() =>
  node.type === 'text' ? clipText(node.text, TOOL_TEXT_PREVIEW.nested) : ''
)
</script>
