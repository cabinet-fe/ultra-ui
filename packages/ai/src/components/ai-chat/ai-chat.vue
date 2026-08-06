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
      v-model:model="model"
      v-model:reasoning-level="reasoningLevel"
      :running="running"
      :models="models"
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
import { computed, provide, useSlots } from 'vue'

import type { ChatToolCall } from '../../chat/types'
import { useChat } from '../../chat/use-chat'
import { createBuiltinTools } from '../../tools'
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
  send,
  abort,
  regenerate,
  clear,
  respondToolCall
} = useChat({ props, emit })

defineExpose<_AiChatExposed>({ send, abort, regenerate, clear })
</script>
