# UAiChat 示例

## 基础对话（多 Provider + 模型 / 推理选择）

父级必须有明确高度。生产环境用相对路径代理，API Key 留在服务端。

```vue
<template>
  <u-ai-chat
    style="height: calc(100vh - 90px)"
    :transport="transport"
    :models="transport.models"
    :model="transport.defaultModel"
    system-prompt="你是业务助手，优先使用工具，不要编造数据。"
    :welcome="['有什么可以帮你？', '给我讲个笑话']"
    token-usage-detail
    @finish="onFinish"
    @error="onError"
  />
</template>

<script lang="ts" setup>
import { createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      label: 'DeepSeek',
      // 相对路径走当前 origin；鉴权用 cookie 或服务端代理
      endpoint: '/api/ai/chat',
      models: [
        {
          id: 'deepseek-chat',
          label: 'DeepSeek Chat',
          description: '通用对话',
          reasoningLevels: [
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' }
          ],
          defaultReasoningLevel: 'low'
        }
      ]
    },
    {
      id: 'proxy',
      label: '业务代理',
      endpoint: '/api/ai/gpt',
      models: [{ id: 'gpt-4o', label: 'GPT-4o', description: '多模态' }]
    }
  ]
})

const onFinish = (message: { content: string }) => {
  console.log('本轮结束', message.content)
}

const onError = (error: Error) => {
  console.error(error)
}
</script>
```

输入栏会展示模型选择器（`description` 为副标题）。当前模型有 `reasoningLevels` 时，行内可展开思考强度；选中等级即切到该模型。支持 `v-model:model` / `v-model:reasoning-level`。

推理字段名不是 `reasoning_effort` 时用 Provider 级 `applyReasoning`：

```ts
{
  id: 'custom',
  endpoint: '/api/ai/custom',
  applyReasoning: (level, body) => {
    body.thinking = { budget: level }
  },
  models: [{ id: 'custom-model', reasoningLevels: [{ value: '8k', label: '8K' }] }]
}
```

全局额外请求体 / 请求头：

```ts
createOpenAITransport({
  headers: { 'X-App': 'web' },
  body: { temperature: 0.2 },
  providers: [{ id: 'p', endpoint: '/api/ai/chat', models: [{ id: 'm' }] }]
})
```

## 工具定义（自动编排循环）

`execute` 第二参数带 `signal`，长请求应监听中断。返回对象会被 `JSON.stringify` 后回灌。

```vue
<template>
  <u-ai-chat :transport="transport" :models="transport.models" :tools="tools" />
</template>

<script lang="ts" setup>
import { createOpenAITransport, type ChatTool } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [{ id: 'p', endpoint: '/api/ai/chat', models: [{ id: 'm' }] }]
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
    execute: async ({ city }: { city: string }, { signal }) => {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, { signal })
      return res.json()
    }
  }
]
</script>
```

## 需要用户确认的工具

`needsConfirm` 执行前在工具卡片内联「允许 / 拒绝」。拒绝仍回灌模型，不会丢上下文。

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

## 自定义工具卡片（icon / label / render）

UI 元信息不传给模型。`render` 接收 `{ toolCall }`，替换卡片 body；有 `render` 时默认完成后不折叠。

`weather-card.vue`（`toolCall.result` 是序列化 JSON 字符串）：

```vue
<script lang="ts" setup>
import type { ChatToolRenderProps } from '@veltra/ai'
import { computed } from 'vue'

const props = defineProps<ChatToolRenderProps>()

const data = computed(() => {
  if (!props.toolCall.result) return null
  try {
    return JSON.parse(props.toolCall.result) as { city: string; temperature: number }
  } catch {
    return null
  }
})
</script>

<template>
  <div v-if="data">{{ data.city }} {{ data.temperature }}°C</div>
  <div v-else-if="toolCall.status === 'error'">{{ toolCall.error }}</div>
  <div v-else>查询中…</div>
</template>
```

挂到工具：

```ts
import WeatherCard from './weather-card.vue'
import { Sunny } from '@veltra/icons/normal'
import type { ChatTool } from '@veltra/ai'

const tools: ChatTool[] = [
  {
    name: 'getWeather',
    label: '查天气',
    icon: Sunny,
    description: '查询城市天气',
    parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
    render: WeatherCard,
    autoCollapse: false,
    execute: async ({ city }: { city: string }) => {
      const res = await fetch(`/api/weather?city=${city}`)
      return res.json()
    }
  }
]
```

## 侧边面板工具（renderTo: 'panel'）

适合后台页、表单、图表、列表。`panelTitle` 用「业务对象 + 动作」，不要只用工具名。

```ts
const tools: ChatTool[] = [
  {
    name: 'openAdminPage',
    description: '打开后台页面并展示在右侧面板。page: user-form | sales-chart | order-list',
    label: '打开后台页面',
    render: AdminPanel,
    renderTo: 'panel',
    panelWidth: 480, // 省略则打开时尽量大（会话区留约 860px）
    panelTitle: (toolCall) => {
      try {
        const page = JSON.parse(toolCall.arguments || '{}').page as string
        return { 'user-form': '编辑用户信息', 'sales-chart': '查看销售图表' }[page] ?? '后台页面'
      } catch {
        return '后台页面'
      }
    },
    parameters: {
      type: 'object',
      properties: { page: { type: 'string', enum: ['user-form', 'sales-chart', 'order-list'] } },
      required: ['page']
    },
    execute: async ({ page }: { page: string }) => ({ page, opened: true })
  }
]
```

`AdminPanel` 同样吃 `ChatToolRenderProps`：用 `toolCall.status !== 'success'` 显示加载，用 `JSON.parse(toolCall.arguments)` 取参数。

