<template>
  <div :class="[cls.b, cls.m(message.role)]">
    <template v-if="message.role === 'user'">
      <div :class="cls.e('bubble')">
        <UAiAttachments
          v-if="message.attachments?.length"
          :class="cls.e('attachments')"
          :items="message.attachments"
          size="default"
          @preview="handlePreview"
        />
        <div v-if="message.content" :class="cls.e('text')">{{ message.content }}</div>
      </div>
    </template>

    <!-- assistant（及非 user）消息：只渲染正文 / 状态 / 操作 -->
    <template v-else>
      <slot :message="message" :content="renderedContent" :streaming="isStreaming">
        <MarkdownRender
          v-if="renderedContent || isStreaming"
          mode="chat"
          :content="renderedContent"
          :final="!isStreaming"
          :fade="false"
          v-bind="rendererProps"
        />
      </slot>

      <div v-if="message.status === 'error'" :class="cls.e('status')">生成出错</div>
      <div v-else-if="message.status === 'aborted'" :class="cls.e('status')">已停止生成</div>

      <div v-if="actionsVisible" :class="cls.e('actions')">
        <slot
          name="actions"
          :message="message"
          :duration="duration"
          :copied="copied"
          :can-copy="canCopy"
          :copy="handleCopy"
          :regenerate="handleRegenerate"
        >
          <span v-if="duration != null" :class="cls.e('duration')">
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
            v-if="showRegenerate"
            size="small"
            plain
            circle
            type="primary"
            :icon="Refresh"
            title="重新生成"
            @click="handleRegenerate"
          />
        </slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { message as toast, UButton } from '@veltra/desktop'
import { CircleCheck, Copy, Refresh } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import MarkdownRender from 'markstream-vue'
import { computed, getCurrentInstance, inject, onBeforeUnmount, ref } from 'vue'

import type { ChatAttachment, ChatMessage } from '../../chat/types'
import type { AiBubbleEmits, AiBubbleProps } from '../../types'
import { AiChatDIKey } from '../_shared/di'
import { formatDuration } from '../_shared/format-duration'
import { useStreamThrottle } from '../_shared/use-stream-throttle'
import { UAiAttachments } from '../ai-attachments'

defineOptions({ name: 'UAiBubble' })

const props = withDefaults(defineProps<AiBubbleProps>(), {
  isLast: false,
  showActions: undefined,
  showRegenerate: true
})

const emit = defineEmits<AiBubbleEmits>()

defineSlots<{
  default(scope: { message: ChatMessage; content: string; streaming: boolean }): any
  actions(scope: {
    message: ChatMessage
    duration?: number
    copied: boolean
    canCopy: boolean
    copy: () => void
    regenerate: () => void
  }): any
}>()

const cls = bem('ai-bubble')
const di = inject(AiChatDIKey, undefined)
const instance = getCurrentInstance()

const isStreaming = computed(() => props.message.status === 'streaming')

const renderedContent = useStreamThrottle(
  () => props.message.content,
  () => isStreaming.value
)

const actionsVisible = computed(() => {
  if (props.showActions !== undefined) return props.showActions
  return (
    props.message.role === 'assistant' &&
    props.isLast &&
    ['done', 'error', 'aborted'].includes(props.message.status ?? '')
  )
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
    emit('copy', text)
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.error('复制失败，请检查浏览器权限')
  }
}

const handleRegenerate = () => {
  emit('regenerate')
}

/** 图片预览：优先派发 preview-image 事件；未显式监听时回落 DI 全屏图片预览 */
const handlePreview = (att: ChatAttachment) => {
  emit('preview-image', att.dataUrl, att.name)
  const vnodeProps = instance?.vnode.props
  if (!vnodeProps?.onPreviewImage && !vnodeProps?.['onPreview-image']) {
    di?.previewImage?.(att.dataUrl, att.name)
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>
