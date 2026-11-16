---
"@veltra/utils": minor
---

新增 OpenAI Responses API 请求层：`buildOpenAIResponsesBody()`（instructions / input 项 / 扁平工具构造）、`parseOpenAIResponsesSSEStream()`（output_text、reasoning、function_call 与 usage 事件解析）、`requestOpenAIResponsesStream()`；`postOpenAI()` 公开导出且非 2xx 时返回原 Response（供调用方降级重试），SSE 泵取与 usage 解析抽为内部共享实现（`ai/shared.ts`，行为不变）。
