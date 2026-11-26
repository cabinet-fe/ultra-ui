---
title: UAiButton AI 按钮
description: '@veltra/desktop 导出的 AI 图标按钮：点击按 OpenAI 兼容 chat/completions 协议发起一次文本生成，流式增量经 delta、结果经 success、失败经 error 事件抛出；服务商配置按字段合并（实例 provider 覆盖全局 useConfig 的 ai 键），pre-input 变体先经气泡收集补充输入、确认后再请求。'
aliases: [AiButton, AI 按钮, AI 图标按钮, ai-button, Sparkles 按钮, 智能按钮]
keywords:
  [
    UAiButton,
    AiButtonProps,
    AiButtonEmits,
    AiButtonVariant,
    provider,
    systemPrompt,
    prompt,
    variant,
    pre-input,
    requestAiText,
    AiProviderConfig,
    delta,
    success,
    error,
    confirm,
    cancel,
    AI 按钮,
    流式生成,
    文本生成,
    补充输入
  ]
---

# UAiButton AI 按钮

`@veltra/desktop` 导出 AI 图标按钮 `UAiButton`（`AiButtonProps` / `AiButtonEmits` / `AiButtonVariant` / `AiButtonExposed` 类型同包导出）。组件渲染一枚 Sparkles 图标按钮，点击按 OpenAI 兼容 chat/completions 协议 POST 一次文本生成请求：`stream: false` 时一次性返回，`stream: true` 时逐段经 `delta` 抛出、结束后 `success` 抛出拼接完整文本；每次点击都是独立单轮请求，组件不保存对话历史。

## 快速上手

应用入口设置全局服务商配置（与 `compositions/use-config.md` 的 `ai` 键同一份状态），页面直接使用组件：

```ts
// src/main.ts —— UAiButton 依赖服务商配置，入口处设置全局兜底
import { useConfig } from '@veltra/compositions'

const { setConfig } = useConfig()

setConfig({
  ai: {
    url: 'https://api.example.com/v1/chat/completions', // OpenAI 兼容 chat/completions 完整地址
    apiKey: '<your-token>', // 缺省时不带 Authorization 头
    model: 'gpt-x'
  }
})
```

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UAiButton } from '@veltra/desktop'

const answer = ref('')

function onSuccess(text: string) {
  answer.value = text // 非流式为完整文本；流式为全部增量拼接结果
}

function onError(error: Error) {
  console.error(error.message) // 组件不弹全局提示，必须自行处理
}
</script>

<template>
  <UAiButton prompt="总结这段需求文档的要点" system-prompt="你是需求分析助手" @success="onSuccess" @error="onError" />
  <!-- 点击按钮即发请求；生成中按钮 loading 并忽略重复点击 -->
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、按钮无颜色。样式随组件模块自动按需加载，无需显式样式引入。

## API 签名

```ts
export type AiButtonVariant = 'default' | 'pre-input'

/** OpenAI 兼容服务商配置（完整类型在 @veltra/utils，此处列出组件用到的字段） */
export interface AiProviderConfig {
  /** OpenAI 兼容 chat/completions 的完整请求地址。必填 */
  url: string
  /** Bearer Token，缺省不带 Authorization 头 */
  apiKey?: string
  /** 模型 id。必填 */
  model: string
  /** 推理等级；提供时请求体写入 reasoning_effort，缺省不写入 */
  reasoningLevel?: string
  /** 是否流式返回。缺省 false */
  stream?: boolean
}

export interface AiButtonProps {
  /** 三档尺寸：'small' | 'default' | 'large'。默认 'default'，透传给内部 UButton */
  size?: 'small' | 'default' | 'large'
  /**
   * 服务商配置，字段级覆盖 useConfig 全局 ai 配置。
   * 优先级：实例 provider 字段 > 全局 ai 同名字段 > 默认值（stream 缺省 false）
   */
  provider?: Partial<AiProviderConfig>
  /** 系统提示词，存在时作为 messages 首条 system 消息 */
  systemPrompt?: string
  /** 用户提示词，作为 user 消息内容；未传按空串 '' 发送 */
  prompt?: string
  /**
   * 变体
   * - 'default'：点击即发起请求
   * - 'pre-input'：点击展开气泡，经 #pre-input 插槽收集补充输入，确认后才发起请求
   * @default 'default'
   */
  variant?: AiButtonVariant
}

export interface AiButtonEmits {
  /** 生成成功：非流式为完整文本，流式为全部增量拼接的完整文本 */
  (event: 'success', text: string): void
  /** 生成失败：网络错误、非 2xx 响应、流中断、响应无文本；组件不弹全局提示 */
  (event: 'error', error: Error): void
  /** 流式文本增量，仅 stream: true 时逐段触发 */
  (event: 'delta', chunk: string): void
  /** pre-input 变体点击确认（随后发起请求） */
  (event: 'confirm'): void
  /** pre-input 变体点击取消（不发起请求） */
  (event: 'cancel'): void
}
```

