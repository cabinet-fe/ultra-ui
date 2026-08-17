<template>
  <div
    :class="[cls.e('message'), cls.em('message', message.role), bem.is('streaming', isStreaming)]"
  >
    <!-- 用户消息：右对齐气泡 -->
    <template v-if="message.role === 'user'">
      <div :class="cls.e('message-bubble')">
        <div v-if="message.attachments?.length" :class="cls.e('message-attachments')">
          <img
            v-for="att in message.attachments"
            :key="att.dataUrl"
            :src="att.dataUrl"
            :alt="att.name"
            :class="cls.e('message-attachment')"
          />
        </div>
        <div v-if="message.content" :class="cls.e('message-text')">{{ message.content }}</div>
      </div>
    </template>

    <!-- assistant 消息 -->
    <template v-else>
      <div
        v-if="message.reasoning"
        :class="[cls.e('reasoning'), bem.is('expanded', reasoningExpanded)]"
      >
        <div :class="cls.e('reasoning-header')" @click="reasoningExpanded = !reasoningExpanded">
          <UIcon :class="[cls.e('reasoning-icon'), bem.is('loading', isThinking)]">
            <Loading v-if="isThinking" />
            <InfoCircle v-else />
          </UIcon>
          <span :class="[cls.e('reasoning-title'), isThinking && cls.e('shine')]">
            {{ isThinking ? '思考中…' : '思考过程' }}
          </span>
          <UIcon :class="cls.e('reasoning-chevron')"><ArrowRight /></UIcon>
        </div>
        <div v-show="reasoningExpanded" :class="cls.e('reasoning-content')">
          <UScroll ref="reasoningScrollRef" container-style="max-height: 220px">
            <div :class="cls.e('reasoning-text')">{{ message.reasoning }}</div>
          </UScroll>
        </div>
      </div>

      <MarkdownRender
        v-if="message.content || isStreaming"
        mode="chat"
        :class="cls.e('message-content')"
        :content="message.content"
        :final="!isStreaming"
        :fade="false"
        v-bind="rendererProps"
      />

      <ToolCallCard
        v-for="call in message.toolCalls ?? []"
        :key="call.id"
        :tool-call="call"
        @respond="(approved) => emit('respond', call.id, approved)"
      />

      <div v-if="message.status === 'error'" :class="cls.e('message-status')">生成出错</div>
      <div v-else-if="message.status === 'aborted'" :class="cls.e('message-status')">
        已停止生成
      </div>

      <div v-if="showActions" :class="cls.e('message-actions')" @click="emit('regenerate')">
        <UIcon title="重新生成"><Refresh /></UIcon>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import { ArrowRight, InfoCircle, Loading, Refresh } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import MarkdownRender from 'markstream-vue'
import { computed, inject, nextTick, ref, useTemplateRef, watch } from 'vue'

import type { ChatMessage } from '../../chat/types'
import { AiChatDIKey } from './di'
import ToolCallCard from './tool-call.vue'

defineOptions({ name: 'UAiChatMessageItem' })

const props = defineProps<{
  message: ChatMessage
  /** 是否为最后一条可见消息（决定是否显示重新生成） */
  isLast: boolean
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const isStreaming = computed(() => props.message.status === 'streaming')
/** 思考中：流式且正文还未开始输出 */
const isThinking = computed(() => isStreaming.value && !props.message.content)

const reasoningExpanded = ref(true)

// 流式结束后自动折叠思考过程
watch(
  () => props.message.status,
  (status) => {
    if (status === 'streaming') {
      reasoningExpanded.value = true
    } else if (status) {
      reasoningExpanded.value = false
    }
  }
)

/** 思考内容滚动区：流式输出时吸附底部，始终展示最新思考 */
const reasoningScrollRef = useTemplateRef<InstanceType<typeof UScroll>>('reasoningScrollRef')

watch(
  () => props.message.reasoning,
  async () => {
    if (!isThinking.value || !reasoningExpanded.value) return
    await nextTick()
    reasoningScrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
  }
)

const showActions = computed(() => {
  if (props.message.role !== 'assistant' || !props.isLast) return false
  return ['done', 'error', 'aborted'].includes(props.message.status ?? '')
})
</script>
