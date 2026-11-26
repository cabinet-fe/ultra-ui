<template>
  <div :class="cls.e('reply-tool')">
    <!-- 自定义渲染：meta.render / 关联 session 提问 / tool-<name> 插槽；均未提供时兜底标准工具卡片 -->
    <component :is="resolvedTool.render" v-if="resolvedTool?.render" :tool-call="toolCall" />
    <AskQuestionRender v-else-if="isLinkedQuestion" :tool-call="toolCall" />
    <component :is="slotBody" v-else-if="slotBody && hasResult" />
    <UAiToolCall
      v-else
      :tool-call="toolCall"
      :tool="resolvedTool"
      :tool-icons="toolIcons"
      @respond="(approved) => emit('respond', approved)"
      @open-panel="(id) => emit('open-panel', id)"
    />
  </div>
</template>

<script lang="ts" setup>
import './style'
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'
import type { Component } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../../chat/types'
import { AskQuestionRender } from '../../tools/ask-question'
import { AiChatDIKey } from '../_shared/di'
import { useToolCallBrief } from '../_shared/tool-call-brief'
import { UAiToolCall } from '../ai-tool-call'

defineOptions({ name: 'UAiMessageListReplyTool' })

const props = defineProps<{
  toolCall: ChatToolCall
  tool?: ChatTool | ChatToolMeta
  toolIcons?: Record<string, Component>
}>()

const emit = defineEmits<{
  (e: 'respond', approved: boolean): void
  (e: 'open-panel', toolCallId: string): void
}>()

const cls = bem('ai-message-list')
const di = inject(AiChatDIKey, undefined)

const { tool: resolvedTool } = useToolCallBrief(() => props.toolCall, {
  tool: () => props.tool,
  toolIcons: () => props.toolIcons
})

const hasResult = computed(() => props.toolCall.result != null || props.toolCall.error != null)

const isLinkedQuestion = computed(() => Boolean(di?.questionCalls?.value?.[props.toolCall.id]))

/** 使用方通过 tool-<name> 插槽自定义展示（语义同卡片：有结果时替换默认渲染） */
const slotBody = computed(() => {
  const slot = di?.slots?.[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})
</script>
