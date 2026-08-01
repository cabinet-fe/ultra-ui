<template>
  <div>
    <CustomCard title="AI 对话助手（mock transport，工具自动编排）">
      <div class="ai-chat-wrap">
        <u-ai-chat
          :transport="transport"
          :tools="tools"
          welcome="试试：「算一下 128*46」「北京天气怎么样」「删除 /tmp/app.log」"
        >
          <template #tool-getWeather="{ toolCall }">
            <div class="weather-result">🌤️ {{ toolCall.result }}</div>
          </template>
        </u-ai-chat>
      </div>
    </CustomCard>
  </div>
</template>

<script lang="ts" setup>
import { UAiChat, type ChatTool, type ChatTransport } from '@veltra/ai'
import '@veltra/ai/style'

import CustomCard from '../desktop/card/custom-card.vue'

// 真实接入时替换为内置 OpenAI 兼容 transport：
// import { createOpenAITransport } from '@veltra/ai'
// const transport = createOpenAITransport({
//   endpoint: 'https://api.deepseek.com/v1/chat/completions',
//   apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
//   model: 'deepseek-chat'
// })

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

/** mock transport：按关键词模拟流式输出与工具调用 */
const transport: ChatTransport = async (req, handlers) => {
  const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')
  const question = lastUser?.content ?? ''

  // 上一轮是工具结果时，输出总结文本
  const lastMessage = req.messages[req.messages.length - 1]
  if (lastMessage?.role === 'tool') {
    const answer = `工具执行完毕，结果如下：\n\n\`\`\`json\n${JSON.stringify(JSON.parse(lastMessage.content), null, 2)}\n\`\`\``
    await streamText(answer, req.signal, (ch) => handlers.onTextDelta(ch), 8)
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

  handlers.onReasoningDelta?.('用户问了一个通用问题，我应该用 markdown 格式给出回答。')
  const answer = `你问的是：**${question}**\n\n这是一个 mock 回复，支持流式 markdown 渲染：\n\n- 列表项一\n- 列表项二\n\n\`\`\`ts\nconst hello: string = 'world'\n\`\`\``
  await streamText(answer, req.signal, (ch) => handlers.onTextDelta(ch))
}

const tools: ChatTool[] = [
  {
    name: 'calculate',
    description: '计算数学表达式',
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
]
</script>

<style scoped>
.ai-chat-wrap {
  height: 560px;
  border: 1px solid var(--u-border-muted-color);
  border-radius: var(--u-radius-large);
  overflow: hidden;
}

.weather-result {
  padding: 8px;
  font-size: 13px;
}
</style>
