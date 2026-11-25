<template>
  <!-- 无自定义渲染且尚无结果时不在回复流产出内容（过程由步骤行承载） -->
  <div v-if="hasBody" :class="cls.e('reply-tool')">
    <!-- 自定义渲染：meta.render / tool-<name> 插槽（语义同卡片 body）；均未提供时兜底标准工具卡片 -->
    <component :is="resolvedTool.render" v-if="resolvedTool?.render" :tool-call="toolCall" />
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

/** 使用方通过 tool-<name> 插槽自定义展示（语义同卡片：有结果时替换默认渲染） */
const slotBody = computed(() => {
  const slot = di?.slots?.[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})

/** 是否在回复流产出内容：自定义渲染随调用实时展示（加载态等），兜底卡片仅在有结果时出现 */
const hasBody = computed(() => !!resolvedTool.value?.render || hasResult.value)
</script>
