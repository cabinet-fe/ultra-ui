<template>
  <!-- 会话导航：贴在消息区左缘的细刻度条，hover 展开为可点击目录 -->
  <div
    v-if="items.length >= MIN_ITEMS && scrollable"
    :class="cls.e('navigator')"
    @mouseenter="open = true"
    @mouseleave="open = false"
  >
    <div :class="cls.e('navigator-rail')">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        :class="[
          cls.e('navigator-tick'),
          bem.is('active', item.key === activeKey),
          bem.is('read', item.index < activeIndex)
        ]"
        :title="item.title"
        @click="emit('jump', item.key)"
      >
        <span :class="cls.e('navigator-tick-line')" />
      </button>
    </div>

    <!-- 展开目录：hover 时才出现，平时只留刻度，不干扰阅读 -->
    <Transition :name="cls.em('navigator', 'fade')">
      <div v-if="open" :class="cls.e('navigator-panel')">
        <div :class="cls.e('navigator-panel-head')">
          <span :class="cls.e('navigator-panel-title')">会话导航</span>
          <span :class="cls.e('navigator-panel-count')">{{ items.length }} 轮</span>
        </div>
        <ol :class="cls.e('navigator-list')">
          <li v-for="item in items" :key="item.key">
            <button
              type="button"
              :class="[
                cls.e('navigator-item'),
                bem.is('active', item.key === activeKey),
                bem.is('read', item.index < activeIndex)
              ]"
              @click="emit('jump', item.key)"
            >
              <span :class="cls.e('navigator-item-index')">{{ item.index + 1 }}</span>
              <span :class="cls.e('navigator-item-text')">{{ item.title }}</span>
            </button>
          </li>
        </ol>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, inject, ref } from 'vue'

import { AiChatDIKey } from './di'
import type { NavigatorItem } from './navigator-item'

defineOptions({ name: 'UAiChatNavigator' })

/** 少于该轮数不出现导航：短对话用不到目录，出现反而干扰 */
const MIN_ITEMS = 3

const props = defineProps<{
  items: NavigatorItem[]
  /** 当前视口内的轮次 key（滚动时高亮） */
  activeKey?: string
  /** 列表是否真的可滚动：内容不溢出时不出现导航（短对话不需要目录） */
  scrollable?: boolean
}>()

const emit = defineEmits<{ (e: 'jump', key: string): void }>()

const di = inject(AiChatDIKey)
const cls = di?.cls ?? bem('ai-chat')

const open = ref(false)

const activeIndex = computed(() => {
  const index = props.items.findIndex((item) => item.key === props.activeKey)
  return index === -1 ? -1 : index
})
</script>
