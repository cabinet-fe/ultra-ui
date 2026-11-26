---
title: UUploader 文件上传（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端文件上传组件：瓦片列表 + 上传入口，v-model 绑定 UploaderFileItem 数组；accept 类型过滤、数量/大小限制、beforeRead 前置校验、自定义 upload 函数回填地址，图片瓦片点击打开内置大图预览，文档类型（pdf/word/excel）以扩展名徽标呈现，面向图片与凭证类附件填报。'
aliases: [Uploader, 上传, 文件上传, 图片上传, 移动端上传, el-upload]
keywords:
  [
    UUploader,
    UploaderProps,
    UploaderEmits,
    UploaderFileItem,
    modelValue,
    accept,
    maxSize,
    maxCount,
    multiple,
    deletable,
    beforeRead,
    upload,
    preview,
    oversize,
    click-file,
    上传,
    图片上传,
    自定义上传,
    大图预览,
    上传失败
  ]
---

# UUploader 文件上传（@veltra/mobile 移动端）

`@veltra/mobile` 导出移动端文件上传组件 `UUploader`（`UploaderProps` / `UploaderEmits` / `UploaderFileItem` 类型同包导出）。渲染文件瓦片列表 + 末尾「+」上传入口，点击入口打开系统文件选择器；`v-model` 绑定 `UploaderFileItem[]`。图片文件按扩展名识别并显示缩略图，其余文件显示扩展名徽标 + 文件名；不传 `upload` 时本地 blob 地址直显，传 `upload` 时先占位 uploading、成功回填地址、失败标记 failed。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'

// 不传 upload：选择后立即以本地 blob 地址直显（仅本地预览，未上传到服务器）
const files = ref<UploaderFileItem[]>([])
</script>

<template>
  <UUploader v-model="files" />
  <!-- 默认 accept：image/*,.pdf,.doc,.docx,.xls,.xlsx；单选；无数量与大小限制 -->
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/uploader/style`。

## API 签名

```ts
// 以下类型从 '@veltra/mobile' 导出；FormComponentProps 来自 @veltra/utils（未再导出，此处展开）
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填。`true` 或校验失败提示文本 */
  required?: boolean | string
  /** 长度 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则 */
  preset?: PresetRule
  /** 自定义校验：返回错误文本表示失败 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 上传文件项（url 可为本地 blob 地址或已上传地址） */
export interface UploaderFileItem {
  /** 文件访问地址（本地预览为 blob: 地址；上传失败时为空串） */
  url: string
  /** 文件名（用于类型识别与展示；回显历史数据时必须传，否则无法按扩展名识别图片与徽标） */
  name?: string
  /** 文件大小（字节） */
  size?: number
  /** 上传状态：传入 upload 时未完成前为 uploading，失败为 failed */
  status?: 'uploading' | 'done' | 'failed'
}

