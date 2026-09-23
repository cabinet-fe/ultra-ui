# @veltra/ai

## 2.2.1

### Patch Changes

- c23b2c0: - 新增 UKanban 看板组件：列内卡片拖拽排序与跨列转移，v-model:columns 写回，支持 card / header / empty 插槽
  - URichTextEditor 支持图片：工具栏插入、粘贴与拖拽导入，新增 uploadImages 方法供外部上传后回写地址
  - 修复 UFormItem 错误态未压制表达式/代码/富文本编辑器描边的问题
  - 修复条件/表达式编辑器 disabled、readonly 归一成 false 后挡住 UForm 透传的问题
  - 修复表达式编辑器 IME 合成期间占位符不消失的问题
  - UAiChat 过程块改为本轮落定后才折叠，流式输出期间可继续回看工具调用

## 2.2.0

### Minor Changes

- 8d5beb4: 模型选择与推理等级交互重构（对齐 Claude.ai / ChatGPT / Cherry Studio 等的主流形态）：
  
  - 推理等级从模型列表的行内手风琴拆为输入栏右簇的**独立选择器**：当前模型可选等级 ≥2 档时显示，点开为小面板单选；模型列表回归纯扁平列表
  - 模型与推理面板均改为向上弹出（新增的 `UDropdown` `direction` / `alignment` 能力），输入框贴屏幕底部时选项不再溢出视口
  - 模型面板列表超高时内部滚动（上限 280px），模型较多时不再撑破屏幕
  - 移除行内手风琴后，"展开动画期间量高失真导致面板定位漂移"的问题随代码一并消除

## 2.1.11

### Patch Changes

- 6819aa4: UAiChat：输入栏 token 用量改为环形进度展示（悬浮展开明细面板），支持根据模型的 `contextWindow` 计算上下文占用比；生成中在工作指示旁实时跳动计时，收尾停留及历史答案操作区展示本轮耗时；优化消息列表限宽结构，使滚动条挂载于会话主列右侧。

## 2.1.10

### Patch Changes

- 6d87d57: UAiChat：工具卡片与思考过程默认折叠（思考中折叠头部右侧滚动展示最新一行思考）；待确认、有内联 render/插槽的进行中调用与 terminal 答复工具仍自动展开；`autoCollapse` 缺省规则改为一律 `true`（terminal 终结工具缺省 `false`）。消息列表滚动条不再常驻；上翻时的回底入口移至列表下方并改为纯向下箭头按钮。`UAiOrb` 不再作为公共组件导出（无外部使用方，按 patch 处理）。

## 2.1.9

### Patch Changes

- d3ca2e1: fix(ai): UAiChat 消息列表容器补充纵向内边距，首条消息与滚动内容不再贴边

## 2.1.8

### Patch Changes

- 9f3c29a: - 升级 markstream-vue 依赖至 ^2.0.8

## 2.1.7

### Patch Changes

- 3501e45: 修复 Select 等组件样式变量绑定错误与非标 Token：
  - Select / AutoComplete / Contextmenu 修复选项误绑 `--u-nav-*` 侧栏变量的问题，补充对应组件级外观 token 并适配明暗对比度
  - 纠正 Card / DualNav / Breadcrumb / ProgressNodes / ConditionEditor / ExpressionEditor / RichTextEditor 等多处非标与缺失 token 引用
  - 统一修正 `text-color, secondary` 为规范 token `text-color, second`

## 2.1.6

### Patch Changes

- 33022a9: fix(ai): 优化 UAiChat 输入框高度自适应与 placeholder 文本截断样式

## 2.1.5

### Patch Changes

- 23057b4: fix(ai): 优化 UAiChat 输入框内边距样式

## 2.1.4

### Patch Changes

- 75eca4f: - `@veltra/ai`：支持 Token 用量统计展示与清空会话功能。
    - `UAiChat` 与 `useChat` 增加 `tokenUsage`（累计）和 `lastTurnUsage`（单轮）用量跟踪，支持在输入栏展示用量与明细；
    - `UAiChat` 输入栏新增清空会话二次确认按钮，并优化清空后即时恢复空闲欢迎状态的交互。

## 2.1.3

### Patch Changes

- c951706: - `@veltra/sheet-core`：优化表格网格与浮动图性能。改用 `customComputeRowHeight` 按需获取行高并预置列宽，避免全量行高数组遍历与反复重绘；优化单元格遍历与图片图层 DOM / ObjectURL 管理。
  - `@veltra/sheet`：优化 sheet 切换激活逻辑，避免切 tab 时全量重放列宽与重复同步模型。
  - `@veltra/ai`：优化 AI 对话样式。加固 Markstream 变量作用域与小屏列表边距，调整折叠工具项与输入框层级阴影样式。

## 2.1.2

### Patch Changes

- dec95c9: 修复思考过程与「生成出错 / 已停止生成」状态文字在默认主题下对比度过低的问题（`assist` → `second`）。
  
  新增轮次级「已完成」折叠块：一轮对话中最终答案开始输出（或该轮结束）后，之前的思考与工具调用过程自动收起并卸载过程 DOM，点击可展开逐层钻取；regenerate 重跑时过程自动复位为实时可见。载入历史会话时思考块默认折叠。
- dec95c9: 空闲欢迎区钉在输入框上方（滚动容器外），工作中活体球立即跳到列表末尾、结束后跳回；thinking 状态在球体右上角显示同色「?」。

## 2.1.1

### Patch Changes

- 9244226: 修复受控 `v-model:messages` 下流式 assistant 回复被父级快照回显冲掉的问题。

## 2.1.0

### Minor Changes

- 14cdce4: UAiChat 优化消息流式吸底体验，支持复制与重新生成消息，思考过程与工具卡片折叠卸载 DOM 降低长对话渲染开销。
- b1d6b24: UAiChat 工具渲染新增 `renderTo: 'panel'`：工具的 `render` 组件可展示在对话区右侧的侧边面板中（新调用自动打开聚焦，工具卡片仅留「查看面板」入口可切回历史调用），适合后台页面、表单、图表、列表等大交互区工具；`ChatTool.panelWidth` 可指定该工具面板的默认宽度（缺省 420px）。面板与会话区布局基于 `ULayout` 分列，宽度支持拖拽调节。

  `ULayout` 新增 `colMinSizes` 属性（按列约束 resizable 拖拽的最小宽度）与 `resize-start` / `resize-end` 事件；程序化变更 `cols` 时拖拽手柄位置同步更新。

### Patch Changes

- b1d6b24: UAiChat 欢迎区活体球缩小、工作指示球放大；对话结束或失败时工作球停留约 2.5 秒再隐藏（成功播 happy，出错播 frustrated）。
- b1d6b24: UAiChat 输入区发送与停止按钮互斥：会话进行中输入为空时显示停止，有内容时显示发送（加入待发送队列）。
- 065f5c5: 优化模型选择器的推理等级交互：移除突兀弹出的右侧思考强度子面板，改为在模型行下方行内手风琴平滑展开；已选中模型的等级胶囊展示当前推理等级而非默认等级。

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
