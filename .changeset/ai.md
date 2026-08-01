---
'@veltra/ai': minor
---

新增 `@veltra/ai` 包：`UAiChat` AI 对话组件。以工具定义为核心，传入不同 `tools` 即可赋予助手不同能力；组件自动编排工具调用循环（tool_calls → 执行 → 结果回灌），支持 `needsConfirm` 内联确认、停止/重新生成、思考过程折叠展示与图片附件。渲染基于 `markstream-vue` 流式 markdown；通信层为可插拔 `ChatTransport` 适配器，内置零依赖的 `createOpenAITransport()`（OpenAI 兼容 SSE），也可自定义接入任意后端。同步导出与 UI 解耦的 `useChat()` 对话编排状态机，可用于无头（headless）场景。
