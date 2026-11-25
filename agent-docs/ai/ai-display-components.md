---
title: UAiMessageList AI 消息展示与编排组件
description: '@veltra/ai 独立导出的 11 个展示与状态编排组件：UAiMessageList 消息列表、UAiBubble 气泡、UAiStepGroup 步骤行、UAiToolCall 工具卡、UAiReasoning 思考块、UAiQuestionCard 提问卡、UAiSidePanel 侧面板、UAiMessageQueue 队列条、UAiJobBar 作业条、UAiApprovalBanner 审批横幅与 UAiSessionNav 圆点导航。'
aliases:
  [
    AiMessageList,
    AiBubble,
    AiStepGroup,
    AiToolCall,
    AiReasoning,
    AiQuestionCard,
    AiSidePanel,
    AiMessageQueue,
    AiJobBar,
    AiApprovalBanner,
    AiSessionNav,
    AI 消息列表
  ]
keywords:
  [
    UAiMessageList,
    UAiBubble,
    UAiStepGroup,
    UAiToolCall,
    UAiReasoning,
    UAiQuestionCard,
    UAiSidePanel,
    UAiMessageQueue,
    UAiJobBar,
    UAiApprovalBanner,
    UAiSessionNav,
    AiStepItem,
    AiSessionNavItem,
    ChatPendingApproval,
    AskQuestionItem,
    open-panel,
    preview-image,
    scrollToLatest,
    jumpToTurn
  ]
---

# UAiMessageList AI 消息展示与编排组件

`@veltra/ai` 导出 11 个可脱离 `UAiChat` 独立挂载的展示与编排组件，覆盖消息流渲染（`UAiMessageList`、`UAiBubble`、`UAiStepGroup`、`UAiToolCall`、`UAiReasoning`）、交互与侧边工作区（`UAiQuestionCard`、`UAiSidePanel`）以及队列/作业/审批/导航（`UAiMessageQueue`、`UAiJobBar`、`UAiApprovalBanner`、`UAiSessionNav`）。所有组件均可在无 `AiChatDIKey` 注入时仅靠显式 props/emits/slots 完整运行。

## 快速上手

前置：应用入口已执行 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。列表组件根节点 `height: 100%`，父容器必须提供明确高度。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UAiMessageList, type ChatMessage } from '@veltra/ai'

const messages = ref<ChatMessage[]>([
  { id: 'u1', role: 'user', content: '解释一下流式渲染' },
  {
    id: 'a1',
    role: 'assistant',
    reasoning: '组织简明要点…',
    content: '流式输出通过增量更新 `content` 字段并结合节流渲染降低重排开销。',
    status: 'done'
  }
])
</script>

<template>
  <div style="height: 360px">
    <UAiMessageList
      :messages="messages"
      :welcome="['继续提问示例']"
      @welcome-click="
        (text) => messages.push({ id: String(Date.now()), role: 'user', content: text })
      "
    />
  </div>
</template>
```

## API 签名

```ts
import type {
  AskQuestionAnswer,
  AskQuestionItem,
  ChatJob,
  ChatMessage,
  ChatPendingApproval,
  ChatQueuedMessage,
  ChatTool,
  ChatToolCall,
  ChatToolMeta
} from '@veltra/ai'
import type { Component } from 'vue'

export interface AiMessageListProps {
  messages: ChatMessage[]
  welcome?: string | string[]
  /** 是否处于生成中，默认 false */
  running?: boolean
  /** 只读模式：禁用欢迎语发送与重新生成操作，默认 false */
  readonly?: boolean
  /** 是否显示底部常驻欢迎/工作态栏，默认 true */
  showWelcome?: boolean
  /** 是否显示左侧会话轮次导航，默认 true */
  showNavigator?: boolean
  /** 工具定义或元信息（数组或按 name 索引的映射），显式传值优先于 DI */
  tools?: (ChatTool | ChatToolMeta)[] | Record<string, ChatTool | ChatToolMeta | undefined>
  toolIcons?: Record<string, Component>
  rendererProps?: Record<string, unknown>
}

