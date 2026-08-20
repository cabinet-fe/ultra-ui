<template>
  <div :class="[cls.e('process'), bem.is('expanded', expanded)]">
    <div :class="cls.e('process-header')" @click="expanded = !expanded">
      <UIcon :class="cls.e('process-icon')"><CircleCheck /></UIcon>
      <span :class="cls.e('process-title')">已完成</span>
      <UIcon :class="cls.e('process-chevron')"><ArrowRight /></UIcon>
    </div>
    <!-- 折叠时完全卸载过程 DOM：历史轮次的思考/工具卡片可能很多，常驻挂载浪费渲染成本 -->
    <div v-if="expanded" :class="cls.e('process-content')">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :is-last="false"
        :renderer-props="rendererProps"
        @respond="(id, approved) => emit('respond', id, approved)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@veltra/desktop'
import { ArrowRight, CircleCheck } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject, ref } from 'vue'

import type { ChatMessage } from '../../chat/types'
import { AiChatDIKey } from './di'
import MessageItem from './message-item.vue'

defineOptions({ name: 'UAiChatTurnProcess' })

defineProps<{
  /** 本轮最终答案之前的过程消息（思考 + 中间文本 + 工具卡片） */
  messages: ChatMessage[]
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'respond', toolCallId: string, approved: boolean): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const expanded = ref(false)
</script>
