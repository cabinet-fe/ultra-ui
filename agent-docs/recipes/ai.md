---
title: Ultra UI AI 对话集成场景
description: 端到端接入 @veltra/ai AI 对话：Node 端（Hono）自建服务端代理持有 API Key（不下发浏览器），浏览器端 UAiChat + createOpenAITransport 完整 SFC，以及无头 useChat 自定义 UI 分支。
aliases: [AI 对话, 聊天接入, 大模型接入, AI 助手, UAiChat]
keywords: [UAiChat, useChat, createOpenAITransport, ChatTool, AiChatProps, AiChatEmits, transport, providers, endpoint, models, needsConfirm, terminal, maxToolRounds, SSE, 流式, 服务端代理, API Key, Hono, chat/completions, 打字机]
---

# Ultra UI AI 对话集成场景

Ultra UI（`@veltra/*`）的 AI 对话方案：`@veltra/ai` 的 `UAiChat` 提供完整对话 UI，`createOpenAITransport` 对接 OpenAI 兼容 `chat/completions` SSE。生产环境 `endpoint` 用相对路径指向自建服务端代理，API Key 只存在服务端环境变量，不下发浏览器；自绘 UI 时改用无头 `useChat`。

## 场景

- 何时用本方案：在业务前端加一个流式对话窗（可带工具调用编排），后端已有或可自建 OpenAI 兼容代理。
- 何时不用：会话状态、审批、历史翻页全部在服务端——改用 `createServerTransport`（见 `ai/use-chat.md`）；只要工具编排细节——见 `ai/ai-chat.md`。

## 完整示例

服务端代理（Node，Hono 示意；Express / Koa 等价实现），Key 从环境变量读取，SSE 原样转发：

