---
title: UAiComposer AI 输入与控件组合件
description: '@veltra/ai 独立导出的输入组合件集合：包含全插槽化输入卡 UAiComposer、上下文与文件拾取器 UAiContextPicker、Token 用量环 UAiContextUsage、模型选择器 UAiModelPicker、推理等级选择器 UAiReasoningPicker 与附件列表 UAiAttachments。'
aliases:
  [
    AiComposer,
    AiContextPicker,
    AiContextUsage,
    AiModelPicker,
    AiReasoningPicker,
    AiAttachments,
    AI 输入框
  ]
keywords:
  [
    UAiComposer,
    UAiContextPicker,
    UAiContextUsage,
    UAiModelPicker,
    UAiReasoningPicker,
    UAiAttachments,
    AiComposerExposed,
    AiContextPickerItem,
    toolbar-left,
    toolbar-right,
    contextWindow,
    reasoningLevels,
    allowPasteImage,
    附件上传,
    模型选择,
    用量环
  ]
---

# UAiComposer AI 输入与控件组合件

`@veltra/ai` 导出 6 个可脱离 `UAiChat` 独立使用的输入与控制组件（`UAiComposer`、`UAiContextPicker`、`UAiContextUsage`、`UAiModelPicker`、`UAiReasoningPicker`、`UAiAttachments`）。`UAiComposer` 默认仅提供自适应文本域、剪贴板图片粘贴、附件预览与发送/停止按钮，不含清除会话、上下文、用量与模型选择器，需通过 `#toolbar-left` / `#toolbar-right` 自由装配。本地文件解析由 `UAiComposer.addFiles` 与 `UAiContextPicker` 的 `add-attachments` 事件完成。

## 快速上手

前置：应用入口已执行 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`；显式导入组件时样式随组件自动加载（或全量导入 `@veltra/ai/style`）。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  UAiComposer,
  UAiContextPicker,
  UAiModelPicker,
  UAiReasoningPicker,
  type ChatAttachment,
  type ChatModel
} from '@veltra/ai'

const models: ChatModel[] = [
  {
    id: 'deepseek-flash',
    label: 'DeepSeek Flash',
    reasoningLevels: [
      { value: 'high', label: '高' },
      { value: 'max', label: '极致' }
    ]
  }
]

const text = ref('')
const model = ref('deepseek-flash')
const reasoningLevel = ref('high')

const onSend = (content: string, attachments: ChatAttachment[]) => {
  console.log('发送：', content, '附件数：', attachments.length)
}
</script>

<template>
  <UAiComposer v-model="text" @send="onSend">
    <template #toolbar-left="{ addAttachments, disabled }">
      <UAiContextPicker :disabled="disabled" @add-attachments="addAttachments" />
    </template>
    <template #toolbar-right="{ disabled }">
      <UAiModelPicker v-model="model" :models="models" :disabled="disabled" />
      <UAiReasoningPicker
        v-model="reasoningLevel"
        :levels="models[0]?.reasoningLevels ?? []"
        :disabled="disabled"
      />
    </template>
  </UAiComposer>
</template>
```

## API 签名

