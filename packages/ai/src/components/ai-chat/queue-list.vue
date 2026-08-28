<template>
  <div v-if="queue.length" :class="cls.e('queue')">
    <div :class="cls.e('queue-head')">待发送队列 · {{ queue.length }}</div>
    <div v-for="item in queue" :key="item.id" :class="cls.e('queue-item')">
      <span :class="cls.e('queue-text')" :title="item.content">{{ item.content }}</span>
      <span v-if="!readonly" :class="cls.e('queue-actions')">
        <button
          type="button"
          :class="[cls.e('queue-action'), cls.em('queue-action', 'primary')]"
          title="中断当前会话，立即执行该条"
          @click="emit('start-now', item.id)"
        >
          <UIcon><CaretRight /></UIcon>立即开始
        </button>
        <button
          type="button"
          :class="cls.e('queue-action')"
          title="取回输入框编辑"
          @click="emit('edit', item.id)"
        >
          <UIcon><EditPen /></UIcon>
        </button>
        <button
          type="button"
          :class="cls.e('queue-action')"
          title="移出队列"
          @click="emit('remove', item.id)"
        >
          <UIcon><Close /></UIcon>
        </button>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UIcon } from '@veltra/desktop'
import { CaretRight, Close, EditPen } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { inject } from 'vue'

import type { ChatQueuedMessage } from '../../chat/types'
import { AiChatDIKey } from './di'

defineOptions({ name: 'UAiChatQueueList' })

defineProps<{
  /** 待发送队列（按执行顺序排列） */
  queue: ChatQueuedMessage[]
  /** 只读时不展示插队 / 编辑 / 移除 */
  readonly?: boolean
}>()

const emit = defineEmits<{
  /** 立即开始：中断当前会话并插队执行 */
  (e: 'start-now', id: string): void
  /** 编辑：取回输入框重新编辑 */
  (e: 'edit', id: string): void
  /** 移出队列 */
  (e: 'remove', id: string): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')
</script>