## 终结工具（terminal：UI 即答复）

执行成功后不再让模型复述。失败 / 拒绝仍回灌。`maxToolRounds`（默认 10）防止工具死循环。

```ts
const tools: ChatTool[] = [
  {
    name: 'getWeather',
    description: '查询城市天气，结果以天气卡片直接展示，无需再用文字复述',
    label: '查天气',
    render: WeatherCard,
    terminal: true,
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
```

## 待发送队列

生成中提交的消息入队，自然结束后 FIFO 接续。输入区：空输入显示停止，有内容显示发送（入队）。队列「立即开始」中断插队；「编辑」取回输入框，再提交插回原位置。手动停止 / 出错不自动接续。

```vue
<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import type { AiChatExposed } from '@veltra/ai'

const chatRef = useTemplateRef<AiChatExposed>('chatRef')

chatRef.value?.queue
chatRef.value?.startQueued(id)
chatRef.value?.removeQueued(id)
chatRef.value?.enqueue('插队问题', undefined, beforeId)
</script>
```

## 自定义工具结果（插槽）

`tool-<name>` 在有结果时替换卡片 body；定义了 `render` 则插槽不会生效。

```vue
<template>
  <u-ai-chat :transport="transport" :tools="tools">
    <template #tool-getWeather="{ toolCall }">
      <div>{{ toolCall.result }}</div>
    </template>
  </u-ai-chat>
</template>
```

覆盖欢迎区：

```vue
<u-ai-chat :transport="transport">
  <template #welcome>
    <div>自定义欢迎区</div>
  </template>
</u-ai-chat>
```

## 内置提问工具

`askQuestion` 已注入，不要再传同名工具。在 `systemPrompt` 里提示模型：需求不清时调用 `askQuestion`（1–4 题，可选 `options`）。用户作答后结果为 `{ answers: [{ question, answer }] }`。

```vue
<template>
  <u-ai-chat :transport="transport" :tools="tools" :system-prompt="prompt" />
</template>

<script lang="ts" setup>
const prompt = '信息不足时先调用 askQuestion 向用户澄清，再继续。'
</script>
```

## 图片附件

输入区回形针选图，默认 `image/*`、单文件 10MB。`send(content, attachments)` 也可编程传入。内置 OpenAI transport 编成 `image_url`。

```vue
<u-ai-chat
  :transport="transport"
  accept="image/png,image/jpeg"
  :max-attachment-size="5 * 1024 * 1024"
/>
```

## 自定义 transport

自行解析响应，只通过 handlers 抛流式事件。`onToolCall` 必须是完整 JSON 参数串，不要分片。

```ts
import type { ChatTransport } from '@veltra/ai'

const transport: ChatTransport = async (req, handlers) => {
  const res = await fetch('/my-chat-api', {
    method: 'POST',
    signal: req.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: req.messages,
      tools: req.tools?.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      })),
      model: req.model,
      reasoningLevel: req.reasoningLevel,
      systemPrompt: req.systemPrompt
    })
  })
  if (!res.ok) {
    handlers.onError?.(new Error(`HTTP ${res.status}`))
    return
  }
  // 解析自有协议后：
  handlers.onReasoningDelta?.('思考内容')
  handlers.onTextDelta('回答内容')
  handlers.onToolCall?.({ id: 'call-1', name: 'getWeather', arguments: '{"city":"北京"}' })
  // 接口有 usage 再回调；不要填 0 充数
  handlers.onUsage?.({ promptTokens: 12, completionTokens: 8, totalTokens: 20 })
}
```

未传 `models` 时输入栏不显示选择器。

## 受控消息与会话持久化

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
import { ref, useTemplateRef, watch } from 'vue'
import { createOpenAITransport, type AiChatExposed, type ChatMessage } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [{ id: 'p', endpoint: '/api/ai/chat', models: [{ id: 'm' }] }]
})

const messages = ref<ChatMessage[]>(loadSession())
const model = ref(transport.defaultModel)
const reasoningLevel = ref<string>()
const chatRef = useTemplateRef<AiChatExposed>('chatRef')

watch(messages, (list) => saveSession(list), { deep: true })

chatRef.value?.send('你好')
chatRef.value?.abort()
chatRef.value?.regenerate()
chatRef.value?.clear()

function loadSession(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem('chat') ?? '[]') as ChatMessage[]
  } catch {
    return []
  }
}

function saveSession(list: ChatMessage[]) {
  localStorage.setItem('chat', JSON.stringify(list))
}
</script>
```

## 无头 useChat

自绘 UI 时与 `UAiChat` 共用同一套 props/emits。`needsConfirm` 必须自己调 `respondToolCall`。

```ts
import { useChat, type AiChatEmits } from '@veltra/ai'

const emit = ((event: string, ...args: unknown[]) => {
  if (event === 'error') console.error(args[0])
}) as AiChatEmits

const chat = useChat({
  props: { transport, tools, models: transport.models, systemPrompt: '你是助手' },
  emit
})

chat.send('你好')
chat.messages.value
chat.running.value
chat.queue.value
// needsConfirm 工具：自绘「允许 / 拒绝」后
// chat.respondToolCall(toolCallId, true)
```

## UAiOrb 独立使用

```vue
<template>
  <u-ai-orb ref="orb" :size="48" status="idle" @click="onClick" />
</template>

<script lang="ts" setup>
import type { AiOrbExposed } from '@veltra/ai'
import { useTemplateRef } from 'vue'

const orbRef = useTemplateRef<AiOrbExposed>('orb')
const onClick = () => orbRef.value?.react('happy') // 'happy' | 'shock' | 'frustrated'
</script>
```
