---
title: "UAiChat - AI 对话"
description: "UAiChat 组件 API"
---

# UAiChat - AI 对话

## 类型文件

见 `packages/ai/src/types/ai-chat.ts`

## 示例

见 `./examples.md`

## 备注

`transport` 必填。函数型 transport 用 `createOpenAITransport`；生产环境不要把 API Key 下发到浏览器。无头场景用 `useChat`。

## 辅助工具

本组件通常配合以下工具来使用。

### useChat

与 UI 解耦的对话状态机；`UAiChat` 内部即用它，无头场景直接调用。

使用示例:

```ts
import { useChat } from '@veltra/ai'
```

### createOpenAITransport

OpenAI 兼容 SSE transport；按 `request.model` 选择 Provider。

使用示例:

```ts
import { createOpenAITransport } from '@veltra/ai'
```
