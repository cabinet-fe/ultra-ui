---
title: UPasswordInput 密码输入框
description: "从 `@veltra/desktop` 导出的密码输入框：内部基于 UInput，用掩码字符遮盖输入并自带明文/密文切换；可选悬停清空（clearable），放进 UForm 时用 `field` 绑定 model 并按 `rules` 校验。"
aliases: [password-input, u-password-input, PasswordInput, 密码框, 密码输入]
keywords: [modelValue, "update:modelValue", clearable, field, rules, placeholder, 密码框, 明文切换, 密文, 掩码, 显隐, 密码输入, 清空, 表单校验]
---

# UPasswordInput 密码输入框

`@veltra/desktop` 导出密码输入框 `UPasswordInput`：内部渲染 `UInput`，用掩码字符 `●` 遮盖输入值，右侧图标切换明文/密文；`modelValue` 始终是真实密码。放进 `UForm` 时改用 `field` 绑定 model 字段并按 `rules` 校验。

## 快速上手

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const password = shallowRef('')
</script>

<template>
  <u-password-input v-model="password" placeholder="请输入密码" />
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

/** 密码输入组件属性：继承 UInput 的 InputProps，仅重声明 modelValue */
export interface PasswordInputProps extends InputProps {
  /** 密码值（真实密码，不是掩码字符），配合 v-model 使用 */
  modelValue?: string
}

/** 密码输入组件定义的事件：仅此一个 */
export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

/** 组件实例 ref 暴露的成员（经 DeconstructValue 解包后为空对象，ref.value 上无可访问成员） */
export type PasswordInputExposed = Record<string, never>
```

说明：`PasswordInputProps` 继承 `InputProps`（`modelValue` / `placeholder` / `prefix` / `suffix` / `clearable` / `nativeReadonly` / `pattern` 及全部表单属性），但实现只向内部 `UInput` 转发 `placeholder` / `size` / `disabled` / `readonly`，见下方参数说明的约束列。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` / `modelValue` | `string` | `undefined` | 否 | 始终是真实密码；明文/密文切换只改显示，不改值 |
| `placeholder` | `string` | `'请输入'` | 否 | 转发给内部 `UInput` |
| `clearable` | `boolean` | `false` | 否 | 与 `UInput` 不同，这里默认 `false`；开启后悬停 + 有值 + 非禁用时显示清除图标 |
| `size` | `ComponentSize` | `'default'` | 否 | 取值 `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled` | `boolean` | `false` | 否 | 禁用时不可输入且清除图标隐藏；明文切换图标仍可点击；优先级同 `size` |
| `readonly` | `boolean` | `false` | 否 | `true` 时整体渲染为掩码文本（`●`） |
| `field` | `string` | — | 否 | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model` |
| `label` | `string` | — | 否 | 表单内生效。表单标签文字 |
| `rules` | `ValidateRule` | — | 否 | 表单内生效。结构见下方「rules 规则对象」 |
| `tips` | `string` | — | 否 | 表单内生效。表单项提示文案 |
| `span` | `number \| 'full' \| 按 BreakpointName 的对象` | — | 否 | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键 |
| `pattern` | `RegExp` | — | 否 | 类型上存在但不会转发给内部 `UInput`，传入不生效 |
| `prefix` / `suffix` | `string` | — | 否 | 字符串属性不会转发给内部 `UInput`，传入不生效；前缀用 `#prefix` 插槽 |
| `nativeReadonly` | `boolean` | `false` | 否 | 不会转发给内部 `UInput`，传入不生效 |

插槽：

- `#prefix` —— 转发给内部 `UInput` 的前缀插槽，可用。
- `#suffix` —— 被组件占用（清除图标 + 明文/密文切换图标），外部传入无效。

