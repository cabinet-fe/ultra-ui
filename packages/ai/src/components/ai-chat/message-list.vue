<template>
  <UScroll :class="cls.e('list')" ref="scrollRef" always @scroll="handleScroll">
    <div v-if="!visibleMessages.length" :class="cls.e('welcome')">
      <slot name="welcome">
        <div :class="cls.e('welcome-inner')">
          <UAiOrb :size="92" />
          <div v-if="welcome" :class="cls.e('welcome-text')">{{ welcome }}</div>
        </div>
      </slot>
    </div>

    <MessageItem
      v-for="(msg, index) in visibleMessages"
      :key="msg.id"
      :message="msg"
      :is-last="index === visibleMessages.length - 1"
      :renderer-props="rendererProps"
      @respond="(id, approved) => emit('respond', id, approved)"
      @regenerate="emit('regenerate')"
    />
  </UScroll>
</template>

<script lang="ts" setup>
import { UScroll } from '@veltra/desktop'
import type { ScrollPosition } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue'

import type { ChatMessage } from '../../chat/types'
import UAiOrb from '../ai-orb/ai-orb.vue'
import { AiChatDIKey } from './di'
import MessageItem from './message-item.vue'

defineOptions({ name: 'UAiChatMessageList' })

const props = defineProps<{
  messages: ChatMessage[]
  /** 空状态欢迎语 */
  welcome?: string
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
}>()

defineSlots<{
  /** 空状态欢迎区插槽 */
  welcome(): any
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

const scrollRef = shallowRef<{ scrollTo: (position: ScrollPosition) => void }>()
/** 是否吸附底部（用户上翻浏览历史时取消吸附） */
const stickToBottom = ref(true)

const handleScroll = (position: Required<ScrollPosition>) => {
  stickToBottom.value = position.sh - position.ch - position.y < 60
}

// 消息数量或流式内容变化时，若处于吸附状态则滚动到底部
watch(
  () => {
    const list = visibleMessages.value
    const last = list[list.length - 1]
    return [
      list.length,
      last?.content.length ?? 0,
      last?.reasoning?.length ?? 0,
      last?.toolCalls?.length ?? 0
    ].join('|')
  },
  async () => {
    if (!stickToBottom.value) return
    await nextTick()
    scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
  }
)
</script>
