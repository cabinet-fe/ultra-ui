---
title: UTextarea 文本域
description: "从 `@veltra/desktop` 导出的多行文本输入框，支持字数限制与统计（maxlength / showCount）、高度自适应（autosize）、拖拽缩放开关（resize）与悬停清空；放进 UForm 时用 `field` 绑定 model 并按 `rules` 校验。"
aliases: [textarea, u-textarea, TextArea, 多行文本框, 多行输入]
keywords: [modelValue, "update:modelValue", maxlength, showCount, autosize, resize, rows, cols, clearable, field, rules, nativeReadonly, 文本域, 字数统计, 剩余字数, 自适应高度, 清空, 多行文本]
---

# UTextarea 文本域

`@veltra/desktop` 导出多行文本输入框 `UTextarea`：`v-model` 绑定字符串值，支持 `maxlength` 限制与 `showCount` 字数统计、`autosize` 高度自适应、`resize` 拖拽开关与悬停清空；放进 `UForm` 时改用 `field` 绑定 model 字段并按 `rules` 校验。

## 快速上手

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/desktop'
import { shallowRef } from 'vue'

const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" placeholder="请输入内容" />
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时必须改用 `field`，禁止再写 `v-model`。

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
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
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

/** textarea组件属性 */
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
  /** 是否能被缩放。默认 true */
  resize?: boolean
  /** 文本域的行数（原生 rows 属性） */
  rows?: number
  /** 文本域的列数（原生 cols 属性） */
  cols?: number
  /** 文本域的最大字数 */
  maxlength?: number
  /** 是否显示字符数；必须与 maxlength 同时设置才生效 */
  showCount?: boolean
  /** 清空。默认 true */
  clearable?: boolean
  /** 原生只读：只在内部 <textarea> 上设置 readonly，不改变组件整体渲染 */
  nativeReadonly?: boolean
  /** 高度随内容自适应。默认 false */
  autosize?: boolean
}

/** textarea组件定义的事件 */
export interface TextareaEmits {
  /** 输入时持续更新；超过 maxlength 时截断到 maxlength 再触发 */
  (e: 'update:modelValue', value: string): void
  /** 文本框失去焦点或用户按 Enter 时触发 */
  (e: 'change', value: string): void
  /** 文本框获取焦点时触发 */
  (e: 'focus'): void
  /** 文本框失去焦点时触发 */
  (e: 'blur'): void
  /** 点击清空按钮时触发 */
  (e: 'clear'): void
}

/** 组件实例 ref 暴露的成员（经 DeconstructValue 解包后为空对象，ref.value 上无可访问成员） */
export type TextareaExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` / `modelValue` | `string` | `undefined` | 否 | 双向绑定的值 |
| `placeholder` | `string` | `'请输入'` | 否 | — |
| `maxlength` | `number` | — | 否 | 最大字数；超出时触发 `update:modelValue` 前先截断到 `maxlength` |
| `showCount` | `boolean` | `false` | 否 | 必须同时设置 `maxlength` 才渲染计数；显示格式为「剩余字数/上限」 |
| `autosize` | `boolean` | `false` | 否 | `true` 时高度随内容自适应，无需再设 `height` |
| `resize` | `boolean` | `true` | 否 | `true` 仅允许纵向拉伸；`false` 完全禁止拉伸 |
| `rows` | `number` | 原生默认 | 否 | 原生 `rows` 属性 |
| `cols` | `number` | 原生默认 | 否 | 原生 `cols` 属性 |
| `clearable` | `boolean` | `true` | 否 | 清除图标显示条件：悬停 + 有值 + 非禁用 + 非只读 |
| `height` | `string` | — | 否 | 类型中声明，当前实现未使用；控制高度用 `rows` 或 `autosize` |
| `nativeReadonly` | `boolean` | `false` | 否 | 仅锁定原生 `<textarea>`；与 `readonly`（整体渲染为文本）不同 |
| `field` | `string` | — | 否 | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model` |
| `label` | `string` | — | 否 | 表单内生效。表单标签文字 |
| `rules` | `ValidateRule` | — | 否 | 表单内生效。结构见下方「rules 规则对象」 |
| `tips` | `string` | — | 否 | 表单内生效。表单项提示文案 |
| `span` | `number \| 'full' \| 按 BreakpointName 的对象` | — | 否 | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键 |
| `size` | `ComponentSize` | `'default'` | 否 | 取值 `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled` | `boolean` | `false` | 否 | 禁用时不可输入且清除图标隐藏（原生 `disabled` 属性）；优先级同 `size` |
| `readonly` | `boolean` | `false` | 否 | `true` 时整个组件渲染为保留换行的纯文本，空值显示 `-` |

