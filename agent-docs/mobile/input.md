---
title: 'UInput 输入框（移动端）'
description: '从 `@veltra/mobile` 导出的单行文本输入框，面向触屏场景：清除按钮有值常显、`inputmode` / `enterkeyhint` / `maxlength` 透传原生 `<input>` 控制软键盘、44px 触控热区、原生字号 ≥16px 防 iOS 聚焦缩放；支持前后缀与 `pattern` 输入过滤，放进 UForm 时用 `field` 绑定并按 `rules` 校验。'
aliases: [input, u-input, 移动端输入框, TextField, 单行文本框, mobile input]
keywords:
  [
    modelValue,
    'update:modelValue',
    pattern,
    clearable,
    inputmode,
    enterkeyhint,
    maxlength,
    nativeReadonly,
    field,
    rules,
    'prefix:click',
    'suffix:click',
    'native:input',
    移动端输入框,
    触控热区,
    数字键盘,
    回车键,
    清除按钮,
    iOS 缩放,
    拼音输入
  ]
---

# UInput 输入框（移动端）

`@veltra/mobile` 导出单行文本输入框 `UInput`。`v-model` 绑定字符串值，支持前缀/后缀（属性或插槽）、清除按钮与 `pattern` 正则过滤；API 与 `@veltra/desktop` 的 `UInput` 同名同默认值，交互形态按触屏适配。放进 `UForm` 时改用 `field` 绑定 model 字段并按 `rules` 校验。

## 快速上手

```vue
<script setup lang="ts">
import { UInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/input/style'

const keyword = shallowRef('')
</script>

<template>
  <u-input v-model="keyword" placeholder="请输入关键词" />
</template>
```

独立使用走 `v-model`；放进 `<u-form>` 时必须改用 `field`，禁止再写 `v-model`。视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（rules 属性的类型） */
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

/** 输入框组件属性（与 @veltra/desktop UInput 对齐） */
export interface InputProps extends FormComponentProps {
  /** 输入框的值，配合 v-model 使用 */
  modelValue?: string
  /** 占位符。默认 '请输入' */
  placeholder?: string
  /** 前缀文字 */
  prefix?: string
  /** 后缀文字 */
  suffix?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 原生只读：只在内部 <input> 上设置 readonly，不改变组件整体渲染 */
  nativeReadonly?: boolean
  /** 模式（整体匹配的正则）；如果指定请保证有一个符合模式的默认值 */
  pattern?: RegExp
}

export interface InputEmits {
  /** 输入时持续更新（无防抖） */
  (e: 'update:modelValue', value: string): void
  /** 在输入框失焦时触发更新 */
  (e: 'change', value: string): void
  /** 后缀点击事件，payload 为当前值 */
  (e: 'suffix:click', value?: string): void
  /** 前缀点击事件，payload 为当前值 */
  (e: 'prefix:click', value?: string): void
  /** 聚焦事件 */
  (e: 'focus', value?: string): void
  /** 清除事件 */
  (e: 'clear'): void
  /** 失焦事件 */
  (e: 'blur', value?: string): void
  /** 原生输入事件 */
  (e: 'native:input', ev: Event): void
}

