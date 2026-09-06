---
title: "AI - 智能对话接入、流式传输与 Agent 工具调用编排"
description: "基于 @veltra/ai 的智能聊天对话组件 UAiChat、useChat 与 createOpenAITransport 接入方案：OpenAI 兼容 SSE 流式传输配置、跨 Provider 模型调度、Client Tools 工具函数定义与 Tool Calls 自动执行编排，安全代理避免浏览器泄露 API Key"
keywords:
  - AI
  - @veltra/desktop
  - ai
  - 智能对话接入
  - AI 对话
  - Agent
  - 工具调用编排
aliases: ["ai", "AI"]
---
`@veltra/ai` 的核心是「工具定义 + 自动编排」：传入 `tools` 后，`UAiChat` / `useChat` 会跑 tool_calls → 执行 → 回灌 → 继续生成，直到模型不再调工具、命中终结工具，或达到 `maxToolRounds`。不要自己写工具循环。

```bash
bun add @veltra/ai
```

样式二选一：入口 `import '@veltra/ai/style'`，或 `VeltraUIResolver` 按需解析 `<u-ai-chat>`。组件根节点 `height: 100%`，**父级必须给明确高度**。

## transport 必填

`AiChatProps.transport` 必填。OpenAI 兼容 `chat/completions` SSE 用 `createOpenAITransport({ providers })`；其它协议实现 `ChatTransport`。旧的单字段 `{ endpoint, apiKey, model }` 已删除。

模型 `id` 必须**跨 Provider 全局唯一**，重复会在创建 transport 时抛错。

生产环境用相对路径 `endpoint` + 服务端代理，**不要把 API Key 下发浏览器**。`apiKey` 只适合受控/本地调试。

```ts
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'openai',
      label: 'OpenAI',
      endpoint: '/api/ai/chat',
      models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini' }]
    }
  ]
})
```

`transport.models` / `transport.defaultModel` 可直接交给 `UAiChat` 的 `models` / `v-model:model`。

## UAiChat

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAiChat, createOpenAITransport, type ChatTool } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{ id: 'openai', endpoint: '/api/ai/chat', models: [{ id: 'gpt-4o-mini' }] }]
})

const model = ref(transport.defaultModel)

const tools: ChatTool[] = [
  {
    name: 'add',
    description: '计算两个整数之和',
    parameters: {
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'number' } },
      required: ['a', 'b']
    },
    execute: ({ a, b }: { a: number; b: number }) => a + b
  },
  {
    name: 'delete_file',
    description: '删除指定路径的文件',
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    needsConfirm: true,
    execute: async ({ path }: { path: string }) => {
      await fetch('/api/files', { method: 'DELETE', body: JSON.stringify({ path }) })
      return { ok: true }
    }
  }
]
</script>

<template>
  <div style="height: 100vh">
    <u-ai-chat
      v-model:model="model"
      :transport="transport"
      :tools="tools"
      :models="transport.models"
    />
  </div>
</template>
```

发给模型的只有 `name` / `description` / `parameters`。`execute`、`needsConfirm`、`terminal`、`render` 只参与本端编排与展示。`execute` 的返回值（非 string 则 `JSON.stringify`）写入 tool 消息回灌模型；`throw` 后状态为 `error`。

`terminal: true` 的工具执行成功后对话结束，适合「UI 即答复」（配合 `render`）。`renderTo: 'panel'` 把自定义组件渲染到右侧面板。

`askQuestion` 由 `useChat` 始终注入，用户传入的同名工具会被丢弃。包入口不导出内置工具工厂。

## useChat（无头）

与 `UAiChat` 共用 `AiChatProps` / `AiChatEmits`，适合自绘 UI：

```ts
import { useChat, createOpenAITransport, type AiChatEmits, type AiChatProps } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [{ id: 'openai', endpoint: '/api/ai/chat', models: [{ id: 'gpt-4o-mini' }] }]
})

const props: AiChatProps = { transport }
const emit: AiChatEmits = () => {}
const { messages, send, abort, running } = useChat({ props, emit })

void send('你好')
```

会话进行中再 `send` 会进入队列，自然结束后 FIFO 接续；手动 `abort` / 出错时队列保留且不自动发。
