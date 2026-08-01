# UAiChat 示例

## 基础对话（OpenAI 兼容端点）

```vue
<template>
  <u-ai-chat :transport="transport" welcome="有什么可以帮你？" />
</template>

<script lang="ts" setup>
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
  model: 'deepseek-chat'
})
</script>
```

## 工具定义（组件自动编排工具调用循环）

传入不同 tools 即可赋予助手不同能力，工具结果会自动回灌给模型继续生成。

```vue
<template>
  <u-ai-chat :transport="transport" :tools="tools" />
</template>

<script lang="ts" setup>
import { createOpenAITransport, type ChatTool } from '@veltra/ai'

const transport = createOpenAITransport({
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
  model: 'deepseek-chat'
})

const tools: ChatTool[] = [
  {
    name: 'getWeather',
    description: '查询城市天气',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: '城市名' } },
      required: ['city']
    },
    execute: async ({ city }: { city: string }) => {
      const res = await fetch(`/api/weather?city=${city}`)
      return res.json()
    }
  }
]
</script>
```

## 需要用户确认的工具

needsConfirm 工具执行前会在工具卡片中内联「允许 / 拒绝」按钮。

```ts
const tools: ChatTool[] = [
  {
    name: 'deleteFile',
    description: '删除指定路径的文件',
    needsConfirm: true,
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    },
    execute: ({ path }: { path: string }) => deleteFile(path)
  }
]
```

## 自定义工具结果展示

通过 `tool-<name>` 插槽自定义某个工具的结果渲染。

```vue
<template>
  <u-ai-chat :transport="transport" :tools="tools">
    <template #tool-getWeather="{ toolCall }">
      <div class="weather-card">🌤 {{ toolCall.result }}</div>
    </template>
  </u-ai-chat>
</template>
```

## 自定义 transport 接入任意后端

实现 ChatTransport 接口即可，组件不关心具体协议。

```ts
import type { ChatTransport } from '@veltra/ai'

const transport: ChatTransport = async (req, handlers) => {
  const res = await fetch('/my-chat-api', {
    method: 'POST',
    signal: req.signal,
    body: JSON.stringify({ messages: req.messages, tools: req.tools })
  })
  // 自行解析响应，通过 handlers 回调流式抛出
  handlers.onReasoningDelta?.('思考内容')
  handlers.onTextDelta('回答内容')
  handlers.onToolCall?.({ id: 'call-1', name: 'getWeather', arguments: '{"city":"北京"}' })
}
```

## 受控消息与实例方法

```vue
<template>
  <u-ai-chat ref="chatRef" v-model:messages="messages" :transport="transport" />
</template>

<script lang="ts" setup>
import type { AiChatExposed, ChatMessage } from '@veltra/ai'
import { ref, shallowRef } from 'vue'

const messages = ref<ChatMessage[]>([])
const chatRef = shallowRef<AiChatExposed>()

// chatRef.value?.send('你好')      发送消息
// chatRef.value?.abort()           中断生成
// chatRef.value?.regenerate()      重新生成最后一轮回复
// chatRef.value?.clear()           清空消息
</script>
```
