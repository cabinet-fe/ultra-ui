---
title: 'UTextarea 文本域（移动端）'
description: '从 `@veltra/mobile` 导出的多行文本输入框，面向触屏场景：一律禁用拖拽缩放、清空按钮固定右上角常显、44px 最小高度、原生字号 ≥16px 防 iOS 聚焦缩放；支持 maxlength / showCount 字数统计、autosize 高度自适应，放进 UForm 时用 `field` 绑定并按 `rules` 校验。'
aliases: [textarea, u-textarea, 移动端文本域, TextArea, 多行文本框, 多行输入]
keywords:
  [
    modelValue,
    'update:modelValue',
    maxlength,
    showCount,
    autosize,
    resize,
    rows,
    cols,
    clearable,
    nativeReadonly,
    field,
    rules,
    移动端文本域,
    字数统计,
    当前字数,
    自适应高度,
    清空按钮,
    iOS 缩放,
    多行输入
  ]
---

# UTextarea 文本域（移动端）

`@veltra/mobile` 导出多行文本输入框 `UTextarea`。`v-model` 绑定字符串值，支持 `maxlength` 限制与 `showCount` 字数统计、`autosize` 高度自适应与常显清空按钮；API 与 `@veltra/desktop` 的 `UTextarea` 同名同默认值，交互形态按触屏适配。放进 `UForm` 时改用 `field` 绑定 model 字段并按 `rules` 校验。

## 快速上手

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/textarea/style'

const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" placeholder="请输入内容" :rows="3" />
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时必须改用 `field`，禁止再写 `v-model`。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（rules 属性的类型），与 UInput 文档中的 ValidateRule 是同一结构 */
export interface ValidateRule {
  /** 是否必填；传字符串时作为校验失败提示 */
  required?: boolean | string
  /** 长度；元组第二项为失败提示 */
  length?: number | [number, string]
  /** 最小值；元组第二项为失败提示 */
  min?: number | [number, string]
  /** 最大值；元组第二项为失败提示 */
  max?: number | [number, string]
  /** 最小长度；元组第二项为失败提示 */
  minLen?: number | [number, string]
  /** 最大长度；元组第二项为失败提示 */
  maxLen?: number | [number, string]
  /** 正则匹配；string 为正则源，元组第二项为失败提示 */
  match?: RegExp | [RegExp, string] | string
  /** 预设规则，取值见 PresetRule */
  preset?: PresetRule
  /** 自定义校验；返回非空字符串表示失败且该字符串为提示，返回 Promise 时异步校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 组件通用属性 */
export interface ComponentProps {
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
}

/** 表单组件通用属性：label / field / rules / tips / span 仅在 UForm（或 UFormItem）内生效 */
export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段；有 field 时禁止再写 v-model */
  field?: string
  /** 是否禁用。组件 props > 表单 > 全局配置 > 默认 false */
  disabled?: boolean
  /** 是否只读。组件 props > 表单 > 全局配置 > 默认 false */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

/** 文本域组件属性（与 @veltra/desktop UTextarea 对齐） */
export interface TextareaProps extends FormComponentProps {
  /** 文本域的值，配合 v-model 使用 */
  modelValue?: string
  /** 文本域的高度（类型中声明，当前实现未使用） */
  height?: string
  /** 占位符。默认 '请输入' */
  placeholder?: string
  /** 文本域是否禁用 */
  disabled?: boolean
  /** 文本域是否只读（true 时整体渲染为纯文本） */
  readonly?: boolean
  /** 是否能被缩放。默认 true（移动端样式一律 resize: none，本属性仅保留 API 兼容） */
  resize?: boolean
  /** 文本域的行数（原生 rows 属性） */
  rows?: number
  /** 文本域的列数（原生 cols 属性） */
  cols?: number
  /** 文本域的最大字数 */
  maxlength?: number
  /** 是否显示字符数；必须与 maxlength 同时设置才生效 */
  showCount?: boolean
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 原生只读：只在内部 <textarea> 上设置 readonly，不改变组件整体渲染 */
  nativeReadonly?: boolean
  /** 高度随内容自适应。默认 false */
  autosize?: boolean
}

/** 文本域组件定义的事件 */
export interface TextareaEmits {
  /** 输入时持续更新；超过 maxlength 时截断到 maxlength 再触发 */
  (e: 'update:modelValue', value: string): void
  /** 文本框失去焦点或用户按 Enter 时触发 */
  (e: 'change', value: string): void
  /** 文本框获取焦点时触发 */
  (e: 'focus'): void
  /** 文本框失去焦点时触发 */
  (e: 'blur'): void
  /** 清空按钮点击时触发 */
  (e: 'clear'): void
}

/** 组件实例 ref 暴露的成员（经 DeconstructValue 解包后为空对象，ref.value 上无可访问成员） */
export type TextareaExposed = Record<string, never>
```

## 参数说明

| 参数                     | 类型                                           | 默认        | 必填 | 约束                                                                                |
| ------------------------ | ---------------------------------------------- | ----------- | :--: | ----------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string`                                       | `undefined` |  否  | 双向绑定的值                                                                        |
| `placeholder`            | `string`                                       | `'请输入'`  |  否  | —                                                                                   |
| `maxlength`              | `number`                                       | —           |  否  | 最大字数；超出时触发 `update:modelValue` 前先截断到 `maxlength`                     |
| `showCount`              | `boolean`                                      | `false`     |  否  | 必须同时设置 `maxlength` 才渲染计数；显示格式为「当前字数/上限」（右下角）           |
| `autosize`               | `boolean`                                      | `false`     |  否  | `true` 时高度随内容自适应，无需再设 `height`                                        |
| `resize`                 | `boolean`                                      | `true`      |  否  | 移动端样式固定 `resize: none`，本属性任何取值都不改变渲染                           |
| `rows`                   | `number`                                       | 原生默认    |  否  | 原生 `rows` 属性                                                                    |
| `cols`                   | `number`                                       | 原生默认    |  否  | 原生 `cols` 属性                                                                    |
| `clearable`              | `boolean`                                      | `true`      |  否  | 清空按钮显示条件：有值 + 非禁用（移动端常显，无 hover 门槛）                        |
| `height`                 | `string`                                       | —           |  否  | 类型中声明，当前实现未使用；控制高度用 `rows` 或 `autosize`                         |
| `nativeReadonly`         | `boolean`                                      | `false`     |  否  | 仅锁定原生 `<textarea>`；与 `readonly`（整体渲染为文本）不同                        |
| `field`                  | `string`                                       | —           |  否  | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model`            |
| `label`                  | `string`                                       | —           |  否  | 表单内生效。表单标签文字                                                            |
| `rules`                  | `ValidateRule`                                 | —           |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                  |
| `tips`                   | `string`                                       | —           |  否  | 表单内生效。表单项提示文案                                                          |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —           |  否  | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键                          |
| `size`                   | `ComponentSize`                                | `'default'` |  否  | 取值 `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled`               | `boolean`                                      | `false`     |  否  | 禁用时不可输入且清空按钮隐藏（原生 `disabled` 属性）；优先级同 `size`               |
| `readonly`               | `boolean`                                      | `false`     |  否  | `true` 时整个组件渲染为保留换行的纯文本，空值显示 `-`                               |

## 方法与事件

| 事件                | payload         | 触发时机                                                                                  |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `update:modelValue` | `value: string` | 每次输入持续触发；值超过 `maxlength` 时先截断再触发                                       |
| `change`            | `value: string` | 失焦或按 Enter 提交值变化时（原生 `change`）                                              |
| `focus`             | 无              | 获得焦点                                                                                  |
| `blur`              | 无              | 失去焦点                                                                                  |
| `clear`             | 无              | 点击清空按钮；先置 `modelValue` 为 `''`（触发一次 `update:modelValue`），再触发 `clear`   |

无暴露成员：`TextareaExposed` 解包后为空，组件 `ref` 上无可访问的属性或方法。

## 典型示例

### 字数限制与统计

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/textarea/style'

const remark = shallowRef('')
</script>

<template>
  <!-- 计数格式是「当前字数/上限」：输入 1 个字显示 1/200；清空按钮有值即常显 -->
  <u-textarea v-model="remark" :maxlength="200" show-count clearable placeholder="请输入备注" />
</template>
```

### 自适应高度与固定行数

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/textarea/style'

const content = shallowRef('')
</script>

<template>
  <!-- autosize：高度随内容增长 -->
  <u-textarea v-model="content" autosize placeholder="内容多长框多高" />
  <!-- 固定 4 行；移动端不支持拖拽缩放，高度只由 rows / autosize 决定 -->
  <u-textarea v-model="content" :rows="4" placeholder="固定 4 行" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UTextarea } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/textarea/style'

