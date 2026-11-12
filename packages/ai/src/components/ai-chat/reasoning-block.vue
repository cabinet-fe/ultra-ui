<template>
  <div :class="[cls.e('reasoning'), bem.is('expanded', reasoningExpanded)]">
    <div :class="cls.e('reasoning-header')" @click="toggleReasoning">
      <ThinkingIcon :active="isThinking" />
      <span :class="[cls.e('reasoning-title'), isThinking && 'u-shine']">
        {{ reasoningTitle }}
      </span>
      <!-- 折叠态在头部右侧滚动展示最新一行思考 -->
      <span v-if="latestReasoningLine" :class="cls.e('reasoning-line')">
        {{ latestReasoningLine }}
      </span>
      <UIcon :class="cls.e('reasoning-chevron')"><ArrowRight /></UIcon>
    </div>
    <!-- 折叠时完全卸载内容 DOM：思考文本可能很长，常驻挂载浪费内存与渲染成本 -->
    <div v-if="reasoningExpanded" :class="cls.e('reasoning-content')">
      <UScroll
        ref="reasoningScrollRef"
        container-style="max-height: 220px"
        @scroll="handleReasoningScroll"
        @wheel.passive="handleReasoningWheel"
      >
        <div :class="cls.e('reasoning-text')">{{ message.reasoning }}</div>
      </UScroll>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * 思考耗时按消息 id 全局记忆（模块级，跨实例共享）：步骤行折叠会卸载本组件实例，
 * 重新展开后靠这张表还原「思考了 12s」，不必把计时写进消息结构。
 * 不能按消息对象做 key——session 路径 fold 每个事件都重建消息对象；
 * 消息 id 全局唯一，泄漏量级为每消息一个数字，可接受。
 */
const reasoningDurations = new Map<string, number>()
</script>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, ref, useTemplateRef, watch } from 'vue'

import type { ChatMessage } from '../../chat/types'
import { AiChatDIKey } from './di'
import { formatDuration } from './format-duration'
import ThinkingIcon from './thinking-icon.vue'
import { lastNonEmptyLine } from './tool-format'
import { useStickScroll } from './use-stick-scroll'

defineOptions({ name: 'UAiChatReasoningBlock' })

const props = defineProps<{
  /** 思考过程所在的 assistant 消息 */
  message: ChatMessage
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const isStreaming = computed(() => props.message.status === 'streaming')
/** 思考中：流式且正文还未开始输出 */
const isThinking = computed(() => isStreaming.value && !props.message.content)

/** 思考默认折叠（含流式进行中），用户点击头部展开 */
const reasoningExpanded = ref(false)

const reasoningMs = ref(reasoningDurations.get(props.message.id))
let reasoningStartedAt: number | undefined

watch(
  isThinking,
  (thinking, wasThinking) => {
    if (thinking) {
      if (reasoningStartedAt == null) reasoningStartedAt = Date.now()
      return
    }
    if (wasThinking && reasoningStartedAt != null) {
      const ms = Date.now() - reasoningStartedAt
      reasoningMs.value = ms
      reasoningDurations.set(props.message.id, ms)
    }
  },
  { immediate: true }
)

/** 折叠头标题：思考中 → 思考中…；结束后计时够长才报耗时，秒级以下的「思考了 0s」没有信息量 */
const reasoningTitle = computed(() => {
  if (isThinking.value) return '思考中…'
  const ms = reasoningMs.value
  if (ms != null && ms >= 1000) return `思考了 ${formatDuration(ms)}`
  return '思考过程'
})

/** 折叠时头部右侧滚动展示的最新一行思考：取最后一行非空文本，随流式输出持续刷新 */
const latestReasoningLine = computed(() => {
  if (!isThinking.value || reasoningExpanded.value) return ''
  return lastNonEmptyLine(props.message.reasoning ?? '')
})

/** 思考内容滚动区：展开且流式输出时吸附底部，始终展示最新思考 */
const reasoningScrollRef = useTemplateRef<InstanceType<typeof UScroll>>('reasoningScrollRef')

/** 思考区吸底内核：区内滚动内容只在尾部增长，直接按位置判定触底（无需方向感知） */
const {
  stuck: reasoningStick,
  handleScroll: handleReasoningScroll,
  handleWheel: handleReasoningWheel,
  scrollToBottomIfStuck
} = useStickScroll({ getScroller: () => reasoningScrollRef.value, bottomThreshold: 8 })

const toggleReasoning = async () => {
  reasoningExpanded.value = !reasoningExpanded.value
  if (!reasoningExpanded.value) return
  // 重新展开时恢复吸附并定位到最新思考
  reasoningStick.value = true
  await scrollToBottomIfStuck()
}

watch(
  () => props.message.reasoning,
  async () => {
    if (!isThinking.value || !reasoningExpanded.value) return
    await scrollToBottomIfStuck()
  }
)
</script>