```ts
import type { ChatAttachment, ChatTokenUsage } from '@veltra/ai'
import type { ChatModel, ChatReasoningLevel } from '@veltra/ai'
import type { Component } from 'vue'

export interface AiComposerProps {
  /** 输入框文本，支持 v-model */
  modelValue?: string
  /** 待发送附件列表，支持 v-model:attachments */
  attachments?: ChatAttachment[]
  /** 是否处于生成中状态（空输入显示停止按钮，有内容显示发送入队），默认 false */
  running?: boolean
  /** 空闲态占位文案，默认 '输入消息，Enter 发送，Shift + Enter 换行' */
  placeholder?: string
  /** 生成中占位文案，默认 '会话进行中，发送的消息将进入待发送队列' */
  runningPlaceholder?: string
  /** 是否禁用输入与操作，默认 false */
  disabled?: boolean
  /** 单个附件最大字节数，内部默认 10485760（10MB） */
  maxAttachmentSize?: number
  /** 是否允许从剪贴板粘贴图片，默认 true */
  allowPasteImage?: boolean
  /** 输入框自适应最大高度（px），默认 160 */
  maxHeight?: number
}

export interface AiComposerEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:attachments', attachments: ChatAttachment[]): void
  (e: 'send', content: string, attachments: ChatAttachment[]): void
  (e: 'abort'): void
  /** 点击图片预览；未监听且存在 AiChatDIKey 时回落 DI previewImage */
  (e: 'preview-image', src: string, alt?: string): void
}

export interface AiComposerExposed {
  setContent: (content: string) => void
  getContent: () => string
  focus: () => void
  addAttachments: (items: ChatAttachment[]) => void
  addFiles: (files: File[]) => Promise<void>
}

export interface AiContextPickerItem {
  key: string
  label: string
  icon?: Component
  description?: string
  disabled?: boolean
}

export interface AiContextPickerProps {
  items?: AiContextPickerItem[]
  /** 是否显示本地文件上传入口，默认 true */
  upload?: boolean
  /** 上传入口文案，默认 '上传附件' */
  uploadLabel?: string
  accept?: string
  /** 是否允许选择多个文件，默认 true */
  multiple?: boolean
  maxAttachmentSize?: number
  /** 弹出方向，默认 'top' */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式，默认 'start' */
  alignment?: 'center' | 'start' | 'end'
  disabled?: boolean
}

export interface AiContextPickerEmits {
  (e: 'pick-files', files: File[]): void
  (e: 'add-attachments', attachments: ChatAttachment[]): void
  (e: 'select', item: AiContextPickerItem): void
}

export interface AiContextPickerExposed {
  close: () => void
}

export interface AiContextUsageProps {
  /** 会话累计 token；为 null/undefined 时组件不渲染 */
  usage?: ChatTokenUsage | null
  lastRequestUsage?: ChatTokenUsage | null
  contextWindow?: number
  /** 是否展示缓存命中 / 未命中等明细项，默认 false */
  detail?: boolean
  /** 弹出方向，默认 'top' */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式，默认 'end' */
  alignment?: 'center' | 'start' | 'end'
}

export interface AiModelPickerProps {
  models: ChatModel[]
  modelValue?: string
  /** 未选择时的占位文案，默认 '模型' */
  placeholder?: string
  /** 弹出方向，默认 'top' */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式，默认 'end' */
  alignment?: 'center' | 'start' | 'end'
  disabled?: boolean
}

export interface AiModelPickerEmits {
  (e: 'update:modelValue', value: string | undefined): void
  (e: 'change', value: string, model: ChatModel): void
}

export interface AiReasoningPickerProps {
  /** 可选推理等级列表；仅 length > 1 时渲染选择器 */
  levels: ChatReasoningLevel[]
  modelValue?: string
  /** 未选择时的占位文案，默认 '推理' */
  placeholder?: string
  /** 弹出方向，默认 'top' */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 对齐方式，默认 'end' */
  alignment?: 'center' | 'start' | 'end'
  disabled?: boolean
}

export interface AiReasoningPickerEmits {
  (e: 'update:modelValue', value: string | undefined): void
  (e: 'change', value: string, level: ChatReasoningLevel): void
}

export interface AiAttachmentsProps {
  /** 附件列表；空数组时不渲染 */
  items: ChatAttachment[]
  /** 是否允许移除附件，默认 false */
  removable?: boolean
  /** 展示尺寸，默认 'default' */
  size?: 'compact' | 'default'
}

export interface AiAttachmentsEmits {
  (e: 'remove', index: number, item: ChatAttachment): void
  /** 未监听且为图片时回落 DI previewImage */
  (e: 'preview', item: ChatAttachment, index: number): void
}
```

## 参数说明

### UAiComposer

