# UAiChat 示例

## 基础对话（多 Provider OpenAI 兼容端点）

```vue
<template>
  <u-ai-chat
    :transport="transport"
    :models="transport.models"
    :model="transport.defaultModel"
    :welcome="['有什么可以帮你？', '给我讲个笑话']"
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
          // 选择器面板中的副标题描述
          description: '擅长对话与 Agent 任务，全能旗舰',
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

输入栏会展示模型选择器（`description` 作为选项副标题）；选中带 `reasoningLevels` 的模型时，选择器面板底部出现「思考强度」区。支持 `v-model:model` / `v-model:reasoning-level`。

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

## 侧边面板工具（renderTo: 'panel'：右侧面板渲染）

`renderTo: 'panel'` 的工具把 render 组件渲染到对话区右侧的侧边面板：新的面板调用自动打开并聚焦面板，会话内的工具卡片仅保留「查看面板」入口（点击切回对应调用的面板），面板与会话区的宽度可拖拽调节（基于 ULayout，会话区最小 360px、面板最小 320px）；`panelWidth` 可指定该工具面板的默认宽度（聚焦其调用时应用，未指定的保持当前宽度）。render 组件契约不变（props 为 `{ toolCall }`，随调用状态实时更新），适合打开后台页面、表单、图表、列表等需要较大交互区域的工具。

```ts
const tools: ChatTool[] = [
  {
    name: 'openAdminPage',
    description: '打开后台系统的某个页面并展示在右侧面板，供用户直接操作',
    label: '打开后台页面',
    render: AdminPanel, // 渲染在右侧面板（不再占用卡片 body）
    renderTo: 'panel',
    panelWidth: 480, // 面板默认宽度（px，缺省 420，最小 320），聚焦该工具调用时应用
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['user-form', 'sales-chart', 'order-list'],
          description: '要打开的后台页面标识'
        }
      },
      required: ['page']
    },
    execute: async ({ page }: { page: string }) => {
      return { page, opened: true }
    }
  }
]
```

## 终结工具（terminal：工具 UI 即最终答复）

`terminal: true` 的工具执行成功后对话即结束，结果不再回灌模型生成额外文字——天气卡片这类"UI 即答案"的场景用它。结果仍记录在消息历史中供后续轮次使用；执行失败/被拒绝时错误照常回灌模型。另可通过 `maxToolRounds`（默认 10）限制单次发送的最大生成轮次，防止模型失控循环调用工具。

```ts
const tools: ChatTool[] = [
  {
    name: 'getWeather',
    description: '查询城市天气，结果以天气卡片直接展示，无需再用文字复述',
    label: '查天气',
    render: WeatherCard, // 卡片 body 渲染完整天气 UI（toolCall.result 为序列化 JSON）
    terminal: true, // 执行成功即 finish，模型不再追加文字回答
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

## 待发送队列（生成中继续提问）

会话进行中提交的消息自动进入待发送队列（不再被丢弃），会话自然结束后按 FIFO 自动接续。输入区发送与停止按钮互斥：生成中输入为空时显示停止；有内容时显示发送（入队）。队列 UI 内置于输入区上方：「立即开始」中断当前会话并插队执行该条；「编辑」取回输入框，重新提交后插回原位置（保持前后项顺序）；手动停止 / 出错时队列保留不自动接续。无头场景可直接用 `useChat` 返回的 `queue` / `startQueued` / `removeQueued` / `enqueue` 自建队列 UI。

```vue
<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import type { AiChatExposed } from '@veltra/ai'

const chatRef = useTemplateRef<AiChatExposed>('chatRef')

// 编程式操作队列
chatRef.value?.queue // 当前待发送队列
chatRef.value?.startQueued(id) // 中断当前会话，立即执行该条
chatRef.value?.removeQueued(id) // 移出队列
chatRef.value?.enqueue('插队问题', undefined, beforeId) // 锚点插入
</script>
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
