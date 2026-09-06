---
title: UAiChat 示例
description: 用必填 transport 接入 UAiChat，生产环境走相对路径代理、不要把 API Key 写进浏览器
---

`UAiChat` 必须传入 `transport`。OpenAI 兼容的 `chat/completions` SSE 用 `createOpenAITransport({ providers })`；其它协议实现 `ChatTransport`。根节点高度为 `100%`，外层容器要有明确高度。样式：`import '@veltra/ai/style'`，或用 `VeltraUIResolver` 解析 `<u-ai-chat>`。

模型 `id` 跨 Provider 必须全局唯一。生产环境只写相对路径 `endpoint`，由后端代理持有密钥；**不要把 API Key 写进浏览器代码**。`apiKey` 仅适合本机调试。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAiChat, createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'proxy',
      label: '业务代理',
      endpoint: '/api/ai/chat',
      models: [{ id: 'gpt-4o-mini', label: 'GPT-4o mini' }]
    }
  ]
})

const model = ref(transport.defaultModel)
</script>

<template>
  <div style="height: 100vh">
    <u-ai-chat
      v-model:model="model"
      :transport="transport"
      :models="transport.models"
      placeholder="输入问题"
    />
  </div>
</template>
```

带工具时传入 `ChatTool[]`。发给模型的只有 `name` / `description` / `parameters`；`execute` 与 `needsConfirm` 只在本端执行。

```vue
<script setup lang="ts">
import { UAiChat, createOpenAITransport, type ChatTool } from '@veltra/ai'
import '@veltra/ai/style'

const transport = createOpenAITransport({
  providers: [{ id: 'proxy', endpoint: '/api/ai/chat', models: [{ id: 'gpt-4o-mini' }] }]
})

const tools: ChatTool[] = [
  {
    name: 'lookup_order',
    description: '按订单号查询状态',
    parameters: {
      type: 'object',
      properties: { orderId: { type: 'string' } },
      required: ['orderId']
    },
    execute: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}`)
      return res.json()
    }
  }
]
</script>

<template>
  <div style="height: 640px">
    <u-ai-chat :transport="transport" :tools="tools" />
  </div>
</template>
```

无头自绘 UI 用同包 `useChat`，props 形状与 `UAiChat` 相同，同样必须传 `transport`。服务端会话用 `createServerTransport(adapter)`。
