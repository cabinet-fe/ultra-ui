<template>
  <UDropdown
    v-if="usage"
    :class="cls.b"
    :direction="direction"
    :alignment="alignment"
    width="auto"
    min-width="200px"
    :content-class="cls.e('panel')"
  >
    <template #trigger>
      <button type="button" :class="cls.e('trigger')" aria-label="Token 用量">
        <svg :class="cls.e('ring')" viewBox="0 0 36 36">
          <circle :class="cls.e('ring-track')" cx="18" cy="18" r="14" />
          <circle
            :class="cls.e('ring-value')"
            cx="18"
            cy="18"
            r="14"
            pathLength="100"
            transform="rotate(-90 18 18)"
            :stroke-dasharray="`${contextPercent ?? 0} 100`"
            :stroke-linecap="contextPercent ? 'round' : undefined"
          />
        </svg>
      </button>
    </template>

    <template #content>
      <slot
        :usage="usage"
        :last-request-usage="lastRequestUsage"
        :context-window="contextWindow"
        :context-percent="contextPercent"
        :context-text="contextText"
        :rows="usageRows"
      >
        <div :class="cls.e('list')">
          <div v-if="contextText" :class="cls.e('row')">
            <span :class="cls.e('label')">上下文占用</span>
            <span :class="cls.e('value')">{{ contextText }}</span>
          </div>
          <div v-for="row in usageRows" :key="row.label" :class="cls.e('row')">
            <span :class="cls.e('label')">{{ row.label }}</span>
            <span :class="cls.e('value')">{{ row.value }}</span>
          </div>
        </div>
      </slot>
    </template>
  </UDropdown>
</template>

<script lang="ts" setup>
import './style'
import { n } from '@cat-kit/core'
import { UDropdown } from '@veltra/desktop'
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { ChatTokenUsage } from '../../chat/types'
import type { AiContextUsageProps } from '../../types'

defineOptions({ name: 'UAiContextUsage' })

const props = withDefaults(defineProps<AiContextUsageProps>(), {
  detail: false,
  direction: 'top',
  alignment: 'end'
})

defineSlots<{
  default(scope: {
    usage: ChatTokenUsage
    lastRequestUsage?: ChatTokenUsage | null
    contextWindow?: number
    contextPercent: number | null
    contextText: string
    rows: { label: string; value: string }[]
  }): any
}>()

const cls = bem('ai-context-usage')

/**
 * 用量数字：不到 1000 原样；≥1000 用 K；≥100 万用 M。
 * 最多 1 位小数，整数不写 `.0`（1000 → 1K，1500 → 1.5K）。
 */
const formatTokenCount = (count: number) => {
  const scaled = (value: number, unit: 'K' | 'M') => `${n(value).fixed({ maxPrecision: 1 })}${unit}`
  if (count < 1000) return String(count)
  if (count < 1_000_000) {
    const thousands = n(count / 1000).fixed({ maxPrecision: 1 })
    // 四舍五入后会变成 1000K 时改用 M
    return Number(thousands) >= 1000 ? scaled(count / 1_000_000, 'M') : `${thousands}K`
  }
  return scaled(count / 1_000_000, 'M')
}

/** 百分比：最多 1 位小数，整数不写 `.0` */
const formatPercent = (p: number) => {
  const rounded = Math.round(p * 10) / 10
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}%`
}

/** 上下文占用百分比：最近一次请求总 token / 窗口上限；缺数据时为 null */
const contextPercent = computed(() => {
  const win = props.contextWindow
  const total = props.lastRequestUsage?.totalTokens
  if (!win || total == null) return null
  return Math.min(100, (total / win) * 100)
})

/** 面板占用行文案：1.5K / 128K · 1.2% */
const contextText = computed(() => {
  const percent = contextPercent.value
  const win = props.contextWindow
  const total = props.lastRequestUsage?.totalTokens
  if (percent == null || !win || total == null) return ''
  return `${formatTokenCount(total)} / ${formatTokenCount(win)} · ${formatPercent(percent)}`
})

/** 明细面板行：总 / 输入 / 输出；明细开关下再拼有数据的缓存项，缺字段不写 0 */
const usageRows = computed(() => {
  const usage = props.usage
  if (!usage) return []
  const rows = [
    { label: '总 token', value: formatTokenCount(usage.totalTokens) },
    { label: '输入', value: formatTokenCount(usage.promptTokens) },
    { label: '输出', value: formatTokenCount(usage.completionTokens) }
  ]
  if (props.detail) {
    if (usage.cacheHitTokens != null) {
      rows.push({ label: '缓存命中', value: formatTokenCount(usage.cacheHitTokens) })
    }
    if (usage.cacheMissTokens != null) {
      rows.push({ label: '缓存未命中', value: formatTokenCount(usage.cacheMissTokens) })
    }
  }
  return rows
})
</script>