/** 上传组件属性（UploaderProps 继承的 FormComponentProps 已展开） */
export interface UploaderProps {
  /** 文件列表，v-model 双向绑定 */
  modelValue?: UploaderFileItem[]
  /** 接受的文件类型，透传原生 input accept。默认 'image/*,.pdf,.doc,.docx,.xls,.xlsx' */
  accept?: string
  /** 是否多选。默认 false */
  multiple?: boolean
  /** 最大文件数量，达到后隐藏上传入口。默认无限 */
  maxCount?: number
  /** 单文件大小上限（字节），超出触发 oversize 事件并丢弃该文件 */
  maxSize?: number
  /**
   * 是否显示删除按钮；传函数可按文件控制：返回 false 隐藏该文件的删除按钮
   * （如补传模式仅允许删补传附件）
   */
  deletable?: ((file: UploaderFileItem, index: number) => boolean) | boolean
  /** 点击图片是否打开内置大图预览；文档类型始终只派发 click-file。默认 true */
  preview?: boolean
  /** 自定义上传：返回文件访问地址；不传则本地 blob 地址直显 */
  upload?: (file: File) => Promise<string>
  /** 读取文件前校验：返回 false、resolve false 或抛异常阻止该文件加入 */
  beforeRead?: (file: File) => boolean | Promise<boolean>
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字；移动端 UForm 不渲染该提示 */
  tips?: string
  /** 所占列数；移动端 UForm 单列呈现，该属性不生效 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字，仅 UForm 内生效 */
  label?: string
  /** UForm 内绑定的 model 字段。设置后禁止再写 v-model */
  field?: string
  /** 是否禁用。默认 false */
  disabled?: boolean
  /** 是否只读。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface UploaderEmits {
  (e: 'update:modelValue', files: UploaderFileItem[]): void
  (e: 'change', files: UploaderFileItem[]): void
  (e: 'oversize', files: File[]): void
  (e: 'delete', file: UploaderFileItem, index: number): void
  (e: 'click-file', file: UploaderFileItem, index: number): void
}
```

组件 ref 上没有可调用的暴露方法；唯一插槽是 `#item`（作用域 `{ file, index }`，自定义文件瓦片内容；上传中遮罩与删除按钮始终由组件渲染）。

## 参数说明

| 参数        | 类型                                                         | 默认                                    | 必填 | 约束                                                                                                     |
| ----------- | ------------------------------------------------------------ | --------------------------------------- | :--: | --------------------------------------------------------------------------------------------------------- |
| `modelValue`| `UploaderFileItem[]`                                         | —                                       |  否  | 瓦片按数组顺序渲染；组件追加/删除后整体写回                                                              |
| `accept`    | `string`                                                     | `'image/*,.pdf,.doc,.docx,.xls,.xlsx'`  |  否  | 逗号分隔；MIME 项精确或 `*` 通配比对，扩展名项（`.pdf`）按文件名后缀比对；不匹配的文件被静默丢弃          |
| `multiple`  | `boolean`                                                    | `false`                                 |  否  | 单选时系统选择器一次只能选一个文件                                                                        |
| `maxCount`  | `number`                                                     | 无限                                    |  否  | 已有数量达到上限隐藏上传入口；选择时超出余量的文件被静默丢弃                                             |
| `maxSize`   | `number`                                                     | —                                       |  否  | 字节；超出上限的文件触发 `oversize`（payload 为被丢弃的 File 数组）并丢弃                                 |
| `deletable` | `((file: UploaderFileItem, index: number) => boolean) \| boolean` | `true`                             |  否  | `false` 全部隐藏删除按钮；函数按文件控制，返回 `false` 隐藏该文件的删除按钮                              |
| `preview`   | `boolean`                                                    | `true`                                  |  否  | `true` 时点击图片瓦片（非上传中）打开内置全屏大图预览；`false` 时点击一律只派发 `click-file`             |
| `upload`    | `(file: File) => Promise<string>`                            | —                                       |  否  | 不传：本地 blob 直显（`status: 'done'`）；传：先占位 `uploading`（url 为空串），resolve 回填地址并置 `done`，reject 置 `failed` |
| `beforeRead`| `(file: File) => boolean \| Promise<boolean>`                | —                                       |  否  | 多个文件并行校验；返回 false、resolve false 或抛异常的文件被剔除                                         |
| `size`      | `ComponentSize`                                              | `'default'`                             |  否  | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先                                   |
| `tips`      | `string`                                                     | —                                       |  否  | 仅 UForm（或 UFormItem）内生效；移动端不渲染悬浮提示                                                      |
| `span`      | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }`   | —                                       |  否  | 仅 UForm 内生效；移动端单列呈现，不生效                                                                   |
| `label`     | `string`                                                     | —                                       |  否  | 仅 UForm 内生效，生成 UFormItem 标签                                                                      |
| `field`     | `string`                                                     | —                                       |  否  | UForm 按该路径读写 `model`；设置后禁止再写 `v-model`                                                      |
| `disabled`  | `boolean`                                                    | `false`                                 |  否  | 隐藏上传入口与删除按钮；点击瓦片无任何响应（不派发 `click-file`、不预览）                                 |
| `readonly`  | `boolean`                                                    | `false`                                 |  否  | 隐藏上传入口与删除按钮；保留点击瓦片：`click-file` 照常派发、图片可预览（查看场景）                       |
| `rules`     | `ValidateRule`                                               | —                                       |  否  | 仅 UForm 内生效；枚举见 API 签名                                                                          |

## 方法与事件

添加文件的处理顺序（每步过滤后进入下一步）：

1. `accept` 匹配：MIME 项按文件 `type` 精确或 `*` 通配比对，扩展名项按文件名后缀比对；不匹配的静默丢弃。
2. 数量余量：剩余槽位 = `maxCount − 已有数量`；超出余量的文件静默丢弃，余量 ≤ 0 时整体忽略。
3. `maxSize`：超限文件收集进 `oversize` 事件 payload 并丢弃（事件仍会触发，其余文件继续走流程）。
4. `beforeRead`：并行校验，未通过的文件剔除。
5. 加入列表：写回 `update:modelValue` 并触发 `change`（payload 为全量数组）。

| 事件                | payload                            | 触发时机                                                                                     |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `update:modelValue` | `files: UploaderFileItem[]`        | 追加与删除后整体写回；`v-model` 即绑定此事件                                                  |
| `change`            | `files: UploaderFileItem[]`        | 追加与删除后触发，payload 为全量数组；在 `UFormItem` 内会冒泡为 Item 的 `change`              |
| `oversize`          | `files: File[]`                    | 本次选择中超出 `maxSize` 的原始 File 数组；组件不弹提示，需自行反馈                            |
| `delete`            | `(file, index)`                    | 点击删除按钮后；组件同时回收该文件由组件创建的 `blob:` 预览地址                                |
| `click-file`        | `(file, index)`                    | 点击文件瓦片；`disabled` 下不触发；文档类型（非图片）点击只触发本事件                          |

删除行为：`deletable` 判定通过且非 `disabled` / `readonly` 时展示删除按钮；删除后写回数组、回收组件创建的 `blob:` 地址并触发 `delete` + `change`。

图片识别规则：文件名后缀属于 `png / jpg / jpeg / gif / webp / bmp / heic / heif` 判定为图片；无文件名的历史数据按地址判定（`url` 以 `data:image` 或 `blob:` 开头）。上传中（`status: 'uploading'`）的瓦片显示旋转遮罩，点击照常派发 `click-file`，但不打开内置预览。

## 典型示例

### 自定义上传到服务器

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'

const files = ref<UploaderFileItem[]>([])

// 返回上传后的访问地址；reject 该文件标记 failed
async function upload(file: File) {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body })
  if (!res.ok) throw new Error(`上传失败（${res.status}）`)
  const data = (await res.json()) as { url: string }
  return data.url
}

// oversize 需自行反馈：组件不弹提示
function onOversize(oversizeFiles: File[]) {
  console.log(`以下文件超过 10MB 被丢弃：${oversizeFiles.map((f) => f.name).join('、')}`)
}
</script>

<template>
  <UUploader v-model="files" :upload="upload" multiple :max-count="9" :max-size="10 * 1024 * 1024" @oversize="onOversize" />
</template>
```

### beforeRead 前置校验 + 按文件控制删除

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'

const files = ref<UploaderFileItem[]>([])

// 校验失败的文件被剔除；组件不弹提示，需自行反馈
function beforeRead(file: File) {
  if (file.size === 0) {
    console.log(`${file.name} 是空文件，已忽略`)
    return false
  }
  return true
}

// 补传模式：索引 0 是历史凭证，只允许删补传附件
function deletable(file: UploaderFileItem, index: number) {
  return index > 0
}
</script>

<template>
  <UUploader v-model="files" :before-read="beforeRead" :deletable="deletable" />
</template>
```

### 自定义瓦片 + 只读查看

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'

// 只读回显：不渲染上传入口与删除按钮，点击图片仍可预览、click-file 照常派发
const files = ref<UploaderFileItem[]>([{ url: '/files/report.pdf', name: '报销单.pdf', status: 'done' }])

function onClickFile(file: UploaderFileItem, index: number) {
  console.log(`点击了第 ${index} 个文件：${file.name}`) // 文档类型点击只派发 click-file
}
</script>

<template>
  <UUploader v-model="files" readonly @click-file="onClickFile">
    <template #item="{ file }">
      <span>{{ file.name }}</span>
    </template>
  </UUploader>
</template>
```

## 注意事项

> [!WARNING]
>
> - 不传 `upload` 时文件只在本地的 `blob:` 地址直显，**没有上传到服务器**；需要落盘必须传 `upload` 函数。
> - 上传失败（`upload` reject）置 `status: 'failed'` 后组件**不自动重试**、不弹提示；处理方式是让用户删除后重选，或由应用监听上传 Promise 自行重试。
> - `oversize`、`beforeRead` 拒绝、`accept` 不匹配都**不弹提示**；`accept` 不匹配更是静默丢弃，必须由应用自行反馈。
> - 组件内的删除按钮只回收组件自己创建的 `blob:` 地址；回显历史数据的 `http(s)` 地址删除时不会被回收。
> - `preview` 只作用于图片瓦片；pdf / word / excel 文件点击只派发 `click-file`，内置预览不打开，文档预览由应用监听该事件自行实现。
> - `disabled` 与 `readonly` 都隐藏上传入口与删除按钮，区别是：`disabled` 点击瓦片完全无响应，`readonly` 保留 `click-file` 与图片预览（查看场景）。
> - `#item` 插槽只接管瓦片主体内容；上传中遮罩与删除按钮始终由组件渲染，插槽内无法去掉它们。
> - 图片识别按文件名后缀；回显无 `name` 的历史数据时按 `url` 前缀猜测（`data:image` / `blob:`），否则按非图片徽标呈现。
> - 扩展名徽标（PDF / DOC / XLS）用固定行业色，不随暗色主题切换。
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效，且移动端 `span` 与 `tips` 不产生布局与提示效果。
> - 热区尺寸走 `--um-*` 移动端 token，两处不同：瓦片删除按钮 24px（`--um-spacing-xl`，叠于瓦片右上角）；内置大图预览的关闭按钮 44px（`--um-touch-target`）；上传入口为方形瓦片按钮。

## 常见问题

### 选择文件后列表没有变化

逐项排查（组件在每一步都会静默丢弃，无提示）：

1. 文件类型不匹配 `accept`：MIME 项（如 `application/pdf`、`image/*`）比对文件 `type`，扩展名项（如 `.pdf`）比对文件名后缀，任一命中即通过。
2. 数量已满：已有文件数达到 `maxCount` 后上传入口隐藏，`multiple` 超出余量的部分被丢弃。
3. `beforeRead` 返回了 false 或抛异常。

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UUploader } from '@veltra/mobile'
import type { UploaderFileItem } from '@veltra/mobile'

const files = ref<UploaderFileItem[]>([])

// 排查示例：放开类型限制并在 beforeRead 里打印被拒文件
function beforeRead(file: File) {
  console.log('候选文件', file.name, file.type, file.size)
  return true
}
</script>

<template>
  <UUploader v-model="files" multiple :before-read="beforeRead" />
</template>
```

### 上传失败后瓦片一直转圈或没有地址

`status` 为 `uploading` 表示 `upload` 返回的 Promise 还未 settle；为 `failed` 表示已 reject（此时瓦片不再转圈、url 为空串）。两种情况组件都不会重试。修复：检查 `upload` 函数的 resolve/reject 路径；失败的文件删除后重选。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
