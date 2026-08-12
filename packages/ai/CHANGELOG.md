# @veltra/ai

## 2.0.0

### Major Changes

- 1a8d118: 提问工具改为 UAiChat 始终内置自动注入；移除公开导出 `createAskQuestionTool`（保留 `AskQuestion*` 类型）。用户无需再手动创建并传入该工具，同名用户工具将被忽略。

### Minor Changes

- 1a8d118: `createOpenAITransport` 改为多 Provider 配置（按模型路由；支持完整 URL / 相对路径）；UAiChat 输入栏增加模型与推理等级选择器（`models` / `v-model:model` / `v-model:reasoning-level`）。旧的单字段 `{ endpoint, apiKey, model }` 选项已移除。

## 1.4.0

### Minor Changes

- 600b6a8: `ChatTool` 支持 UI 元信息：`icon`（自定义工具图标）、`label`（显示名）、`render`（自定义卡片内容渲染，组件或渲染函数，props 为 `{ toolCall }`，优先于 `tool-<name>` 插槽）与 `autoCollapse`（完成后是否自动折叠；缺省：有 `render` 时为 `false`，否则为 `true`）。注意：`tool-<name>` 插槽现在替换卡片整个 body（原先仅替换结果区）。新增内置提问工具 `createAskQuestionTool()`：模型可在需求不明确时发起提问，用户在工具卡片的内联分页表单中逐题作答（预设选项 + 自定义输入，「上一个 / 下一个」导航，末题显示「提交」），提交后回答回灌模型并展示问答摘要。
- 285e795: 新增 `@veltra/ai` 包：`UAiChat` AI 对话组件。以工具定义为核心，传入不同 `tools` 即可赋予助手不同能力；组件自动编排工具调用循环（tool_calls → 执行 → 结果回灌），支持 `needsConfirm` 内联确认、停止/重新生成、思考过程折叠展示与图片附件。渲染基于 `markstream-vue` 流式 markdown；通信层为可插拔 `ChatTransport` 适配器，内置零依赖的 `createOpenAITransport()`（OpenAI 兼容 SSE），也可自定义接入任意后端。同步导出与 UI 解耦的 `useChat()` 对话编排状态机，可用于无头（headless）场景。

### Patch Changes

- 394ea96: UCollapse 视觉改为边框卡片风格（对齐 AI tool-call），默认展开图标改为 ArrowDown 并旋转 180°；移除 collapse 专用 mix/theme token。`UCollapseItem` 支持独立 `v-model`；`UAiChat` tool-call 卡片直接复用独立 `UCollapseItem`，去掉重复的卡片壳与 chevron 样式。
- Updated dependencies [394ea96]
  - @veltra/desktop@1.4.0
  - @veltra/styles@1.4.0
  - @veltra/utils@1.4.0
  - @veltra/compositions@1.4.0
  - @veltra/icons@1.4.0