组件 ref 上没有可调用的暴露方法；唯一插槽是 `#pre-input`（仅 `pre-input` 变体生效，放气泡内的补充输入控件）。

## 参数说明

| 参数           | 类型                        | 默认        | 必填 | 约束                                                                                                |
| -------------- | --------------------------- | ----------- | :--: | --------------------------------------------------------------------------------------------------- |
| `provider`     | `Partial<AiProviderConfig>` | —           |  否  | 与全局 `config.ai` 按字段合并：实例字段 > 全局同名字段 > 默认值；合并后 `url` 与 `model` 必须有值   |
| `systemPrompt` | `string`                    | —           |  否  | 存在时作为首条 system 消息；不存在时 messages 只有 user 一条                                        |
| `prompt`       | `string`                    | —           |  否  | user 消息内容；未传按空串发送                                                                       |
| `variant`      | `'default' \| 'pre-input'`  | `'default'` |  否  | `default` 点击即请求；`pre-input` 点击先开气泡，确认后才请求                                        |
| `size`         | `'small' \| 'default' \| 'large'` | `'default'` |  否  | 透传给内部 UButton                                                                                  |

## 方法与事件

请求行为（点击触发，生成中按钮 `is-loading` 并忽略重复点击，结束后恢复可点）：

- 请求体：`{ model, messages: [system?, user], stream, reasoning_effort? }`；`reasoning_effort` 仅在配置了 `reasoningLevel` 时写入。
- 请求头：`Content-Type: application/json`；配置了 `apiKey` 时附带 `Authorization: Bearer <apiKey>`，缺省不带。
- `success`（`text: string`）：非流式为响应完整文本；流式为全部 `delta` 增量拼接结果。
- `delta`（`chunk: string`）：仅流式逐段触发；渲染过程文本用增量累加即可。
- `error`（`error: Error`）：网络错误、非 2xx 响应（message 形如 `请求失败（500）：<响应体或状态文本>`）、响应 JSON 里解析不出文本（message 为 `响应不包含可解析的文本内容`；JSON 语法本身非法时抛原生解析错误）、流中断；组件不弹全局提示，必须监听后自行处理。
- `confirm` / `cancel`：仅 `pre-input` 变体；确认后关闭气泡并**立即以当前 `prompt` prop 值**发起请求（prop 更新要等下一轮渲染，本轮来不及生效），取消只关闭气泡不发请求。

请求无法中途取消：组件未暴露中断手段，点击后到回调触发前按钮处于 loading。

## 典型示例

### 全局配置 + 流式增量渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UAiButton } from '@veltra/desktop'

// 全局配置在入口 setConfig 一次即可；此处实例只再开流式
const streaming = ref(false)
const output = ref('')

function onDelta(chunk: string) {
  streaming.value = true
  output.value += chunk // 过程文本用增量累加
}

function onSuccess(text: string) {
  streaming.value = false
  output.value = text // 结束后以全量拼接文本为准
}
</script>