export interface AiMessageListEmits {
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'regenerate'): void
  (e: 'welcome-click', text: string): void
  (e: 'open-panel', toolCallId: string): void
  (e: 'preview-image', src: string, alt?: string): void
}

export interface AiMessageListExposed {
  scrollToLatest: () => Promise<void>
  jumpToTurn: (key: string) => void
}

export interface AiBubbleProps {
  message: ChatMessage
  /** 是否为全局最后一条可见消息，默认 false */
  isLast?: boolean
  /** 是否显示底部操作区；未传时仅 assistant 且 isLast 且已终态显示 */
  showActions?: boolean
  /** 是否显示重新生成按钮，默认 true */
  showRegenerate?: boolean
  /** 本轮用时（ms），非空时在操作区左侧展示「用时 Xs」 */
  duration?: number
  rendererProps?: Record<string, unknown>
}

export interface AiBubbleEmits {
  (e: 'regenerate'): void
  (e: 'copy', content: string): void
  (e: 'preview-image', src: string, alt?: string): void
}

export interface AiStepItem {
  key: string
  kind: 'reasoning' | 'tool'
  message: ChatMessage
  toolCall?: ChatToolCall
}
export type TurnStep = AiStepItem

export interface AiStepGroupProps {
  steps: AiStepItem[]
  /** 是否流式进行中，默认 false */
  live?: boolean
  /** 段末异常终态（仅 'error' | 'aborted' 着危险色） */
  endStatus?: 'error' | 'aborted'
  tools?: (ChatTool | ChatToolMeta)[] | Record<string, ChatTool | ChatToolMeta | undefined>
  toolIcons?: Record<string, Component>
  /** 未传时默认折叠，仅需要确认或内联 render 时自动展开 */
  defaultExpanded?: boolean
}

export interface AiStepGroupEmits {
  (e: 'respond', toolCallId: string, approved: boolean): void
  (e: 'open-panel', toolCallId: string): void
}

export interface AiToolCallProps {
  toolCall: ChatToolCall
  tool?: ChatTool | ChatToolMeta
  toolIcons?: Record<string, Component>
  /** 未传时默认折叠；awaiting-confirm / 内联 render / terminal 自动展开 */
  defaultExpanded?: boolean
}

export interface AiToolCallEmits {
  (e: 'respond', approved: boolean): void
  (e: 'open-panel', toolCallId: string): void
}

export interface AiReasoningProps {
  content: string
  /** 是否仍在思考中，默认 false */
  thinking?: boolean
  /** 思考耗时（ms）；>= 1000ms 时标题显示耗时 */
  duration?: number
  /** 记忆思考耗时的缓存 key（跨折叠卸载保留） */
  cacheKey?: string
  /** 是否默认展开，默认 false */
  defaultExpanded?: boolean
}

export interface AiQuestionCardProps {
  questions: AskQuestionItem[]
  /** 有值时展示只读已答摘要 */
  answers?: AskQuestionAnswer[]
  /** answers 为空且 error 非空时展示错误文案 */
  error?: string
}

export interface AiQuestionCardEmits {
  (e: 'submit', answers: AskQuestionAnswer[]): void
}

export interface AiSidePanelProps {
  toolCall?: ChatToolCall
  tool?: ChatTool | ChatToolMeta
  toolIcons?: Record<string, Component>
  /** 标题优先级：title > tool.panelTitle > tool.label > toolCall.name */
  title?: string
  icon?: Component
  /** 全屏受控状态，支持 v-model:fullscreen；切换 toolCall.id 时自动退出全屏 */
  fullscreen?: boolean
  /** 是否显示刷新按钮，默认 true */
  refreshable?: boolean
  /** 是否显示全屏按钮，默认 true */
  fullscreenable?: boolean
  /** 是否显示关闭按钮，默认 true */
  closable?: boolean
}

