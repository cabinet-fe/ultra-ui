<template>
  <div :class="[cls.e('message'), cls.em('message', message.role)]">
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

    <!-- assistant 消息：思考与工具调用由步骤行承载，这里只渲染正文 / 状态 / 操作 -->
    <template v-else>
      <MarkdownRender
        v-if="message.content || isStreaming"
        mode="chat"
        :content="message.content"
        :final="!isStreaming"
        :fade="false"
        v-bind="rendererProps"
      />

      <div v-if="message.status === 'error'" :class="cls.e('message-status')">生成出错</div>
      <div v-else-if="message.status === 'aborted'" :class="cls.e('message-status')">
        已停止生成
      </div>

      <div v-if="showActions" :class="cls.e('message-actions')">
        <span v-if="duration != null" :class="cls.e('message-duration')">
          用时 {{ formatDuration(duration) }}
        </span>
        <UButton
          size="small"
          plain
          circle
          :type="copied ? 'success' : 'primary'"
          :icon="copied ? CircleCheck : Copy"
          :disabled="!canCopy"
          :title="copied ? '已复制' : '复制'"
          @click="handleCopy"
        />
        <UButton
          size="small"
          plain
          circle
          type="primary"
          :icon="Refresh"
          title="重新生成"
          @click="emit('regenerate')"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { message as toast, UButton } from '@veltra/desktop'
import { CircleCheck, Copy, Refresh } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import MarkdownRender from 'markstream-vue'
import { computed, inject, onBeforeUnmount, ref } from 'vue'

import type { ChatMessage } from '../../chat/types'
import { AiChatDIKey } from './di'
import { formatDuration } from './format-duration'

defineOptions({ name: 'UAiChatMessageItem' })

const props = defineProps<{
  message: ChatMessage
  /** 是否为最后一条可见消息（决定是否显示重新生成） */
  isLast: boolean
  /** 本轮总用时（ms；仅 live 轮次有，历史回放无计时数据） */
  duration?: number
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{ (e: 'regenerate'): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const isStreaming = computed(() => props.message.status === 'streaming')

const showActions = computed(() => {
  if (props.message.role !== 'assistant' || !props.isLast) return false
  return ['done', 'error', 'aborted'].includes(props.message.status ?? '')
})

const canCopy = computed(() => !!props.message.content?.trim())

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const handleCopy = async () => {
  const text = props.message.content?.trim()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    toast.success('已复制到剪贴板')
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.error('复制失败，请检查浏览器权限')
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>
