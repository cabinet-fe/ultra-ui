<template>
  <div>
    <CustomCard title="上下文窗口占比与缓存明细">
      <div class="demo-controls">
        <USegment v-model="preset" :items="presetOptions" size="small" />
        <label class="demo-toggle">
          <span>显示缓存明细 (detail)</span>
          <USwitch v-model="detail" />
        </label>
      </div>

      <div class="demo-row">
        <UAiContextUsage
          :usage="activePreset.usage"
          :last-request-usage="activePreset.lastRequest"
          :context-window="contextWindow"
          :detail="detail"
          direction="bottom"
          alignment="start"
        />
        <span class="demo-hint">
          悬停左侧进度环查看明细（窗口上限 128K，当前单次请求 {{ activePreset.desc }}）
        </span>
      </div>
    </CustomCard>

    <CustomCard title="自定义面板插槽">
      <div class="demo-row">
        <UAiContextUsage
          :usage="activePreset.usage"
          :last-request-usage="activePreset.lastRequest"
          :context-window="contextWindow"
          detail
          direction="bottom"
          alignment="start"
        >
          <template #default="{ contextText, rows }">
            <div class="custom-usage-panel">
              <div class="custom-usage-panel__title">Token 统计摘要</div>
              <div v-if="contextText" class="custom-usage-panel__ctx">{{ contextText }}</div>
              <div v-for="row in rows" :key="row.label" class="custom-usage-panel__row">
                <span>{{ row.label }}</span>
                <strong>{{ row.value }}</strong>
              </div>
            </div>
          </template>
        </UAiContextUsage>
        <span class="demo-hint">通过默认作用域插槽自定义弹出面板排版</span>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { type ChatTokenUsage, UAiContextUsage } from '@veltra/ai'
import { USegment, USwitch } from '@veltra/desktop'
import { computed, ref } from 'vue'

import CustomCard from '../../desktop/card/custom-card.vue'

type PresetKey = 'low' | 'medium' | 'high'

const contextWindow = 128_000
const preset = ref<PresetKey>('medium')
const detail = ref(true)

const presetOptions = [
  { label: '轻载 15%', value: 'low' },
  { label: '中载 55%', value: 'medium' },
  { label: '近满载 92%', value: 'high' }
]

const presetMap: Record<
  PresetKey,
  { desc: string; lastRequest: ChatTokenUsage; usage: ChatTokenUsage }
> = {
  low: {
    desc: '19.2K / 128K',
    lastRequest: { promptTokens: 16_000, completionTokens: 3_200, totalTokens: 19_200 },
    usage: {
      promptTokens: 28_000,
      completionTokens: 5_400,
      totalTokens: 33_400,
      cacheHitTokens: 12_000,
      cacheMissTokens: 16_000
    }
  },
  medium: {
    desc: '70.4K / 128K',
    lastRequest: { promptTokens: 61_000, completionTokens: 9_400, totalTokens: 70_400 },
    usage: {
      promptTokens: 142_000,
      completionTokens: 21_500,
      totalTokens: 163_500,
      cacheHitTokens: 86_000,
      cacheMissTokens: 56_000
    }
  },
  high: {
    desc: '117.8K / 128K',
    lastRequest: { promptTokens: 106_000, completionTokens: 11_800, totalTokens: 117_800 },
    usage: {
      promptTokens: 320_000,
      completionTokens: 48_000,
      totalTokens: 368_000,
      cacheHitTokens: 210_000,
      cacheMissTokens: 110_000
    }
  }
}

const activePreset = computed(() => presetMap[preset.value])
</script>

<style scoped lang="scss">
.demo-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--u-text-color-second);
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-hint {
  font-size: 13px;
  color: var(--u-text-color-second);
}

.custom-usage-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--u-text-color-main);
}

.custom-usage-panel__title {
  font-weight: 600;
  color: var(--u-text-color-title);
}

.custom-usage-panel__ctx {
  color: var(--u-color-primary);
  font-weight: 500;
}

.custom-usage-panel__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: var(--u-text-color-second);
}
</style>
