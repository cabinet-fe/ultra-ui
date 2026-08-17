<template>
  <div>
    <CustomCard title="AI 对话助手（DeepSeek V4 Flash / V4 Pro，经 Node 代理服务）">
      <div class="ai-chat-wrap">
        <u-ai-chat
          v-model:model="model"
          v-model:reasoning-level="reasoningLevel"
          :transport="transport"
          :tools="tools"
          :models="models"
          :welcome="[
            '算一下 128*46',
            '北京天气怎么样（真实 Open-Meteo 数据，天气卡片即答复）',
            '删除 /tmp/app.log（需确认）',
            '生成中继续提问会进入待发送队列，可插队立即开始或取回编辑'
          ]"
        />
      </div>
      <div class="selection-hint">当前选择：{{ selectionSummary }}</div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { UAiChat, createOpenAITransport, type ChatTool } from '@veltra/ai'
import '@veltra/ai/style'
import { Delete, Sun } from '@veltra/icons/normal'
import { computed, ref } from 'vue'

import CustomCard from '../desktop/card/custom-card.vue'
import WeatherCard from './weather-card.vue'

/**
 * 真实 DeepSeek 接入。
 * 前端只持有相对路径与模型元数据；API Key 由 playground 的 Node 代理服务从环境变量读取，
 * 经 vite proxy 转发到 ai-server 的 /ai/chat/completions。
 *
 * V4 Flash / V4 Pro 都支持 reasoning_effort，选择器据此展示推理等级；
 * 默认 transport 会把选中的等级写入 `reasoning_effort`。
 */
const deepseekReasoningLevels = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
]

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      label: 'DeepSeek',
      endpoint: '/ai/chat/completions',
      models: [
        {
          id: 'deepseek-v4-flash',
          label: 'DeepSeek V4 Flash',
          description: '快速通用对话，低延迟高吞吐',
          reasoningLevels: deepseekReasoningLevels,
          defaultReasoningLevel: 'low'
        },
        {
          id: 'deepseek-v4-pro',
          label: 'DeepSeek V4 Pro',
          description: '旗舰推理与 Agent 任务',
          reasoningLevels: deepseekReasoningLevels,
          defaultReasoningLevel: 'medium'
        }
      ]
    }
  ]
})

const models = transport.models
const model = ref(transport.defaultModel)
const reasoningLevel = ref<string>()

const selectedModel = computed(() => models.find((m) => m.id === model.value))
const selectedReasoningLevel = computed(() => {
  return selectedModel.value?.reasoningLevels?.find((level) => level.value === reasoningLevel.value)
})

const selectionSummary = computed(() => {
  const m = selectedModel.value
  if (!m) return model.value
  const provider = m.providerLabel ?? m.providerId
  const name = m.label ?? m.id
  const level = selectedReasoningLevel.value
  return level ? `${provider} / ${name} · 推理 ${level.label}` : `${provider} / ${name}`
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Open-Meteo Geocoding / Forecast 响应的最小形状 */
interface GeocodingResponse {
  results?: {
    name: string
    admin1?: string
    country?: string
    latitude: number
    longitude: number
  }[]
}

interface ForecastResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] }
}

/** WMO 天气码 → 中文描述 */
function wmoWeatherText(code: number): string {
  if (code === 0) return '晴'
  if (code === 1) return '大部晴'
  if (code === 2) return '局部多云'
  if (code === 3) return '阴'
  if (code === 45 || code === 48) return '雾'
  if (code >= 51 && code <= 55) return '毛毛雨'
  if (code === 56 || code === 57) return '冻毛毛雨'
  if (code >= 61 && code <= 65) return ['小雨', '中雨', '大雨'][code - 61] ?? '雨'
  if (code === 66 || code === 67) return '冻雨'
  if (code >= 71 && code <= 75) return ['小雪', '中雪', '大雪'][code - 71] ?? '雪'
  if (code === 77) return '雪粒'
  if (code >= 80 && code <= 82) return '阵雨'
  if (code === 85 || code === 86) return '阵雪'
  if (code === 95) return '雷暴'
  if (code === 96 || code === 99) return '雷暴伴冰雹'
  return '未知天气'
}

const tools: ChatTool[] = [
  {
    name: 'calculate',
    description: '计算数学表达式',
    label: '计算器',
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string', description: '数学表达式' } },
      required: ['expression']
    },
    execute: ({ expression }: { expression: string }) => {
      // 仅演示环境使用
      const result = new Function(`return (${expression})`)()
      return { expression, result }
    }
  },
  {
    name: 'getWeather',
    description: '查询城市实时天气，结果以天气卡片直接展示给用户，无需再用文字复述',
    label: '查天气',
    icon: Sun,
    render: WeatherCard,
    // 终结工具：卡片即最终答复，执行成功后不再回灌模型生成额外文字
    terminal: true,
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: '城市名' } },
      required: ['city']
    },
    execute: async ({ city }: { city: string }) => {
      // 真实数据：Open-Meteo 地理编码 + 实时天气（免费公开 API，无需密钥）
      const geo: GeocodingResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`
      ).then((res) => res.json())
      const place = geo.results?.[0]
      if (!place) throw new Error(`未找到城市「${city}」，请换个写法`)

      const forecast: ForecastResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
          '&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1'
      ).then((res) => res.json())

      const { current, daily } = forecast
      return {
        city: place.name,
        region: place.admin1 ?? place.country ?? '',
        weather: wmoWeatherText(current.weather_code),
        code: current.weather_code,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        low: Math.round(daily.temperature_2m_min[0]!),
        high: Math.round(daily.temperature_2m_max[0]!),
        humidity: current.relative_humidity_2m,
        wind: `${Math.round(current.wind_speed_10m)} km/h`
      }
    }
  },
  {
    name: 'deleteFile',
    description: '删除指定路径的文件',
    label: '删除文件',
    icon: Delete,
    needsConfirm: true,
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: '文件路径' } },
      required: ['path']
    },
    execute: async ({ path }: { path: string }) => {
      // 演示 needsConfirm 确认交互的模拟危险操作
      await sleep(800)
      return { deleted: path }
    }
  }
  // 提问工具 askQuestion 由 UAiChat 内置自动注入，无需手动创建
]
</script>

<style scoped>
.ai-chat-wrap {
  height: 560px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: var(--u-radius-large);
  overflow: hidden;
}

.selection-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--u-text-color-second);
}
</style>