/** 组件实例 ref 暴露的成员（源码声明为 _InputExposed，经 DeconstructValue 解包后，ref.value 上直接访问） */
export interface InputExposed {
  /** 原生 <input> 元素引用 */
  el: HTMLInputElement | undefined
}
```

组件对透传属性做分流：`inputmode` / `enterkeyhint` / `maxlength` 三个原生属性落在内部 `<input>` 上，其余属性（含 `class` / `aria-*`）落在根元素上，不构成新的公开 prop。

## 参数说明

| 参数                     | 类型                                           | 默认        | 必填 | 约束                                                                                |
| ------------------------ | ---------------------------------------------- | ----------- | :--: | ----------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string`                                       | `undefined` |  否  | 双向绑定的值                                                                        |
| `placeholder`            | `string`                                       | `'请输入'`  |  否  | —                                                                                   |
| `prefix`                 | `string`                                       | —           |  否  | 前缀文字；也可用 `#prefix` 插槽，两者可同时用                                       |
| `suffix`                 | `string`                                       | —           |  否  | 后缀文字；也可用 `#suffix` 插槽；清除按钮显示时后缀内容被替换                       |
| `clearable`              | `boolean`                                      | `true`      |  否  | 清除按钮显示条件：有值 + 非禁用（移动端常显，无 hover 门槛）                        |
| `nativeReadonly`         | `boolean`                                      | `false`     |  否  | 仅锁定原生 `<input>`；与 `readonly`（整体渲染为文本）不同                           |
| `pattern`                | `RegExp`                                       | —           |  否  | 整体匹配：不匹配的键入不提交，失焦时还原显示值；指定后默认值必须匹配                |
| `inputmode`              | `string`（透传属性）                          | —           |  否  | 非公开 prop，写在组件标签上即透传原生 `<input>`，如 `numeric` / `decimal` / `search` |
| `enterkeyhint`           | `string`（透传属性）                          | —           |  否  | 非公开 prop，透传原生 `<input>`，控制软键盘回车键文案，如 `send` / `search` / `next` |
| `maxlength`              | `number`（透传属性）                          | —           |  否  | 非公开 prop，透传原生 `<input>`，限制可输入长度                                     |
| `field`                  | `string`                                       | —           |  否  | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model`            |
| `label`                  | `string`                                       | —           |  否  | 表单内生效。表单标签文字                                                            |
| `rules`                  | `ValidateRule`                                 | —           |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                  |
| `tips`                   | `string`                                       | —           |  否  | 表单内生效。表单项提示文案                                                          |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —           |  否  | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键                          |
| `size`                   | `ComponentSize`                                | `'default'` |  否  | 取值 `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled`               | `boolean`                                      | `false`     |  否  | 禁用时输入与清除按钮均不可用；优先级同 `size`                                       |
| `readonly`               | `boolean`                                      | `false`     |  否  | `true` 时整个组件渲染为纯文本 `prefix + 值 + suffix`（不含插槽内容），空值显示 `-`  |

插槽：`#prefix` 前缀、`#suffix` 后缀。

## 方法与事件

| 事件                | payload                                           | 触发时机                                                                                              |
| ------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `value: string`                                   | 每次键入且值通过 `pattern` 校验时持续触发；无内置防抖；IME 拼音组合输入期间不触发，组合结束后触发一次 |
| `change`            | `value: string`                                   | 失焦提交值变化时（原生 `change`）；值未通过 `pattern` 时不触发，且显示值被还原为 `modelValue`         |
| `focus`             | 无（类型声明可选 `value?: string`，触发时不传参） | 获得焦点                                                                                              |
| `blur`              | 无（类型声明可选 `value?: string`，触发时不传参） | 失去焦点                                                                                              |
| `clear`             | 无                                                | 点击清除按钮；先置 `modelValue` 为 `''`（触发一次 `update:modelValue`），再触发 `clear`               |
| `prefix:click`      | `value?: string`（当前值）                        | 点击前缀区域                                                                                          |
| `suffix:click`      | `value?: string`（当前值）                        | 点击后缀内容区域；清除按钮显示时点击的是清除，不触发本事件                                            |
| `native:input`      | `ev: Event`                                       | 每次非组合输入的原生 `input` 事件，包括被 `pattern` 拒绝的键入                                        |

暴露成员（经 `ref` 访问，`DeconstructValue` 已解包）：

- `el: HTMLInputElement | undefined` —— 原生 `<input>` 元素引用，如 `inputRef.value?.el`。

## 典型示例

### 键盘形态与输入约束

