<template>
  <div :class="[cls.b, bem.is('expanded', expanded)]">
    <div :class="cls.e('header')" @click="toggle">
      <ThinkingIcon :active="thinking" />
      <span :class="[cls.e('title'), thinking && 'u-shine']">
        {{ reasoningTitle }}
      </span>
      <!-- 折叠态在头部右侧滚动展示最新一行思考 -->
      <span v-if="latestLine" :class="cls.e('line')">
        {{ latestLine }}
      </span>
      <UIcon :class="cls.e('chevron')"><ArrowRight /></UIcon>
    </div>
    <!-- 折叠时完全卸载内容 DOM：思考文本可能很长，常驻挂载浪费内存与渲染成本 -->
    <div v-if="expanded" :class="cls.e('content')">
      <UScroll
        ref="scrollRef"
        container-style="max-height: 220px"
        @scroll="handleScroll"
        @wheel.passive="handleWheel"
      >
        <div :class="cls.e('text')">
          <slot>{{ renderedContent }}</slot>
        </div>
      </UScroll>
    </div>
  </div>
</template>

<script lang="ts">
import './style'
/**
 * 思考耗时按 cacheKey 全局记忆（模块级，跨实例共享）：外层折叠会卸载本组件实例，
 * 重新展开后靠这张表还原「思考了 12s」。仅当 cacheKey 非空时读写缓存。
 */
const reasoningDurations = new Map<string, number>()
</script>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import { ArrowRight } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, ref, useTemplateRef, watch } from 'vue'

import type { AiReasoningProps } from '../../types'
import { formatDuration } from '../_shared/format-duration'
import ThinkingIcon from '../_shared/thinking-icon.vue'
import { lastNonEmptyLine } from '../_shared/tool-format'
import { useStickScroll } from '../_shared/use-stick-scroll'
import { useStreamThrottle } from '../_shared/use-stream-throttle'

defineOptions({ name: 'UAiReasoning' })

const props = withDefaults(defineProps<AiReasoningProps>(), {
  thinking: false,
  defaultExpanded: false
})

const cls = bem('ai-reasoning')

const expanded = ref(props.defaultExpanded)

const measuredMs = ref<number | undefined>(
  props.cacheKey ? reasoningDurations.get(props.cacheKey) : undefined
)
let startedAt: number | undefined

watch(
  () => props.cacheKey,
  (key) => {
    measuredMs.value = key ? reasoningDurations.get(key) : undefined
  }
)

watch(
  () => props.thinking,
  (thinking, wasThinking) => {
    if (thinking) {
      if (startedAt == null) startedAt = Date.now()
      return
    }
    if (wasThinking && startedAt != null) {
      const ms = Date.now() - startedAt
      startedAt = undefined
      measuredMs.value = ms
      if (props.cacheKey) reasoningDurations.set(props.cacheKey, ms)
    }
  },
  { immediate: true }
)

/** 折叠头标题：思考中 → 思考中…；结束后计时够长才报耗时，秒级以下的「思考了 0s」没有信息量 */
const reasoningTitle = computed(() => {
  if (props.thinking) return '思考中…'
  const ms = props.duration ?? measuredMs.value
  if (ms != null && ms >= 1000) return `思考了 ${formatDuration(ms)}`
  return '思考过程'
})

const renderedContent = useStreamThrottle(
  () => props.content,
  () => props.thinking
)

/** 折叠时头部右侧滚动展示的最新一行思考：取最后一行非空文本，随流式输出节流刷新 */
const latestLine = computed(() => {
  if (!props.thinking || expanded.value) return ''
  return lastNonEmptyLine(renderedContent.value)
})

/** 思考内容滚动区：展开且流式输出时吸附底部，始终展示最新思考 */
const scrollRef = useTemplateRef<InstanceType<typeof UScroll>>('scrollRef')

/** 思考区吸底内核：区内滚动内容只在尾部增长，直接按位置判定触底（无需方向感知） */
const { stuck, handleScroll, handleWheel, scrollToBottomIfStuck } = useStickScroll({
  getScroller: () => scrollRef.value ?? undefined,
  bottomThreshold: 8
})

const toggle = async () => {
  expanded.value = !expanded.value
  if (!expanded.value) return
  // 重新展开时恢复吸附并定位到最新思考
  stuck.value = true
  await scrollToBottomIfStuck()
}

watch(renderedContent, async () => {
  if (!props.thinking || !expanded.value) return
  await scrollToBottomIfStuck()
})
</script>
