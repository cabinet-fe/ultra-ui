<template>
  <div :class="cls.e('list-wrap')">
    <UScroll :class="cls.e('list')" ref="scrollRef" always @scroll="handleScroll">
      <div v-if="!visibleMessages.length" :class="cls.e('welcome')">
        <slot name="welcome">
          <div :class="cls.e('welcome-inner')">
            <UAiOrb :size="88" />
            <div v-if="welcomeItems.length" :class="cls.e('welcome-list')">
              <button
                v-for="(item, index) in welcomeItems"
                :key="index"
                type="button"
                :class="cls.e('welcome-item')"
                @click="emit('welcome-click', item)"
              >
                {{ item }}
              </button>
            </div>
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

      <!-- 工作状态统一指示：生成中在列表末尾展示活体球 + 文案 -->
      <div v-if="running" :class="cls.e('working')">
        <UAiOrb :size="26" :status="workingOrbStatus" />
        <span :class="[cls.e('working-text'), cls.e('shine')]">工作中…</span>
      </div>
    </UScroll>

    <!-- 用户上翻浏览时悬浮入口：一键回到最新消息 -->
    <Transition :name="cls.em('to-latest', 'fade')">
      <button v-if="showToLatest" type="button" :class="cls.e('to-latest')" @click="scrollToLatest">
        <UIcon><ArrowDown /></UIcon>
        <span>最新消息</span>
      </button>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { UIcon, UScroll } from '@veltra/desktop'
import type { ScrollPosition } from '@veltra/desktop'
import { ArrowDown } from '@veltra/icons/normal'
import { bem } from '@veltra/utils'
import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

import type { ChatMessage } from '../../chat/types'
import type { AiOrbStatus } from '../../types/ai-orb'
import UAiOrb from '../ai-orb/ai-orb.vue'
import { AiChatDIKey } from './di'
import MessageItem from './message-item.vue'

defineOptions({ name: 'UAiChatMessageList' })

const props = defineProps<{
  messages: ChatMessage[]
  /** 空状态欢迎项；字符串按单项处理 */
  welcome?: string | string[]
  /** 是否生成中（控制底部工作状态指示） */
  running?: boolean
  /** 透传给 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
  /** 点击欢迎项（快捷提问） */
  (e: 'welcome-click', text: string): void
}>()

defineSlots<{
  /** 空状态欢迎区插槽 */
  welcome(): any
}>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

/** tool 消息不单独渲染，其内容体现在工具卡片的结果区 */
const visibleMessages = computed(() => props.messages.filter((msg) => msg.role !== 'tool'))

const welcomeItems = computed(() => {
  const welcome = props.welcome
  if (!welcome) return []
  return (Array.isArray(welcome) ? welcome : [welcome]).filter(Boolean)
})

/** 工作球状态：正文输出中 → speaking，其余生成阶段 → thinking */
const workingOrbStatus = computed<AiOrbStatus>(() => {
  const last = visibleMessages.value[visibleMessages.value.length - 1]
  if (last?.role === 'assistant' && last.status === 'streaming' && last.content) {
    return 'speaking'
  }
  return 'thinking'
})

const scrollRef = shallowRef<{ scrollTo: (position: ScrollPosition) => void }>()
/** 是否吸附底部（用户上翻浏览历史时取消吸附） */
const stickToBottom = ref(true)
/** 上一次滚动位置：用于区分用户上翻与自动吸底触发的 scroll 事件 */
let lastScrollY = 0

/** 上翻阅读时展示「最新消息」悬浮按钮 */
const showToLatest = computed(() => !stickToBottom.value && visibleMessages.value.length > 0)

const handleScroll = (position: Required<ScrollPosition>) => {
  const atBottom = position.sh - position.ch - position.y < 60
  if (atBottom) {
    stickToBottom.value = true
  } else if (position.y < lastScrollY) {
    // 只有「向上滚」才算用户离开底部的意图：自动吸底的 scroll 事件可能滞后于
    // 流式内容增长（sh 已变大、y 仍是旧底部），按位置判断会误判成未吸底
    stickToBottom.value = false
  }
  lastScrollY = position.y
}

/** 点击悬浮按钮：恢复吸附并回到底部 */
const scrollToLatest = async () => {
  stickToBottom.value = true
  await nextTick()
  scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
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
      last?.toolCalls?.length ?? 0,
      props.running
    ].join('|')
  },
  async () => {
    // 用户刚发出消息时强制回到底部（无论之前是否在上翻）
    const list = visibleMessages.value
    if (list[list.length - 1]?.role === 'user') stickToBottom.value = true
    if (!stickToBottom.value) return
    await nextTick()
    scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
  }
)

let trailingScrollTimer: ReturnType<typeof setTimeout> | undefined

// 生成收尾时动作区出现 / markdown 终态渲染 / 思考块折叠会再次改变高度，
// 同帧滚动可能够不到最终底部，追加一次延迟兜底滚动
watch(
  () => props.running,
  async (running) => {
    if (running) return
    clearTimeout(trailingScrollTimer)
    if (!stickToBottom.value) return
    await nextTick()
    scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    trailingScrollTimer = setTimeout(() => {
      if (stickToBottom.value) scrollRef.value?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    }, 150)
  }
)

onBeforeUnmount(() => clearTimeout(trailingScrollTimer))
</script>