<template>
  <UAiButton prompt="把这段话改写成公告语气" :provider="{ stream: true }" @delta="onDelta" @success="onSuccess" />
</template>
```

### pre-input 变体：响应式派生提示词

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

import { UAiButton } from '@veltra/desktop'

// #pre-input 插槽内容不会自动进入请求；prompt 必须响应式派生自插槽状态
const extra = ref('')

// computed 持续派生：点确认发起请求时组件读到的就是最新值
const prompt = computed(() =>
  extra.value ? `生成项目周报，额外要求：${extra.value}` : '生成项目周报'
)

// @confirm 只做埋点这类不依赖本次请求内容的事
function onConfirm() {
  console.log('用户确认发起周报生成')
}
</script>

<template>
  <UAiButton variant="pre-input" :prompt="prompt" @confirm="onConfirm">
    <template #pre-input>
      <textarea v-model="extra" placeholder="填写额外要求（可选）" />
    </template>
  </UAiButton>
  <!-- 点击按钮只开气泡不发请求；点确认立即以 prompt 当前值发起请求，点取消不发请求 -->
</template>
```

### 实例级覆盖全局配置（多模型并存）

```ts
// src/main.ts —— 前提：全局配置一份兜底
import { useConfig } from '@veltra/compositions'

const { setConfig } = useConfig()

setConfig({
  ai: { url: 'https://api.example.com/v1/chat/completions', apiKey: '<your-token>', model: 'gpt-x' }
})
```

```vue
<script setup lang="ts">
import { UAiButton } from '@veltra/desktop'
</script>

<template>
  <!-- 全局 ai 配置照常生效，仅本实例换模型并关流式（字段级覆盖，其余字段继承全局） -->
  <UAiButton prompt="翻译为英文" :provider="{ model: 'gpt-translate', stream: false }" />
</template>
```

## 注意事项

> [!WARNING]
>
> - `UAiButton` 是单轮按钮：每次点击的 messages 只有 system（可选）+ user 两条，不保存对话历史；需要多轮会话与消息列表用 `@veltra/ai` 的 `UAiChat` / `useChat`。
> - `success` 在流式下是全部增量的拼接文本，不是最后一片增量；过程渲染只累加 `delta`，最终以 `success` 为准。
> - `error` 不弹全局提示；禁止不监听 `@error`，否则失败时用户无任何反馈。
> - 配置是字段级合并，不是整体替换：全局开了 `stream: true` 后实例想关流式必须显式传 `provider: { stream: false }`。
> - 合并后 `url` 与 `model` 必须有值；两者都未配置时点击即失败并触发 `error`。
> - `pre-input` 变体中 `#pre-input` 插槽内容不进入请求体；提示词只由 `prompt` prop 决定，必须用响应式绑定（computed / ref）从插槽状态**持续派生** `prompt`。禁止在 `@confirm` 里才改写 `prompt`：组件点确认时同步发起请求，读到的仍是改写前的旧值（props 更新要等下一轮渲染）。`@confirm` 只适合做埋点、关闭外部状态这类不依赖本次请求内容的事。
> - 请求不可中途取消；需要在生成中允许用户放弃的场景自行用 `@veltra/utils` 的 `requestAiText` + `AbortSignal` 替代本组件。

## 常见问题

### `error` 事件收到 `请求失败（401）：<响应体>`

原因：`apiKey` 缺失或错误。未配置 `apiKey` 时请求不带 `Authorization` 头，服务端按未认证拒绝。修复：入口 `setConfig({ ai: { apiKey: '<your-token>' } })` 或实例传 `provider.apiKey`。

### 点击后请求发到了错误地址

原因：全局 `config.ai` 与实例 `provider` 都没有 `url` 字段，fetch 以字符串 `'undefined'` 为地址（相对页面地址解析）发起请求。修复：入口 `setConfig({ ai: { url: 'https://api.example.com/v1/chat/completions', model: '<model-id>' } })`，确认请求发往 OpenAI 兼容 chat/completions 完整地址。