| 参数                 | 类型               | 默认                                         | 必填 | 约束                                               |
| -------------------- | ------------------ | -------------------------------------------- | :--: | -------------------------------------------------- |
| `modelValue`         | `string`           | `undefined`                                  |  否  | `v-model`；未传时走组件内部非受控状态              |
| `attachments`        | `ChatAttachment[]` | `undefined`                                  |  否  | `v-model:attachments`；变更时始终触发新数组引用    |
| `running`            | `boolean`          | `false`                                      |  否  | `true` 且输入内容与附件均为空时显示停止按钮        |
| `placeholder`        | `string`           | `'输入消息，Enter 发送，Shift + Enter 换行'` |  否  | `running` 为 `false` 时生效                        |
| `runningPlaceholder` | `string`           | `'会话进行中，发送的消息将进入待发送队列'`   |  否  | `running` 为 `true` 时生效                         |
| `disabled`           | `boolean`          | `false`                                      |  否  | 为 `true` 时禁止输入、粘贴图片、删附件、发送与中止 |
| `maxAttachmentSize`  | `number`           | `10485760`                                   |  否  | 字节上限；超限文件忽略并打印 `[UAiComposer]` 警告  |
| `allowPasteImage`    | `boolean`          | `true`                                       |  否  | 从剪贴板提取 `image/*` 文件                        |
| `maxHeight`          | `number`           | `160`                                        |  否  | 像素上限；超出后转为纵向滚动                       |

### UAiContextPicker / UAiContextUsage / UAiModelPicker / UAiReasoningPicker / UAiAttachments

| 组件                 | 参数                                   | 类型                                                                                  |       默认        | 必填 | 约束                                                                |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------- | :---------------: | :--: | ------------------------------------------------------------------- |
| `UAiContextPicker`   | `items`                                | `AiContextPickerItem[]`                                                               |    `undefined`    |  否  | `key` 唯一，`disabled` 项点击不触发 `select`                        |
| `UAiContextPicker`   | `upload`                               | `boolean`                                                                             |      `true`       |  否  | 为 `false` 时隐藏本地文件上传入口                                   |
| `UAiContextPicker`   | `uploadLabel`                          | `string`                                                                              |   `'上传附件'`    |  否  | 上传项文案                                                          |
| `UAiContextPicker`   | `accept`                               | `string`                                                                              |    `undefined`    |  否  | 透传 `UFilePicker` 的 `accept`                                      |
| `UAiContextPicker`   | `multiple`                             | `boolean`                                                                             |      `true`       |  否  | 是否允许一次选择多个文件                                            |
| `UAiContextPicker`   | `maxAttachmentSize`                    | `number`                                                                              |    `10485760`     |  否  | 字节上限；超限文件忽略并打印 `[UAiContextPicker]` 警告              |
| `UAiContextUsage`    | `usage`                                | `ChatTokenUsage \| null`                                                              |    `undefined`    |  否  | 为 `null`/`undefined` 时不渲染任何 DOM                              |
| `UAiContextUsage`    | `lastRequestUsage`                     | `ChatTokenUsage \| null`                                                              |    `undefined`    |  否  | 仅与 `contextWindow` 同时存在时绘制进度环占比                       |
| `UAiContextUsage`    | `contextWindow`                        | `number`                                                                              |    `undefined`    |  否  | 大于 0 时与 `lastRequestUsage.totalTokens` 算百分比                 |
| `UAiContextUsage`    | `detail`                               | `boolean`                                                                             |      `false`      |  否  | `true` 时追加有数据的缓存命中/未命中行                              |
| `UAiModelPicker`     | `models`                               | `ChatModel[]`                                                                         |         —         |  是  | 模型扁平列表；`ChatModelOption` 结构兼容                            |
| `UAiModelPicker`     | `modelValue`                           | `string`                                                                              |    `undefined`    |  否  | `v-model`；`label` 缺省时回退显示 `id`                              |
| `UAiReasoningPicker` | `levels`                               | `ChatReasoningLevel[]`                                                                |         —         |  是  | 仅 `levels.length > 1` 时渲染，否则为空节点                         |
| `UAiReasoningPicker` | `modelValue`                           | `string`                                                                              |    `undefined`    |  否  | `v-model`                                                           |
| 通用浮层属性         | `direction` / `alignment` / `disabled` | `'top' \| 'bottom' \| 'left' \| 'right'` / `'center' \| 'start' \| 'end'` / `boolean` | 见各组件 API 签名 |  否  | `UAiContextUsage` 无 `disabled`；面板通过 `UDropdown` Teleport 挂载 |
| `UAiAttachments`     | `items`                                | `ChatAttachment[]`                                                                    |         —         |  是  | 空数组时不渲染                                                      |
| `UAiAttachments`     | `removable`                            | `boolean`                                                                             |      `false`      |  否  | 为 `true` 时显示移除图标                                            |
| `UAiAttachments`     | `size`                                 | `'compact' \| 'default'`                                                              |    `'default'`    |  否  | `compact` 适用于输入卡内，`default` 适用于气泡内                    |