export interface AiSidePanelEmits {
  (e: 'update:fullscreen', fullscreen: boolean): void
  (e: 'refresh'): void
  (e: 'close'): void
}

export interface AiSidePanelExposed {
  fullscreen: boolean
  refresh: () => void
}

export interface AiMessageQueueProps {
  /** 待发送队列；空数组时不渲染 */
  queue: ChatQueuedMessage[]
  readonly?: boolean
}

export interface AiMessageQueueEmits {
  (e: 'start-now', id: string): void
  (e: 'edit', id: string): void
  (e: 'remove', id: string): void
}

export interface AiJobBarProps {
  /** 作业列表；空数组时不渲染 */
  jobs: ChatJob[]
  toolIcons?: Record<string, Component>
  /** 是否默认展开，默认 true */
  defaultExpanded?: boolean
}

export interface AiApprovalBannerProps {
  approvals: ChatPendingApproval[]
  /** 是否仅展示无 callId 的审批项，默认 true */
  filterUnlinked?: boolean
}

export interface AiApprovalBannerEmits {
  (e: 'respond', rpcId: string, approved: boolean): void
}

export interface AiSessionNavItem {
  key: string
  index: number
  question: string
  answer?: string
}

export interface AiSessionNavProps {
  items: AiSessionNavItem[]
  activeKey?: string
  /** 是否可滚动，默认 true */
  scrollable?: boolean
  /** 显示导航的最小轮次数，默认 3；仅 items.length >= minItems && scrollable 时渲染 */
  minItems?: number
}

export interface AiSessionNavEmits {
  (e: 'jump', key: string): void
}
```

## 参数说明

| 组件                | 关键参数与默认/约束                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UAiMessageList`    | `messages` 必填；`running=false`、`readonly=false`、`showWelcome=true`、`showNavigator=true`；`role === 'tool'` 自动过滤；内部向下 `provide` 合并后的 `tools` / `toolIcons` / `slots` |
| `UAiBubble`         | `message` 必填；`isLast=false`、`showRegenerate=true`、`showActions=undefined`；`duration` 单位 ms（`<60s` 显示 `Xs`，`>=60s` 显示 `Xm Ys`）                                          |
| `UAiStepGroup`      | `steps` 必填；`live=false`、`defaultExpanded=undefined`；`endStatus` 仅 `'error' \| 'aborted'` 着危险色，否则显示 `执行了 N 个步骤`                                                   |
| `UAiToolCall`       | `toolCall` 必填；`defaultExpanded=undefined`；显式传 `defaultExpanded` 后禁用状态驱动自动展开/折叠；`tool.renderTo === 'panel'` 时卡片内仅显示「查看面板」按钮                        |
| `UAiReasoning`      | `content` 必填；`thinking=false`、`defaultExpanded=false`；展开区限高 `220px` 且流式自动吸底；`<1000ms` 仅显示 `思考过程`                                                             |
| `UAiQuestionCard`   | `questions` 必填；`answers` 非空切入只读摘要态；支持 `options` 字符串或 `{ label, description }`（剥离 `(推荐)`/`(Recommended)` 生成徽标）、`multiple` 多选与内联输入                 |
| `UAiSidePanel`      | 全部可选；`refreshable=true`、`fullscreenable=true`、`closable=true`、`fullscreen=undefined`；切换 `toolCall.id` 自动置 `fullscreen` 为 `false`                                       |
| `UAiMessageQueue`   | `queue` 必填；`readonly=false`（`true` 时隐藏插队/编辑/移除按钮）；空数组不渲染                                                                                                       |
| `UAiJobBar`         | `jobs` 必填；`defaultExpanded=true`；`status === 'running'` 文字应用 `u-shine` 扫光；空数组不渲染                                                                                     |
| `UAiApprovalBanner` | `approvals` 必填；`filterUnlinked=true`（仅保留 `!item.callId` 项）；过滤后为空不渲染                                                                                                 |
| `UAiSessionNav`     | `items` 必填；`scrollable=true`、`minItems=3`；需同时满足 `items.length >= minItems && scrollable` 才渲染                                                                             |

