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

    <ChatInput
      :running="running"
      :placeholder="placeholder"
      :accept="accept"
      :max-attachment-size="maxAttachmentSize"
      @send="send"
      @abort="abort"
    />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { provide, useSlots } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { useChat } from '../../chat/use-chat'
import type { _AiChatExposed, AiChatEmits, AiChatProps } from '../../types'
import ChatInput from './chat-input.vue'
import { AiChatDIKey } from './di'
import MessageList from './message-list.vue'

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

provide(AiChatDIKey, { cls, slots })

const { messages, running, send, abort, regenerate, clear, respondToolCall } = useChat({
  props,
  emit
})

defineExpose<_AiChatExposed>({ send, abort, regenerate, clear })
</script>