`rules` 规则对象（与 UInput 的 `ValidateRule` 同一结构）可用键：`required`（`boolean \| string`）、`length`（`number \| [number, string]`）、`min`、`max`、`minLen`、`maxLen`（均为 `number \| [number, string]`）、`match`（`RegExp \| [RegExp, string] \| string`）、`preset`（`'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'`）、`validator`（`(value, data) => Promise<string> \| string`）。元组第二项为校验失败的提示文案；`validator` 返回非空字符串表示失败。

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 每次输入持续触发；值超过 `maxlength` 时先截断再触发 |
| `change` | `value: string` | 失焦或按 Enter 提交值变化时（原生 `change`） |
| `focus` | 无 | 获得焦点 |
| `blur` | 无 | 失去焦点 |
| `clear` | 无 | 点击清除图标；先置 `modelValue` 为 `''`（触发一次 `update:modelValue`），再触发 `clear` |

无暴露成员：`TextareaExposed` 解包后为空，组件 `ref` 上无可访问的属性或方法。

## 典型示例

### 字数限制与统计

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/desktop'
import { shallowRef } from 'vue'

const remark = shallowRef('')
</script>

<template>
  <!-- 计数格式是「剩余字数/上限」：输入 1 个字显示 199/200 -->
  <u-textarea v-model="remark" :maxlength="200" show-count clearable placeholder="请输入备注" />
</template>
```

### 自适应高度与缩放

```vue
<script setup lang="ts">
import { UTextarea } from '@veltra/desktop'
import { shallowRef } from 'vue'

const content = shallowRef('')
</script>

<template>
  <!-- autosize：高度随内容增长 -->
  <u-textarea v-model="content" autosize placeholder="内容多长框多高" />
  <!-- resize 默认 true 且仅纵向拉伸；false 完全禁止，用 rows 固定高度 -->
  <u-textarea v-model="content" :resize="false" :rows="4" placeholder="固定 4 行，禁止拉伸" />
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UTextarea } from '@veltra/desktop'
import { reactive } from 'vue'

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
> - 字数统计格式是「剩余字数/上限」，不是「已输入字数/上限」；输入 1 个字、上限 200 时显示 `199/200`。
> - `showCount` 必须与 `maxlength` 同时设置，只写 `show-count` 不显示计数。
> - 本库的固定行数参数是 `rows`，`height` 参数在类型中声明但当前实现未使用，传了不生效。
> - `resize` 默认 `true` 且仅允许纵向拉伸；要完全禁止拉伸必须显式传 `:resize="false"`。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；`label` / `field` / `rules` / `tips` / `span` 仅在表单内生效。
> - 本库的只读分两级：`readonly` 把整个组件渲染为纯文本，`nativeReadonly` 只给原生 `<textarea>` 加 `readonly` 属性。
> - 本组件没有插槽，自定义前后缀用 `UInput`。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 计数显示的数字越输越小

这不是 bug：计数显示的是剩余可输入字数（`maxlength - 当前长度`），不是已输入字数。要展示已输入字数，用 `remark.value.length` 自行渲染。

### 传了 `show-count` 但不显示计数

原因：未设置 `maxlength`。修复：同时传 `:maxlength="200"`。