const form = reactive({ description: '' })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-textarea
      label="项目描述"
      field="description"
      tips="最多 500 字"
      span="full"
      placeholder="请输入项目描述"
      :maxlength="500"
      show-count
      :rules="{ required: true, maxLen: [500, '不超过 500 字'] }"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是 `<textarea>` 固定 `resize: none`，任何情况下都禁止拖拽缩放（触屏没有拖拽手柄），`resize` 属性仅保留 API 兼容；桌面端默认 `resize: vertical` 可纵向拖拽。
> - 移动端是清空按钮固定在右上角、有值 + 非禁用即常显，热区 44×44；桌面端是悬停文本域才显示。
> - 移动端密度全部取 `--um-*` token：`min-height` 取 `max(--um-control-height-*, --um-touch-target)`（44px 保底）、圆角 `--um-control-radius-*`、原生字号 `--um-font-size-main`（16px）、行高 `--um-text-line-height`、内边距 `--um-spacing-*`。
> - 字数统计格式是「当前字数/上限」，展示在文本域右下角，计数区占位 44px 热区且不拦截触摸；输入 1 个字、上限 200 时显示 `1/200`。
> - `showCount` 必须与 `maxlength` 同时设置，只写 `show-count` 不显示计数。
> - 本库的固定行数参数是 `rows`，`height` 参数在类型中声明但当前实现未使用，传了不生效。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；`label` / `field` / `rules` / `tips` / `span` 仅在表单内生效。
> - 本库的只读分两级：`readonly` 把整个组件渲染为纯文本，`nativeReadonly` 只给原生 `<textarea>` 加 `readonly` 属性。
> - 本组件没有插槽，自定义前后缀用 `UInput`。
> - 按需引入样式必须走 `import '@veltra/mobile/components/textarea/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 计数想显示「剩余字数」而不是「当前字数」

本组件计数固定为「当前字数/上限」。要展示剩余字数，用 `maxlength - model.length` 自行渲染。

### 传了 `show-count` 但不显示计数

原因：未设置 `maxlength`。修复：同时传 `:maxlength="200"`。

### 期望像桌面端一样拖拽文本域右下角调整高度

原因：移动端样式固定 `resize: none`，`resize` 属性不产生任何效果。修复：用 `:rows="N"` 固定高度或 `autosize` 让高度跟随内容。