## 方法与事件

- `UAiComposer`
  - 事件：`update:modelValue`、`update:attachments`、`send(content, attachments)`、`abort()`、`preview-image(src, alt?)`。
  - 暴露方法（`useTemplateRef<AiComposerExposed>`）：`setContent(content)`、`getContent()`、`focus()`、`addAttachments(items)`、`addFiles(files)`。
  - 插槽：`#header`、`#attachments="{ attachments, remove, preview }"`、`#toolbar`、`#toolbar-left="{ addAttachments, addFiles, disabled }"`、`#toolbar-right="{ disabled }"`、`#action="{ running, disabled, hasContent, showStop, send, abort }"`。
- `UAiContextPicker`
  - 事件：`pick-files(files)`（同步关闭面板并立即派发原始 `File[]`）、`add-attachments(attachments)`（异步读取完成后仅在非空时派发）、`select(item)`（点击自定义项并关闭面板）。
  - 暴露方法：`close()`。
  - 插槽：`#trigger`、`#prepend="{ close }"`、默认插槽 `default="{ close }"`。
- `UAiContextUsage`
  - 插槽：默认插槽 `default="{ usage, lastRequestUsage, contextWindow, contextPercent, contextText, rows }"`。
- `UAiModelPicker` / `UAiReasoningPicker`
  - 事件：`update:modelValue(value)`、`change(value, item)`；选中后自动关闭下拉面板。
- `UAiAttachments`
  - 事件：`remove(index, item)`、`preview(item, index)`；插槽 `#item="{ item, index, isImage, remove, preview }"`。

## 典型示例

### 自定义上下文选项与附件解析（脱离 UAiChat）

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import {
  UAiComposer,
  UAiContextPicker,
  type AiComposerExposed,
  type AiContextPickerItem,
  type ChatAttachment
} from '@veltra/ai'
import { UImagePreviewer } from '@veltra/desktop'
import { Document, Folder } from '@veltra/icons/normal'

const composerRef = useTemplateRef<AiComposerExposed>('composerRef')
const previewOpen = ref(false)
const previewSrc = ref('')

const contextItems: AiContextPickerItem[] = [
  { key: 'schema', label: '接口契约', description: '附加 OpenAPI JSON 文本上下文', icon: Document },
  { key: 'repo', label: '仓库目录', description: '附加工作区文件结构', icon: Folder }
]

const handleContextSelect = (item: AiContextPickerItem) => {
  const textContent = `上下文标识: ${item.key}`
  composerRef.value?.addAttachments([
    {
      name: `${item.key}.txt`,
      mimeType: 'text/plain',
      size: new Blob([textContent]).size,
      dataUrl: '',
      textContent
    }
  ])
  composerRef.value?.focus()
}

