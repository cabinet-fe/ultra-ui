<template>
  <div>
    <CustomCard title="圆点导航与悬停问答预览">
      <div class="nav-stage">
        <div class="nav-stage__rail">
          <UAiSessionNav
            :items="items"
            :active-key="activeKey"
            @jump="(key) => (activeKey = key)"
          />
        </div>

        <div class="nav-stage__turns">
          <div
            v-for="item in items"
            :key="item.key"
            class="turn-card"
            :class="{ 'is-active': item.key === activeKey }"
            @click="activeKey = item.key"
          >
            <div class="turn-card__q">第 {{ item.index + 1 }} 轮 · 问：{{ item.question }}</div>
            <div class="turn-card__a">答：{{ item.answer }}</div>
          </div>
        </div>
      </div>
    </CustomCard>

    <CustomCard title="显示阈值与开关 (scrollable / min-items)">
      <div class="demo-controls">
        <label class="demo-toggle">
          <span>scrollable</span>
          <USwitch v-model="scrollable" />
        </label>
        <USegment v-model="minItems" :items="minItemOptions" size="small" />
        <span class="demo-hint">
          当前共 {{ items.length }} 轮，满足 items.length >= minItems && scrollable 时渲染
        </span>
      </div>

      <div class="threshold-preview">
        <UAiSessionNav
          :items="items"
          :active-key="activeKey"
          :scrollable="scrollable"
          :min-items="minItems"
          @jump="(key) => (activeKey = key)"
        />
        <span v-if="!scrollable || items.length < minItems" class="demo-hint">
          （当前条件未满足，导航圆点隐藏）
        </span>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type AiSessionNavItem, UAiSessionNav } from '@veltra/ai'
import { USegment, USwitch } from '@veltra/desktop'
import { ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

const items: AiSessionNavItem[] = [
  {
    key: 't-1',
    index: 0,
    question: '如何按需导入 @veltra/ai 组件？',
    answer: '直接 import { UAiComposer } from "@veltra/ai"，样式自动跟随。'
  },
  {
    key: 't-2',
    index: 1,
    question: '独立组件没有 AiChatDIKey 会报错吗？',
    answer: '不会，所有独立组件使用 inject(AiChatDIKey, undefined) 安全回落。'
  },
  {
    key: 't-3',
    index: 2,
    question: 'UAiSidePanel 全屏需要注意什么？',
    answer: '父容器需设置 position: relative 与明确高度。'
  },
  {
    key: 't-4',
    index: 3,
    question: 'UAiContextUsage 何时不渲染？',
    answer: '当 usage 为 null 或 undefined 时不渲染任何 DOM。'
  },
  {
    key: 't-5',
    index: 4,
    question: '如何把导航圆点定位到列表左侧？',
    answer: '宿主容器绝对定位或使用弹性布局置于左侧，右侧留出浮层空间。'
  }
]

const activeKey = ref('t-3')
const scrollable = ref(true)
const minItems = ref(3)
const minItemOptions = [
  { label: 'minItems = 3', value: 3 },
  { label: 'minItems = 6（隐藏）', value: 6 }
]
</script>

<style scoped lang="scss">
.nav-stage {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.nav-stage__rail {
  position: relative;
  z-index: 2;
  padding: 12px 8px;
  border-radius: var(--u-radius-default);
  background-color: var(--u-bg-color-bottom);
  border: 1px solid var(--u-border-color);
}

.nav-stage__turns {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.turn-card {
  padding: 10px 12px;
  border-radius: var(--u-radius-default);
  border: 1px solid var(--u-border-color);
  background-color: var(--u-bg-color-bottom);
  cursor: pointer;
  transition: border-color 0.15s ease;

  &.is-active {
    border-color: var(--u-color-primary);
  }
}

.turn-card__q {
  font-size: 13px;
  font-weight: 500;
  color: var(--u-text-color-title);
}

.turn-card__a {
  margin-top: 4px;
  font-size: 12px;
  color: var(--u-text-color-second);
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.threshold-preview {
  display: flex;
  align-items: center;
  min-height: 84px;
  padding: 10px 14px;
  border-radius: var(--u-radius-default);
  border: 1px dashed var(--u-border-color);
}
</style>
