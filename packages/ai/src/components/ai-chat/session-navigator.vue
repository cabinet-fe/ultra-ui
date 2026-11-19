<template>
  <!-- 会话导航：贴消息区左缘的圆点指示器，hover 单个圆点展示该轮问答摘要，点击跳到该轮 -->
  <div v-if="items.length >= MIN_ITEMS && scrollable" :class="cls.e('navigator')">
    <div
      v-for="item in items"
      :key="item.key"
      :class="cls.e('navigator-item')"
      @mouseenter="hoveredKey = item.key"
      @mouseleave="hoveredKey === item.key && (hoveredKey = undefined)"
    >
      <button
        type="button"
        :class="[
          cls.e('navigator-dot'),
          bem.is('active', item.key === activeKey),
          bem.is('read', item.index < activeIndex)
        ]"
        :aria-label="`第 ${item.index + 1} 轮：${item.question}`"
        @focus="hoveredKey = item.key"
        @blur="hoveredKey === item.key && (hoveredKey = undefined)"
        @click="emit('jump', item.key)"
      />

      <div v-if="hoveredKey === item.key" :class="cls.e('navigator-tooltip')">
        <div :class="cls.e('navigator-tooltip-row')">
          <span :class="cls.e('navigator-tooltip-label')">问</span>
          <span :class="cls.e('navigator-tooltip-q')">{{ item.question }}</span>
        </div>
        <div v-if="item.answer" :class="cls.e('navigator-tooltip-row')">
          <span :class="cls.e('navigator-tooltip-label')">答</span>
          <span :class="cls.e('navigator-tooltip-a')">{{ item.answer }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import './style'
import { bem } from '@veltra/utils'
import { computed, inject, ref } from 'vue'

import { AiChatDIKey } from './di'
import type { NavigatorItem } from './navigator-item'

defineOptions({ name: 'UAiChatNavigator' })

/** 少于该轮数不出现导航：短对话用不到导航 */
const MIN_ITEMS = 3

const props = defineProps<{
  items: NavigatorItem[]
  /** 当前视口内的轮次 key（滚动时高亮） */
  activeKey?: string
  /** 列表是否真的可滚动：内容不溢出时不出现导航 */
  scrollable?: boolean
}>()

const emit = defineEmits<{ (e: 'jump', key: string): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const hoveredKey = ref<string>()

const activeIndex = computed(() => {
  return props.items.findIndex((item) => item.key === props.activeKey)
})
</script>