// 外部拖入本地文件时，交给输入卡解析并追加
const handleCustomDrop = async (file: File) => {
  await composerRef.value?.addFiles([file])
}

const handleSend = (content: string, attachments: ChatAttachment[]) => {
  console.log({ content, attachments, dropHandlerReady: typeof handleCustomDrop === 'function' })
}

const handlePreviewImage = (src: string) => {
  if (!src) return
  previewSrc.value = src
  previewOpen.value = true
}
</script>

<template>
  <UAiComposer ref="composerRef" @send="handleSend" @preview-image="handlePreviewImage">
    <template #toolbar-left="{ addAttachments, disabled }">
      <UAiContextPicker
        :items="contextItems"
        :disabled="disabled"
        @add-attachments="addAttachments"
        @select="handleContextSelect"
      />
    </template>
  </UAiComposer>
  <UImagePreviewer v-model:open="previewOpen" :src="previewSrc" />
</template>
```

### 用量环与模型推理组合工具栏

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  UAiComposer,
  UAiContextUsage,
  UAiModelPicker,
  UAiReasoningPicker,
  type ChatModel,
  type ChatTokenUsage
} from '@veltra/ai'

const models: ChatModel[] = [
  {
    id: 'pro',
    label: 'Pro',
    description: '多档推理模型',
    contextWindow: 128000,
    reasoningLevels: [
      { value: 'medium', label: '均衡' },
      { value: 'high', label: '深度' }
    ]
  },
  { id: 'lite', label: 'Lite', contextWindow: 32000 }
]

const model = ref('pro')
const reasoningLevel = ref<string | undefined>('high')
const usage = ref<ChatTokenUsage>({
  promptTokens: 2400,
  completionTokens: 600,
  totalTokens: 3000,
  cacheHitTokens: 1200,
  cacheMissTokens: 1200
})

const currentModel = computed(() => models.find((item) => item.id === model.value))
const handleModelChange = (_id: string, target: ChatModel) => {
  reasoningLevel.value = target.reasoningLevels?.[0]?.value
}
</script>

<template>
  <UAiComposer @send="(text) => console.log('提交：', text)">
    <template #toolbar-right="{ disabled }">
      <UAiContextUsage
        :usage="usage"
        :last-request-usage="usage"
        :context-window="currentModel?.contextWindow"
        detail
      />
      <UAiModelPicker
        v-model="model"
        :models="models"
        :disabled="disabled"
        @change="handleModelChange"
      />
      <UAiReasoningPicker
        v-model="reasoningLevel"
        :levels="currentModel?.reasoningLevels ?? []"
        :disabled="disabled"
      />
    </template>
  </UAiComposer>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库的 `UAiComposer` 默认工具栏**不包含**清除会话按钮、上下文拾取器、用量环与模型/推理选择器（仅 `UAiChat` 壳层默认组装它们）；需要上述控件时必须显式写入 `#toolbar-left` / `#toolbar-right` 插槽。
> - `UAiComposer` 与所有独立组件默认 `width: 100%`，不包含 `UAiChat` 的 `800px` 居中限宽规则；需要居中限宽时由业务容器自行施加。
> - `UAiReasoningPicker` 在 `levels.length <= 1` 时不渲染任何 DOM；`UAiContextUsage` 在 `usage` 为 `null` 或 `undefined` 时不渲染任何 DOM；`UAiAttachments` 在 `items` 为空数组时不渲染。
> - 脱离 `UAiChat` 时无 `AiChatDIKey` 注入，点击图片附件仅触发 `preview-image` / `preview` 事件，宿主必须监听事件并挂载 `UImagePreviewer`（或自绘预览）。
> - `UAiContextPicker`、`UAiContextUsage`、`UAiModelPicker`、`UAiReasoningPicker` 的下拉面板通过 `UDropdown` Teleport 挂载到全局 popper 容器，覆盖其面板样式时必须使用全局选择器 `.u-ai-<name>__panel`（禁止写在父组件作用域容器选择器内部）。
