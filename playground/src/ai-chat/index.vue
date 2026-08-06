<template>
  <div>
    <CustomCard title="AI 对话助手（mock transport，多 Provider 模型 / 推理选择）">
      <div class="ai-chat-wrap">
        <u-ai-chat
          v-model:model="model"
          v-model:reasoning-level="reasoningLevel"
          :transport="transport"
          :tools="tools"
          :models="models"
          welcome="试试：「算一下 128*46」「北京天气怎么样」「删除 /tmp/app.log」「帮我做个活动页面」；也可切换模型/推理后再发一句通用问题"
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
import { UAiChat, type ChatModelOption, type ChatTool, type ChatTransport } from '@veltra/ai'
import '@veltra/ai/style'
import { Delete, Sun } from '@veltra/icons/normal'
import { computed, ref } from 'vue'

import CustomCard from '../desktop/card/custom-card.vue'

// 真实接入时替换为内置 OpenAI 兼容 transport（多 Provider）：
// import { createOpenAITransport } from '@veltra/ai'
// const transport = createOpenAITransport({
//   providers: [
//     {
//       id: 'deepseek',
//       label: 'DeepSeek',
//       // 完整 URL
//       endpoint: 'https://api.deepseek.com/v1/chat/completions',
//       apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
//       models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat' }]
//     },
//     {
//       id: 'proxy',
//       label: '业务代理',
//       // 相对路径走当前 origin，鉴权可用 cookie / headers
//       endpoint: '/api/ai/chat',
//       // 可选：自定义推理字段写入方式（缺省 body.reasoning_effort）
//       // applyReasoning: (level, body) => { body.thinking = { budget: level } },
//       models: [
//         {
//           id: 'o3-mini',
//           label: 'o3-mini',
//           reasoningLevels: [
//             { value: 'low', label: '低' },
//             { value: 'medium', label: '中' },
//             { value: 'high', label: '高' }
//           ],
//           defaultReasoningLevel: 'medium'
//         }
//       ]
//     }
//   ]
// })
// const models = transport.models
// const model = ref(transport.defaultModel)

/**
 * 演示用扁平模型列表（mock transport 不按 endpoint 路由，仅驱动选择器）。
 * 结构对齐 createOpenAITransport().models：两家虚构 Provider。
 */
const models: ChatModelOption[] = [
  // —— 外部云端（完整 URL 风格）——
  { id: 'nova-flash', label: 'Nova Flash', providerId: 'nova', providerLabel: 'Nova Cloud' },
  {
    id: 'nova-reasoner',
    label: 'Nova Reasoner',
    providerId: 'nova',
    providerLabel: 'Nova Cloud',
    reasoningLevels: [
      { value: 'low', label: '低' },
      { value: 'medium', label: '中' },
      { value: 'high', label: '高' }
    ],
    defaultReasoningLevel: 'medium'
  },
  // —— 内部代理（相对路径风格）——
  { id: 'internal-chat', label: '内部 Chat', providerId: 'internal', providerLabel: '内部代理' },
  {
    id: 'internal-think',
    label: '内部 Think',
    providerId: 'internal',
    providerLabel: '内部代理',
    // 与外部不同的推理词表（thinking budget）
    reasoningLevels: [
      { value: '4k', label: '4K' },
      { value: '8k', label: '8K' },
      { value: '16k', label: '16K' }
    ],
    defaultReasoningLevel: '8k'
  }
]

const model = ref('nova-flash')
const reasoningLevel = ref<string>()

const selectedModel = computed(() => models.find((m) => m.id === model.value))

const selectionSummary = computed(() => {
  const m = selectedModel.value
  if (!m) return model.value
  const provider = m.providerLabel ?? m.providerId
  const name = m.label ?? m.id
  const level = reasoningLevel.value
  return level ? `${provider} / ${name} · 推理 ${level}` : `${provider} / ${name} · 无推理`
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 逐字流出文本（递归避免 await-in-loop） */
const streamText = async (
  text: string,
  signal: AbortSignal,
  emit: (ch: string) => void,
  delay = 16
): Promise<void> => {
  const pump = async (index: number): Promise<void> => {
    if (index >= text.length || signal.aborted) return
    emit(text[index])
    await sleep(delay)
    return pump(index + 1)
  }
  return pump(0)
}

/** mock transport：按关键词模拟流式输出与工具调用；通用回复会带上当前模型/推理 */
const transport: ChatTransport = async (req, handlers) => {
  const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')
  const question = lastUser?.content ?? ''

  // 上一轮是工具结果时，输出总结文本
  const lastMessage = req.messages[req.messages.length - 1]
  if (lastMessage?.role === 'tool') {
    let answer: string
    try {
      const parsed = JSON.parse(lastMessage.content)
      answer = Array.isArray(parsed?.answers)
        ? `好的，我记下了：\n\n${parsed.answers.map((item: { question: string; answer: string }) => `- **${item.question}** ${item.answer}`).join('\n')}\n\n这就为你准备方案。`
        : `工具执行完毕，结果如下：\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``
    } catch {
      answer = lastMessage.content
    }
    await streamText(answer, req.signal, (ch) => handlers.onTextDelta(ch), 8)
    return
  }

  if (question.includes('页面')) {
    handlers.onToolCall?.({
      id: `call-${Date.now()}`,
      name: 'askQuestion',
      arguments: JSON.stringify({
        questions: [
          { question: '页面给谁用？', options: ['内部团队', '外部客户', '两者都有'] },
          { question: '偏好什么风格？', options: ['简洁', '炫酷', '商务'] },
          { question: '还有什么补充要求？', placeholder: '例如：需要深色模式' }
        ]
      })
    })
    return
  }

  if (question.includes('算')) {
    handlers.onToolCall?.({
      id: `call-${Date.now()}`,
      name: 'calculate',
      arguments: JSON.stringify({ expression: '128*46' })
    })
    return
  }

  if (question.includes('天气')) {
    handlers.onToolCall?.({
      id: `call-${Date.now()}`,
      name: 'getWeather',
      arguments: JSON.stringify({ city: '北京' })
    })
    return
  }

  if (question.includes('删')) {
    handlers.onToolCall?.({
      id: `call-${Date.now()}`,
      name: 'deleteFile',
      arguments: JSON.stringify({ path: '/tmp/app.log' })
    })
    return
  }

  // 通用路径：在回复中回显当前选择，便于验证选择器
  const modelHint = req.model
    ? `（模型：\`${req.model}\`${req.reasoningLevel ? ` / 推理：\`${req.reasoningLevel}\`` : ''}）`
    : ''
  handlers.onReasoningDelta?.('用户问了一个通用问题，我应该用 markdown 格式给出回答。')
  const answer = `你问的是：**${question}**${modelHint}\n\n这是一个 mock 回复，支持流式 markdown 渲染：\n\n- 列表项一\n- 列表项二\n\n\`\`\`ts\nconst hello: string = 'world'\n\`\`\``
  await streamText(answer, req.signal, (ch) => handlers.onTextDelta(ch))
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
