---
'@veltra/ai': minor
---

`ChatTool` 支持 UI 元信息：`icon`（自定义工具图标）、`label`（显示名）、`render`（自定义卡片内容渲染，组件或渲染函数，props 为 `{ toolCall }`，优先于 `tool-<name>` 插槽）与 `autoCollapse`（完成后是否自动折叠；缺省：有 `render` 时为 `false`，否则为 `true`）。注意：`tool-<name>` 插槽现在替换卡片整个 body（原先仅替换结果区）。新增内置提问工具 `createAskQuestionTool()`：模型可在需求不明确时发起提问，用户在工具卡片的内联分页表单中逐题作答（预设选项 + 自定义输入，「上一个 / 下一个」导航，末题显示「提交」），提交后回答回灌模型并展示问答摘要。
