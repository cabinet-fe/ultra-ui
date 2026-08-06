# UAiChat 示例

## 基础对话（多 Provider OpenAI 兼容端点）

```vue
<template>
  <u-ai-chat
    :transport="transport"
    :models="transport.models"
    :model="transport.defaultModel"
    welcome="有什么可以帮你？"
  />
</template>

<script lang="ts" setup>
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      label: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
      models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat' }]
    },
    {
      id: 'proxy',
      label: '业务代理',
      // 相对路径走当前 origin；鉴权可用 cookie 或 headers
      endpoint: '/api/ai/chat',
      models: [
        {
          id: 'o3-mini',
          label: 'o3-mini',
          reasoningLevels: [
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' }
          ],
          defaultReasoningLevel: 'medium'
        }
      ]
    }
  ]
})
</script>
```

输入栏会展示模型选择器；选中带 `reasoningLevels` 的模型时再展示推理等级选择器。支持 `v-model:model` / `v-model:reasoning-level`。

自定义推理字段名可用 Provider 级 `applyReasoning`（缺省写 `reasoning_effort`）：

```ts
{
  id: 'custom',
  endpoint: 'https://custom.example/chat',
  applyReasoning: (level, body) => {
    body.thinking = { budget: level }
  },
  models: [{ id: 'custom-model', reasoningLevels: [{ value: '8k', label: '8K' }] }]
}
```

## 工具定义（组件自动编排工具调用循环）

传入不同 tools 即可赋予助手不同能力，工具结果会自动回灌给模型继续生成。

```vue
<template>
  <u-ai-chat :transport="transport" :models="transport.models" :tools="tools" />
</template>

<script lang="ts" setup>
import { createOpenAITransport, type ChatTool } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
      models: [{ id: 'deepseek-chat' }]
    }
  ]
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
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    execute: ({ path }: { path: string }) => deleteFile(path)
  }
]
```

## 自定义工具卡片（icon / label / render / autoCollapse）

工具定义上的 UI 元信息只影响展示，不会传给模型。render 接收 `{ toolCall }`，替换卡片 body 的默认参数/结果展示。

```ts
import { Sunny } from '@veltra/icons/normal'

const tools: ChatTool[] = [
  {
    name: 'getWeather',
    label: '查天气', // 卡片显示名，缺省取 name
    icon: Sunny, // 卡片图标，缺省用内置状态图标
    description: '查询城市天气',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: '城市名' } },
      required: ['city']
    },
    // 自定义渲染（组件或渲染函数），props: { toolCall }；设置后默认完成后不折叠
    render: WeatherCard,
    autoCollapse: false, // 完成后是否折叠；缺省：有 render 时为 false，否则为 true
    execute: async ({ city }: { city: string }) => {
      const res = await fetch(`/api/weather?city=${city}`)
      return res.json()
    }
  }
]
```

## 自定义工具结果展示（插槽）

通过 `tool-<name>` 插槽自定义某个工具的卡片内容（有结果时替换整个 body）；工具定义了 render 时 render 优先。

```vue
<template>
  <u-ai-chat :transport="transport" :tools="tools">
    <template #tool-getWeather="{ toolCall }">
      <div class="weather-card">🌤 {{ toolCall.result }}</div>
    </template>
  </u-ai-chat>
</template>
```

## 内置提问工具

提问工具 `askQuestion` 由 `useChat` / `UAiChat` 始终自动注入，无需手动创建或传入。模型可在需求不明确时发起提问，用户在分页表单中逐题作答（选项或自定义输入），提交后回答回灌模型。用户传入同名工具将被忽略（内置优先）。

```vue
<template>
  <!-- 只需传入业务工具；askQuestion 已内置 -->
  <u-ai-chat :transport="transport" :tools="tools" />
</template>
```

## 自定义 transport 接入任意后端

实现 ChatTransport 接口即可，组件不关心具体协议。自定义 transport 可忽略 `req.model` / `req.reasoningLevel`；未传 `models` 时输入栏不显示选择器。

```ts
import type { ChatTransport } from '@veltra/ai'

const transport: ChatTransport = async (req, handlers) => {
  const res = await fetch('/my-chat-api', {
    method: 'POST',
    signal: req.signal,
    body: JSON.stringify({
      messages: req.messages,
      tools: req.tools,
      model: req.model,
      reasoningLevel: req.reasoningLevel
    })
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
  <u-ai-chat
    ref="chatRef"
    v-model:messages="messages"
    v-model:model="model"
    v-model:reasoning-level="reasoningLevel"
    :transport="transport"
    :models="transport.models"
  />
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import { createOpenAITransport, type AiChatExposed, type ChatMessage } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
      models: [{ id: 'deepseek-chat' }]
    }
  ]
})

const messages = ref<ChatMessage[]>([])
const model = ref(transport.defaultModel)
const reasoningLevel = ref<string>()
const chatRef = useTemplateRef<AiChatExposed>('chatRef')

chatRef.value?.send('你好')
chatRef.value?.abort()
chatRef.value?.regenerate()
chatRef.value?.clear()
</script>
```