## 方法与事件

- **通用 DI 回落规则**：`UAiMessageList`、`UAiStepGroup`、`UAiToolCall`、`UAiBubble`、`UAiSidePanel`、`UAiJobBar` 通过 `inject(AiChatDIKey, undefined)` 读取上下文。`open-panel` 与 `preview-image` 均**先 emit 事件**，仅当父组件未显式绑定该事件监听器时再回落父级 DI 回调，不会重复触发。
- **`UAiMessageList`**：事件 `respond` / `regenerate` / `welcome-click` / `open-panel` / `preview-image`；插槽 `#welcome`、`#tool-<name>="{ toolCall }"`；Exposed `scrollToLatest()`（异步 `Promise<void>`）、`jumpToTurn(key)`（同步）。
- **`UAiBubble`**：事件 `regenerate`、`copy(content)`（写入剪贴板成功时触发并弹提示，权限失败弹错误提示）、`preview-image(src, alt?)`；插槽默认 `default="{ message, content, streaming }"`、`#actions="{ message, duration, copied, canCopy, copy, regenerate }"`。
- **`UAiStepGroup`**：事件 `respond(toolCallId, approved)`、`open-panel(toolCallId)`；插槽默认 `default="{ steps }"`、`#step="{ step, index }"`。
- **`UAiToolCall`**：事件 `respond(approved)`、`open-panel(toolCallId)`；插槽 `#header-extra="{ toolCall }"`、默认 `default="{ toolCall }"`。
- **`UAiSidePanel`**：事件 `update:fullscreen`、`refresh`、`close`；插槽 `#header-actions="{ fullscreen, refresh }"`、默认 `default="{ toolCall, refreshKey }"`；Exposed `fullscreen`（布尔值）、`refresh()`（递增 `refreshKey` 强制重建面板主体实例）。
- **`UAiQuestionCard`**：事件 `submit(answers)`（全部题完成或跳过时派发，支持非输入聚焦下 `1-9` 选选项、`Enter` 前进/提交、`←`/`→` 切题）。
- **`UAiMessageQueue` / `UAiApprovalBanner` / `UAiSessionNav`**：分别派发 `start-now` / `edit` / `remove`、`respond(rpcId, approved)`、`jump(key)`；`UAiReasoning` 与 `UAiJobBar` 无自定义事件（`UAiReasoning` 含默认插槽覆盖思考文本）。

## 典型示例

### 脱离 UAiChat 组合列表、侧边面板与图片预览

```vue
<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue'
import {
  UAiMessageList,
  UAiSidePanel,
  type AiMessageListExposed,
  type ChatMessage,
  type ChatToolCall,
  type ChatToolMeta
} from '@veltra/ai'
import { UImagePreviewer, ULayout } from '@veltra/desktop'

const listRef = useTemplateRef<AiMessageListExposed>('listRef')
const activeCallId = ref<string | null>('call-1')
const fullscreen = ref(false)
const previewOpen = ref(false)
const previewTarget = shallowRef<{ src: string; alt?: string } | null>(null)

const tools: ChatToolMeta[] = [
  { name: 'inspectReport', label: '巡检报告', renderTo: 'panel', panelTitle: '系统巡检详情' }
]
const messages = ref<ChatMessage[]>([
  { id: 'u1', role: 'user', content: '查看服务巡检详情' },
  {
    id: 'a1',
    role: 'assistant',
    content: '已生成巡检快照，点击卡片「查看面板」可重新打开右侧详情。',
    status: 'done',
    toolCalls: [
      {
        id: 'call-1',
        name: 'inspectReport',
        arguments: '{"service":"gateway"}',
        status: 'success',
        result: '{"healthy":true,"latencyMs":28}'
      }
    ]
  }
])

const activeCall = computed<ChatToolCall | undefined>(() =>
  messages.value.flatMap((m) => m.toolCalls ?? []).find((c) => c.id === activeCallId.value)
)

const handlePreviewImage = (src: string, alt?: string) => {
  if (!src) return
  previewTarget.value = { src, alt }
  previewOpen.value = true
}
</script>

<template>
  <ULayout
    style="position: relative; height: 480px"
    :cols="activeCall ? ['1fr', '380px'] : ['1fr']"
    rows="1fr"
    :resizable="Boolean(activeCall)"
  >
    <UAiMessageList
      ref="listRef"
      :messages="messages"
      :tools="tools"
      @open-panel="(id) => (activeCallId = id)"
      @preview-image="handlePreviewImage"
    />
    <UAiSidePanel
      v-if="activeCall"
      v-model:fullscreen="fullscreen"
      :tool-call="activeCall"
      :tool="tools[0]"
      @close="activeCallId = null"
    />
    <UImagePreviewer
      v-model:open="previewOpen"
      :src="previewTarget?.src"
      :alt="previewTarget?.alt"
    />
  </ULayout>
</template>
```

