<template>
  <div :class="cls.e('tool-call-json')">
    <div :class="cls.e('tool-call-json-head')">
      <span :class="cls.e('tool-call-section')">{{ title }}</span>
      <UButton
        v-if="overLimit"
        :class="cls.e('tool-call-json-toggle')"
        size="small"
        text
        type="primary"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起' : '展开' }}
      </UButton>
    </div>
    <pre :class="[cls.e('tool-call-code'), bem.is('truncated', overLimit && !expanded)]">{{
      shown
    }}</pre>
  </div>
</template>

<script lang="ts" setup>
import { UButton } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject, ref } from 'vue'

import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatToolJson' })

/** 超过该字符数截断，展开后可见全文 */
const PREVIEW_LIMIT = 480

const { title, text } = defineProps<{
  /** 区块标题（参数 / 结果 / 视图） */
  title: string
  /** 已格式化的 JSON 或原文 */
  text: string
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const expanded = ref(false)

const overLimit = computed(() => text.length > PREVIEW_LIMIT)

const shown = computed(() => {
  if (expanded.value || !overLimit.value) return text
  return `${text.slice(0, PREVIEW_LIMIT)}…`
})
</script>
