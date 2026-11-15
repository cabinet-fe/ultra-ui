---
"@veltra/utils": minor
---

新增 `AiAttachment` 类型并扩展 `AiMessage.attachments` 支持非图片文本附件上下文；跳过空 `assistant` 占位并为中止轮次未完成的 `toolCalls` 补齐兜底结果；修复 `parseOpenAISSEStream` 在中止后仍刷新工具调用的问题。