`rules` 规则对象（与 UInput 的 `ValidateRule` 同一结构）可用键：`required`（`boolean \| string`）、`length`（`number \| [number, string]`）、`min`、`max`、`minLen`、`maxLen`（均为 `number \| [number, string]`）、`match`（`RegExp \| [RegExp, string] \| string`）、`preset`（`'email' \| 'phone' \| 'num' \| 'url' \| 'idCard'`）、`validator`（`(value, data) => Promise<string> \| string`）。元组第二项为校验失败的提示文案；`validator` 返回非空字符串表示失败。

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 每次键入后触发；组件把掩码显示值换算回真实密码后更新 `modelValue`；清空时值置 `''` 并触发 |

仅声明 `update:modelValue` 一个事件：`focus` / `blur` / `change` / `clear` 均无事件出口，需要响应这些时机时监听 `modelValue`（`watch`）。

明文/密文切换是组件内部状态：初始为密文，点击右侧眼睛图标切换，无 props 控制、无事件通知。

无暴露成员：`PasswordInputExposed` 解包后为空，组件 `ref` 上无可访问的属性或方法。

## 典型示例

### 独立使用与明文切换

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const password = shallowRef('abc123')

function submit() {
  // modelValue 始终是真实密码，与当前显示明文还是密文无关
  console.log(password.value.length) // => 6
}
</script>

<template>
  <!-- clearable 默认 false，需显式开启；右侧眼睛图标切换明文/密文，初始密文 -->
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
  <button @click="submit">提交</button>
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UPasswordInput } from '@veltra/desktop'
import { reactive } from 'vue'

const form = reactive({ password: '' })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-password-input
      label="密码"
      field="password"
      tips="至少 8 位，须含字母和数字"
      placeholder="请输入密码"
      :rules="{
        required: true,
        minLen: [8, '密码至少 8 位'],
        match: [/[a-zA-Z]/, '必须包含字母'],
        validator: (v) => (/\d/.test(v) ? '' : '必须包含数字')
      }"
    />
  </u-form>
</template>
```

### 前缀插槽与状态

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/desktop'
import { shallowRef } from 'vue'

const secret = shallowRef('secret-123')
</script>

<template>
  <!-- prefix 字符串属性不生效，前缀必须用 #prefix 插槽 -->
  <u-password-input v-model="secret" clearable>
    <template #prefix>密钥：</template>
  </u-password-input>
  <u-password-input v-model="secret" disabled placeholder="禁用状态" />
  <!-- readonly 渲染为掩码文本 -->
  <u-password-input v-model="secret" readonly />
</template>
```

## 注意事项

> [!WARNING]
> - 本库的密码遮盖是掩码字符 `●` 替换，不是原生 `type="password"` 的输入框；内部 `<input>` 始终是 `type="text"`。
> - `modelValue` 始终是真实密码，与显示的 `●` 无关；禁止从 DOM 读取该输入框的值。
> - `clearable` 默认 `false`（`UInput` 默认 `true`）；需要清空按钮时显式传 `clearable`，点击只清值，不触发 `clear` 事件。
> - 类型上仅声明 `update:modelValue` 一个事件；`focus` / `blur` / `change` / `clear` 监听不到，用 `watch` 监听 `modelValue` 代替。
> - `pattern`、`prefix`、`suffix`（字符串）、`nativeReadonly` 不会转发给内部 `UInput`，传入不生效；前缀用 `#prefix` 插槽，`#suffix` 插槽被显隐图标占用。
> - 明文/密文状态是内部状态，初始密文，无 props 与事件控制。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；`label` / `field` / `rules` / `tips` / `span` 仅在表单内生效。
> - 独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 监听不到 `blur` / `focus`

原因：`PasswordInputEmits` 只声明 `update:modelValue`，其余事件没有出口。修复：

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/desktop'
import { shallowRef, watch } from 'vue'

const password = shallowRef('')

// 以值的空/non-empty 变化代替 blur/clear 时机
watch(password, (val) => {
  console.log('当前密码长度:', val.length) // => 当前密码长度: 0
})
</script>

<template>
  <u-password-input v-model="password" placeholder="请输入密码" />
</template>
```

### 输入字符 `●` 没有反应

原因：`●` 是本组件的掩码字符，键入 `●` 会被丢弃。这是内置行为，无法通过参数关闭。
