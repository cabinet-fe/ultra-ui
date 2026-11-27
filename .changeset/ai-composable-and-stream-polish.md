---
"@veltra/ai": minor
---

- 新增 17 个独立可组合 AI 组件（从 `UAiChat` 拆出 `UAiApprovalBanner`、`UAiAttachments`、`UAiBubble`、`UAiComposer`、`UAiContextPicker`、`UAiContextUsage`、`UAiJobBar`、`UAiMessageList`、`UAiMessageQueue`、`UAiModelPicker`、`UAiQuestionCard`、`UAiReasoning`、`UAiReasoningPicker`、`UAiSessionNav`、`UAiSidePanel`、`UAiStepGroup`、`UAiToolCall`），支持独立导出与按需加载样式。
- 新增按 `contentOffset` 排布回复流工具与 session 模式 `question/requested` 流内关联渲染，并导出 `createQuestionToolMeta`；优化轮次进行中操作区显隐与轮次结束后过程收拢。
- 移除入口无引用的公开导出：`readFileAsAttachment`、`AskQuestionArgs`、`TurnStep`、`ToolCallStatus`、`ChatJobStatus`、`AiAttachmentsSize`、`ChatToolContext`、`UseChatOptions`、`OpenAITransportOptions`。
