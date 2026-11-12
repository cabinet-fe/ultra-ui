<template>
  <!-- 无自定义渲染且尚无结果时不在回复流产出内容（过程由步骤行承载） -->
  <div v-if="hasBody" :class="cls.e('reply-tool')">
    <!-- 自定义渲染：meta.render / tool-<name> 插槽（语义同卡片 body）；均未提供时兜底标准工具卡片 -->
    <component :is="tool?.render" v-if="tool?.render" :tool-call="toolCall" />
    <component :is="slotBody" v-else-if="slotBody && hasResult" />
    <ToolCallCard v-else :tool-call="toolCall" @respond="(approved) => emit('respond', approved)" />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { AiChatDIKey } from './di'
import { useToolCallBrief } from './tool-call-brief'
import ToolCallCard from './tool-call.vue'

defineOptions({ name: 'UAiChatReplyTool' })

const props = defineProps<{ toolCall: ChatToolCall }>()

const emit = defineEmits<{ (e: 'respond', approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const { tool } = useToolCallBrief(() => props.toolCall)

const hasResult = computed(() => props.toolCall.result != null || props.toolCall.error != null)

/** 使用方通过 tool-<name> 插槽自定义展示（语义同卡片：有结果时替换默认渲染） */
const slotBody = computed(() => {
  const slot = di?.slots[`tool-${props.toolCall.name}`]
  return slot ? () => slot({ toolCall: props.toolCall }) : undefined
})

/** 是否在回复流产出内容：自定义渲染随调用实时展示（加载态等），兜底卡片仅在有结果时出现 */
const hasBody = computed(() => !!tool.value?.render || hasResult.value)
</script>
