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
          welcome="试试：「算一下 128*46」「北京天气怎么样」「删除 /tmp/app.log」，也可以切换 V4 Flash / V4 Pro 与低 / 中 / 高推理等级；服务端密钥请在 playground/.env 配置 DEEPSEEK_API_KEY"
        >
          <template #tool-getWeather="{ toolCall }">
            <div class="weather-result">🌤️ {{ toolCall.result }}</div>
          </template>
        </u-ai-chat>
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
    description: '查询城市天气',
    label: '查天气',
    icon: Sun,
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: '城市名' } },
      required: ['city']
    },
    execute: async ({ city }: { city: string }) => {
      await sleep(600)
      return { city, weather: '晴', temperature: '26°C' }
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

.weather-result {
  padding: 8px;
  font-size: 13px;
}
</style>
