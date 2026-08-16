<template>
  <div :class="cls.b">
    <MessageList
      :messages="messages"
      :welcome="welcome"
      :renderer-props="rendererProps"
      @respond="respondToolCall"
      @regenerate="regenerate"
    >
      <template v-if="$slots.welcome" #welcome>
        <slot name="welcome" />
      </template>
    </MessageList>

    <QueueList
      :queue="queue"
      @start-now="startQueued"
      @edit="handleQueueEdit"
      @remove="removeQueued"
    />

    <ChatInput
      ref="chatInputRef"
      v-model:model="model"
      v-model:reasoning-level="reasoningLevel"
      :running="running"
      :models="models"
      :placeholder="placeholder"
      :accept="accept"
      :max-attachment-size="maxAttachmentSize"
      @send="handleSend"
      @abort="abort"
    />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, provide, ref, useSlots, useTemplateRef } from 'vue'

import type { ChatAttachment, ChatToolCall } from '../../chat/types'
import { useChat } from '../../chat/use-chat'
import { createBuiltinTools } from '../../tools'
import type { _AiChatExposed, AiChatEmits, AiChatProps } from '../../types'
import ChatInput from './chat-input.vue'
import { AiChatDIKey } from './di'
import MessageList from './message-list.vue'
import QueueList from './queue-list.vue'

defineOptions({ name: 'UAiChat' })

const props = defineProps<AiChatProps>()

const emit = defineEmits<AiChatEmits>()

defineSlots<{
  /** 空状态欢迎区插槽 */
  welcome(): any
  /** 按工具名自定义工具结果展示，如 tool-getWeather */
  [name: `tool-${string}`]: (scope: { toolCall: ChatToolCall }) => any
}>()

const cls = bem('ai-chat')

const slots = useSlots()

/** 内置 + 用户工具（同名内置优先），供工具卡片解析 icon/label/render/autoCollapse */
const toolMap = computed(() => {
  const builtins = createBuiltinTools()
  const names = new Set(builtins.map((t) => t.name))
  const tools = [...builtins, ...(props.tools ?? []).filter((t) => !names.has(t.name))]
  return Object.fromEntries(tools.map((t) => [t.name, t]))
})

provide(AiChatDIKey, { cls, slots, tools: toolMap })

const {
  messages,
  model,
  reasoningLevel,
  running,
  queue,
  send,
  abort,
  regenerate,
  clear,
  respondToolCall,
  enqueue,
  startQueued,
  removeQueued
} = useChat({ props, emit })

const chatInputRef = useTemplateRef<InstanceType<typeof ChatInput>>('chatInputRef')

/**
 * 编辑中的队列项原后继 id（编辑态标记）：
 * undefined 表示无编辑；null 表示原位置在队尾；否则重新提交时插回该后继之前，
 * 使前后项顺序不受编辑影响（前项已执行则该项自然成为最前待执行项）。
 */
const editingSuccessor = ref<string | null | undefined>(undefined)

/** 编辑队列项：取回输入框重新编辑；已有未完成编辑时先按锚点还原，避免内容丢失 */
const handleQueueEdit = (id: string) => {
  restoreEditing()

  const index = queue.value.findIndex((item) => item.id === id)
  if (index === -1) return
  editingSuccessor.value = queue.value[index + 1]?.id ?? null

  const item = removeQueued(id)
  if (item) chatInputRef.value?.setContent(item.content)
}

/** 将输入框中未提交的编辑内容按原锚点插回队列 */
const restoreEditing = () => {
  if (editingSuccessor.value === undefined) return
  const content = chatInputRef.value?.getContent().trim()
  if (content) enqueue(content, undefined, editingSuccessor.value ?? undefined)
  editingSuccessor.value = undefined
}

const handleSend = (content: string, attachments: ChatAttachment[]) => {
  // 编辑态提交：插回原锚点位置（会话进行中则留在队列，空闲时由 enqueue 自动消耗队首）
  if (editingSuccessor.value !== undefined) {
    enqueue(content, attachments, editingSuccessor.value ?? undefined)
    editingSuccessor.value = undefined
    return
  }
  send(content, attachments)
}

defineExpose<_AiChatExposed>({
  send,
  abort,
  regenerate,
  clear,
  queue,
  startQueued,
  removeQueued,
  enqueue
})
</script>