```ts
// server/ai-proxy.ts —— 浏览器只访问同源 /api/ai/chat，Key 不出现在前端产物
import { Hono } from 'hono'

const UPSTREAM_BASE_URL = 'https://api.deepseek.com' // 按实际上游替换

export const aiProxyApp = new Hono()

aiProxyApp.post('/api/ai/chat', async (c) => {
  const apiKey = process.env['AI_API_KEY'] // Key 只在服务端环境变量
  if (!apiKey) {
    return c.json({ error: { message: '服务端未配置 AI_API_KEY' } }, 503)
  }

  // 请求体是 OpenAI 兼容 chat/completions 形状（transport 直接发）
  const upstream = await fetch(`${UPSTREAM_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal: c.req.raw.signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${apiKey}` // Key 只在这里注入
    },
    body: JSON.stringify(await c.req.json())
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    // 上游错误原样透传，前端 transport 会包装为 请求失败（<status>）：...
    return new Response(text, { status: upstream.status })
  }
  // SSE 流原样转发，不缓冲
  return new Response(upstream.body, {
    headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'text/event-stream' }
  })
})
```

浏览器端完整 SFC：

```vue
<!-- src/views/AiChatPage.vue -->
<script setup lang="ts">
import type { ChatTool } from '@veltra/ai'
import { UAiChat, createOpenAITransport } from '@veltra/ai'
import '@veltra/ai/style'
import { ref } from 'vue'

// 相对路径走当前 origin；模型 id 跨 Provider 全局唯一，重复创建 transport 时抛错
const transport = createOpenAITransport({
  providers: [
    {
      id: 'proxy',
      label: '业务代理',
      endpoint: '/api/ai/chat', // 指向服务端代理；apiKey 字段不传
      models: [{ id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' }]
    }
  ]
})

// v-model:model 需要可写 ref；默认取首个 Provider 的首个模型
const model = ref(transport.defaultModel)

// 发给模型的只有 name / description / parameters；execute 只在本端执行
const tools: ChatTool[] = [
  {
    name: 'lookupOrder',
    description: '按订单号查询订单状态',
    parameters: {
      type: 'object',
      properties: { orderId: { type: 'string' } },
      required: ['orderId']
    },
    execute: async ({ orderId }: { orderId: string }) => {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error(`查询失败（${res.status}）`) // throw 后该轮状态为 error
      return res.json() // 非 string 返回值会被 JSON.stringify 后回灌模型
    }
  },
  {
    name: 'delete_file',
    description: '删除指定路径的文件',
    needsConfirm: true, // 执行前弹确认卡片，用户允许才执行
    parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    execute: async ({ path }: { path: string }) => {
      await fetch('/api/files', { method: 'DELETE', body: JSON.stringify({ path }) })
      return { ok: true }
    }
  }
]
</script>

<template>
  <!-- 组件根节点 height: 100%，父级必须给明确高度 -->
  <div style="height: 100vh">
    <u-ai-chat
      :transport="transport"
      :tools="tools"
      :models="transport.models"
      v-model:model="model"
      :system-prompt="'你是业务助手'"
      :max-tool-rounds="10"
    />
  </div>
</template>
```

期望结果：输入消息回车后流式打字机输出；模型发起 `lookupOrder` 时自动执行本地工具并把结果回灌模型继续生成；`delete_file` 先弹确认卡片。代理未配 Key 时，对话报错 `请求失败（503）：...`。

## 要点说明

- `transport` 是 `UAiChat` / `useChat` 的必填 prop。OpenAI 兼容 SSE 用 `createOpenAITransport({ providers })`；每个 Provider 至少一个 `models`，空数组抛 `Error('[createOpenAITransport] providers 不能为空')`；模型 `id` 必须**跨 Provider 全局唯一**，重复抛 `Error('[createOpenAITransport] 模型 id "<id>" 重复（跨 Provider 须全局唯一）')`。
- Key 不下发浏览器：浏览器端 `endpoint` 写相对路径（如 `/api/ai/chat`），不传 `apiKey`；代理端从环境变量读 Key、注入 `Authorization: Bearer`、把 SSE 原样转发。`apiKey` 字段仅限本机调试。
- `transport.models`（扁平模型列表）与 `transport.defaultModel`（首个 Provider 的首个模型）可直接交给 `UAiChat` 的 `:models` / `v-model:model`。
- 工具编排：传入 `tools` 后组件内部跑 tool_calls → 执行 `execute` → 结果（非 string 则 `JSON.stringify`）以 `role: 'tool'` 消息回灌 → 继续生成，直到无工具调用、命中 `terminal: true` 的工具或达到 `maxToolRounds`（默认 10）。禁止自己写工具循环。
- `needsConfirm: true` 的工具执行前等用户确认；`terminal: true` 的工具执行成功后对话结束（配合 `render` 做「UI 即答复」）；`renderTo: 'panel'` 把自定义组件渲染到右侧面板。内置提问工具 `askQuestion` 由 `useChat` 始终注入，用户传入的同名工具会被丢弃。
- 无头 `useChat` 分支：与 `UAiChat` 共用 `AiChatProps` / `AiChatEmits` 形状，返回 `messages` / `running` / `send` / `abort` / `regenerate` / `clear` / `respondToolCall` 等；适合自绘 UI。生成中再 `send` 自动进入待发送队列，正常结束 FIFO 接续；手动 `abort` / 出错时队列保留且不自动发。
- 前置：入口 `loadTheme()`（主题硬规则）+ `import '@veltra/ai/style'`（或 `VeltraUIResolver` 自动引入样式）；组件根节点 `height: 100%`，父级必须给明确高度。

## 注意事项

> [!WARNING]
> - 本库 `ChatTransport` 是 `(request, handlers) => void` 的回调形态，不是 fetch 包装，也不是 React AI SDK 的 `useChat`；流式 UI 增量只经 `handlers` 回调（`onTextDelta` / `onToolCall` / `onUsage` 等）。
> - 旧的单字段 `{ endpoint, apiKey, model }` transport 配置已删除；必须用 `createOpenAITransport({ providers })` 或自定义 `ChatTransport`。
> - 生产环境禁止把 API Key 下发浏览器：不要写 `apiKey` 到前端代码，也不要用 `VITE_*` 变量携带 Key（会被编译进前端产物）。
> - 本库是 `UAiChat`（`@veltra/ai`），不是 `useChat`（React AI SDK）；无头 Hook 也叫 `useChat` 但签名是 `useChat({ props, emit })`。
> - 无头 `useChat` 必须自行实现 `emit`（至少处理 `error` 事件），签名断言为 `AiChatEmits`。
> - 工具消息只有 `name` / `description` / `parameters` 发给模型；`execute` / `needsConfirm` / `terminal` / `render` 只参与本端编排与展示。