```vue
<script setup lang="ts">
import { UInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/input/style'

const phone = shallowRef('13800138000')
const remark = shallowRef('')
const keyword = shallowRef('')
</script>

<template>
  <!-- inputmode 弹出数字键盘；pattern 拒绝不匹配的键入（默认值必须符合模式） -->
  <u-input v-model="phone" :pattern="/^\d*$/" inputmode="numeric" placeholder="请输入手机号" />
  <!-- maxlength 直接透传原生 <input>，最多输入 20 字 -->
  <u-input v-model="remark" :maxlength="20" placeholder="最多 20 字" />
  <!-- enterkeyhint 控制软键盘回车键文案 -->
  <u-input v-model="keyword" enterkeyhint="search" placeholder="回车键显示「搜索」" />
</template>
```

### 前后缀、点击与清空

```vue
<script setup lang="ts">
import { UIcon, UInput } from '@veltra/mobile'
import { Search } from '@veltra/icons/normal'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/input/style'

const keyword = shallowRef('ultra')

function handleSearch(value?: string) {
  // payload 是点击时的当前值
  console.log('搜索:', value) // => 搜索: ultra
}
</script>

<template>
  <u-input v-model="keyword" prefix="搜索" placeholder="请输入关键词" @suffix:click="handleSearch">
    <template #suffix>
      <u-icon :size="14"><Search /></u-icon>
    </template>
  </u-input>
  <!-- clearable 默认 true：有值即显示清除按钮，点击后触发 clear -->
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UInput } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/input/style'

const form = reactive({ username: '' })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-input
      label="用户名"
      field="username"
      tips="2~20 个字符"
      span="full"
      placeholder="请输入用户名"
      :rules="{ required: true, minLen: [2, '至少 2 个字符'] }"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是清除按钮「有值 + 非禁用」即常显，桌面端是悬停输入框才显示；不需要清除时显式传 `:clearable="false"`。
> - 移动端是 `inputmode` / `enterkeyhint` / `maxlength` 三个原生属性透传到内部 `<input>`，桌面端没有该透传机制；本组件没有控制软键盘的专门 prop，直接在标签上写这三个属性。
> - 移动端是输入行高度 `max(--u-form-component-height-*, 44px)` 保底 44px 触控热区，桌面端高度等于 `--u-form-component-height-*`。
> - 移动端是原生 `<input>` 字号 `max(--u-font-size-main-*, 16px)` 保底 16px，防止 iOS Safari 聚焦时自动缩放视口；桌面端字号直接取 token。
> - 前缀/后缀仅在绑定了 `@prefix:click` / `@suffix:click` 时获得 44px 最小宽度热区；清除按钮最小宽度 44px 且撑满输入行高度。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；`label` / `field` / `rules` / `tips` / `span` 仅在 `UForm`（或 `UFormItem` 包裹）内生效，独立使用时传入无效。
> - 本库的只读分两级：`readonly` 把整个组件渲染为纯文本，`nativeReadonly` 只给原生 `<input>` 加 `readonly` 属性，两者不是一回事。
> - `update:modelValue` 每次键入都触发，本库无内置防抖；需要防抖时在监听侧自行实现（如定时器合并）。
> - 本库的输入过滤参数是 `pattern`（`RegExp`，整体匹配），不是开源库里常见的 `formatter` / `mask`；不匹配的键入被静默丢弃，不抛错。
> - 拼音等 IME 组合输入期间 `modelValue` 不更新，组合结束后才更新一次。
> - 按需引入样式必须走 `import '@veltra/mobile/components/input/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 输入中文时 `update:modelValue` 不触发

原因：IME 组合输入期间的键入被忽略，这是内置行为。组合结束（候选词上屏）后触发一次并拿到完整值，无需修复；禁止在组合期间依赖中间值。

### 键入的字符「被吞」且不报错

原因：值不匹配 `pattern`。`pattern` 是整体匹配（`RegExp.test`），不是逐字符过滤；检查正则是否写了锚点（如 `/^\d*$/`），并保证默认值本身符合模式，否则回显会在失焦时被还原。

### iOS 上点击输入框页面发生缩放

原因：原生 `<input>` 字号低于 16px 时 iOS Safari 聚焦自动放大视口。本组件已内置 `max(字号 token, 16px)` 保底；若仍复现，检查全局样式是否覆盖了输入框字号并把 16px 保底挤掉。