### 独立使用提问卡、作业条、审批横幅与排队列表

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  UAiApprovalBanner,
  UAiJobBar,
  UAiMessageQueue,
  UAiQuestionCard,
  type AskQuestionAnswer,
  type AskQuestionItem,
  type ChatJob,
  type ChatPendingApproval,
  type ChatQueuedMessage
} from '@veltra/ai'

const questions: AskQuestionItem[] = [
  { header: '环境', question: '选择目标部署环境', options: ['测试环境 (推荐)', '生产环境'] }
]
const answers = ref<AskQuestionAnswer[]>()
const jobs = ref<ChatJob[]>([{ id: 'j1', kind: 'bash', label: '构建静态资源', status: 'running' }])
const approvals = ref<ChatPendingApproval[]>([
  { approvalId: 'a1', toolName: 'deploy', reason: '发布版本到生产集群', rpcId: 'rpc-1' }
])
const queue = ref<ChatQueuedMessage[]>([{ id: 'q1', content: '发布完成后发送变更摘要' }])

const handleApproval = (rpcId: string, approved: boolean) => {
  console.log('审批结果：', rpcId, approved)
  approvals.value = approvals.value.filter((item) => item.rpcId !== rpcId)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 10px">
    <UAiQuestionCard :questions="questions" :answers="answers" @submit="(res) => (answers = res)" />
    <UAiApprovalBanner :approvals="approvals" @respond="handleApproval" />
    <UAiJobBar :jobs="jobs" />
    <UAiMessageQueue
      :queue="queue"
      @start-now="(id) => console.log('插队：', id)"
      @edit="(id) => console.log('编辑：', id)"
      @remove="(id) => (queue = queue.filter((q) => q.id !== id))"
    />
  </div>
</template>
```

## 注意事项

> [!WARNING]
>
> - `UAiSidePanel` 的全屏态（`fullscreen: true`）通过 `position: absolute; inset: 0;` 铺满定位父容器；父容器必须设置 `position: relative` 和明确高度，否则全屏面板会相对外层定位祖先溢出。
> - `UAiChat` 的 `800px` 居中限宽与负边距滚动条定位属于壳层布局，独立组件默认 `width: 100%`；脱离 `UAiChat` 使用时如需限宽居中需在业务外层自行控制。
> - 本包**不导出**内部组件 `UAiOrb`、`reply-tool.vue`、`createBuiltinTools` 以及 `_shared` 其余内部工具；活体球仅作为 `UAiMessageList` 内部吉祥物栏工作，当不需要该栏时传入 `:show-welcome="false"` 即可隐藏。
> - `UAiMessageList` 自身会向子组件注入合并后的 `AiChatDIKey` 上下文；若直接在外部单独使用 `UAiToolCall` 或 `UAiStepGroup` 且脱离 `UAiMessageList`，需通过 `:tool` / `:tools` 与 `:tool-icons` 显式传入元信息，否则未知工具走通用 `<pre>` 原始数据卡片视图。
