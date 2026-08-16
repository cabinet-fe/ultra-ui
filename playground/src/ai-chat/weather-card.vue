<template>
  <div class="weather-card">
    <template v-if="data">
      <div class="weather-card__head">
        <div class="weather-card__place">
          <span class="weather-card__city">{{ data.city }}</span>
          <span v-if="data.region" class="weather-card__region">{{ data.region }}</span>
        </div>
        <span class="weather-card__emoji" aria-hidden="true">{{ weatherEmoji }}</span>
      </div>

      <div class="weather-card__temp">
        {{ data.temperature }}<span class="weather-card__unit">°C</span>
      </div>
      <div class="weather-card__desc">{{ data.weather }} · 体感 {{ data.feelsLike }}°</div>

      <div class="weather-card__meta">
        <span class="weather-card__chip">最高 {{ data.high }}°</span>
        <span class="weather-card__chip">最低 {{ data.low }}°</span>
        <span class="weather-card__chip">湿度 {{ data.humidity }}%</span>
        <span class="weather-card__chip">风速 {{ data.wind }}</span>
      </div>
    </template>

    <div v-else-if="toolCall.status === 'error'" class="weather-card__tip">
      查询失败：{{ toolCall.error }}
    </div>
    <div v-else class="weather-card__tip weather-card__tip--loading">正在查询天气…</div>
  </div>
</template>

<script lang="ts" setup>
import type { ChatToolCall } from '@veltra/ai'
import { computed } from 'vue'

defineOptions({ name: 'WeatherCard' })

const props = defineProps<{ toolCall: ChatToolCall }>()

interface WeatherResult {
  city: string
  region?: string
  /** 天气描述文本 */
  weather: string
  /** WMO 天气码 */
  code: number
  temperature: number
  feelsLike: number
  low: number
  high: number
  humidity: number
  wind: string
}

/** 工具结果为序列化 JSON；解析失败则按无数据处理（展示加载/错误态） */
const data = computed<WeatherResult | null>(() => {
  if (!props.toolCall.result) return null
  try {
    return JSON.parse(props.toolCall.result) as WeatherResult
  } catch {
    return null
  }
})

/** WMO 天气码 → emoji */
function wmoEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if ((code >= 51 && code <= 57) || (code >= 80 && code <= 82)) return '🌦️'
  if ((code >= 61 && code <= 67) || code === 95 || code === 96 || code === 99) return '⛈️'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return '❄️'
  return '🌤️'
}

const weatherEmoji = computed(() => (data.value ? wmoEmoji(data.value.code) : '🌤️'))
</script>

<style scoped>
.weather-card {
  overflow: hidden;
  border-radius: var(--u-radius-large);
  padding: 14px 16px;
  background: linear-gradient(135deg, #3a7bd5 0%, #56a8f5 60%, #7cc3fb 100%);
  color: #fff;
}

.weather-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.weather-card__place {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-card__city {
  font-size: 15px;
  font-weight: 600;
}

.weather-card__region {
  padding: 1px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 20%);
  font-size: 12px;
}

.weather-card__emoji {
  font-size: 34px;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgb(0 0 0 / 15%));
}

.weather-card__temp {
  margin-top: 2px;
  font-size: 38px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.weather-card__unit {
  margin-left: 2px;
  font-size: 18px;
  font-weight: 400;
}

.weather-card__desc {
  margin-top: 2px;
  font-size: 13px;
  opacity: 0.92;
}

.weather-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.weather-card__chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 16%);
  font-size: 12px;
}

.weather-card__tip {
  font-size: 13px;
  color: #fff;
}

.weather-card__tip--loading {
  display: inline-block;
  background: linear-gradient(
    100deg,
    rgb(255 255 255 / 60%) 30%,
    #fff 50%,
    rgb(255 255 255 / 60%) 70%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: weather-card-shine 1.4s linear infinite;
}

@keyframes weather-card-shine {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
