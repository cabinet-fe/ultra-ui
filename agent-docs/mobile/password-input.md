---
title: 'UPasswordInput 密码输入框（移动端）'
description: '从 `@veltra/mobile` 导出的密码输入框：内部基于移动端 UInput，用掩码字符 `●` 遮盖输入并自带明文/密文切换按钮（44px 触控热区、有值常显的可选清除）；放进 UForm 时用 `field` 绑定 model 并按 `rules` 校验。'
aliases: [password-input, u-password-input, 移动端密码框, PasswordInput, 密码框, 密码输入]
keywords:
  [
    modelValue,
    'update:modelValue',
    clearable,
    field,
    rules,
    placeholder,
    移动端密码框,
    明文切换,
    密文,
    掩码,
    显隐,
    密码输入,
    清空,
    表单校验,
    iOS 缩放
  ]
---

# UPasswordInput 密码输入框（移动端）

`@veltra/mobile` 导出密码输入框 `UPasswordInput`：内部渲染移动端 `UInput`，用掩码字符 `●` 遮盖输入值，右侧按钮切换明文/密文；`modelValue` 始终是真实密码。API 与 `@veltra/desktop` 的 `UPasswordInput` 同名同默认值，交互形态按触屏适配。放进 `UForm` 时改用 `field` 绑定 model 字段并按 `rules` 校验。

## 快速上手

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/password-input/style'

const password = shallowRef('')
</script>

<template>
  <u-password-input v-model="password" placeholder="请输入密码" />
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

/** 密码输入组件属性（与 @veltra/desktop UPasswordInput 对齐）：继承 UInput 的 InputProps，仅重声明 modelValue */
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

| 参数                     | 类型                                           | 默认        | 必填 | 约束                                                                                |
| ------------------------ | ---------------------------------------------- | ----------- | :--: | ----------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string`                                       | `undefined` |  否  | 始终是真实密码；明文/密文切换只改显示，不改值                                       |
| `placeholder`            | `string`                                       | `'请输入'`  |  否  | 转发给内部 `UInput`                                                                 |
| `clearable`              | `boolean`                                      | `false`     |  否  | 与 `UInput` 不同，这里默认 `false`；开启后有值 + 非禁用时显示清除按钮（移动端常显） |
| `size`                   | `ComponentSize`                                | `'default'` |  否  | 取值 `'small' \| 'default' \| 'large'`；优先级：组件 props > 表单 > 全局配置 > 默认 |
| `disabled`               | `boolean`                                      | `false`     |  否  | 禁用时不可输入且清除按钮隐藏；明文切换按钮仍可点击；优先级同 `size`                 |
| `readonly`               | `boolean`                                      | `false`     |  否  | `true` 时整体渲染为掩码文本（`●`）                                                  |
| `field`                  | `string`                                       | —           |  否  | 表单内生效。绑定 `<u-form :model>` 的字段；有 `field` 禁止再写 `v-model`            |
| `label`                  | `string`                                       | —           |  否  | 表单内生效。表单标签文字                                                            |
| `rules`                  | `ValidateRule`                                 | —           |  否  | 表单内生效。结构见 `## API 签名` 的 `ValidateRule`                                  |
| `tips`                   | `string`                                       | —           |  否  | 表单内生效。表单项提示文案                                                          |
| `span`                   | `number \| 'full' \| 按 BreakpointName 的对象` | —           |  否  | 表单内生效。`'full'` 占满一行；对象形态必须含 `default` 键                          |
| `pattern`                | `RegExp`                                       | —           |  否  | 类型上存在但不会转发给内部 `UInput`，传入不生效                                     |
| `prefix` / `suffix`      | `string`                                       | —           |  否  | 字符串属性不会转发给内部 `UInput`，传入不生效；前缀用 `#prefix` 插槽                |
| `nativeReadonly`         | `boolean`                                      | `false`     |  否  | 不会转发给内部 `UInput`，传入不生效                                                 |

插槽：

- `#prefix` —— 转发给内部 `UInput` 的前缀插槽，可用。
- `#suffix` —— 被组件占用（清除按钮 + 明文/密文切换按钮），外部传入无效。

## 方法与事件

| 事件                | payload         | 触发时机                                                                                  |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `update:modelValue` | `value: string` | 每次键入后触发；组件把掩码显示值换算回真实密码后更新 `modelValue`；清空时值置 `''` 并触发 |

仅声明 `update:modelValue` 一个事件：`focus` / `blur` / `change` / `clear` 均无事件出口，需要响应这些时机时监听 `modelValue`（`watch`）。

明文/密文切换是组件内部状态：初始为密文，点击右侧切换按钮（`View` / `Hide` 图标）切换，无 props 控制、无事件通知。

无暴露成员：`PasswordInputExposed` 解包后为空，组件 `ref` 上无可访问的属性或方法。

## 典型示例

### 独立使用与明文切换

```vue
<script setup lang="ts">
import { UButton, UPasswordInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/password-input/style'

const password = shallowRef('abc123')

function submit() {
  // modelValue 始终是真实密码，与当前显示明文还是密文无关
  console.log(password.value.length) // => 6
}
</script>

<template>
  <!-- clearable 默认 false，需显式开启；右侧按钮切换明文/密文，初始密文 -->
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
  <u-button type="primary" @click="submit">提交</u-button>
</template>
```

### 在 UForm 中使用

```vue
<script setup lang="ts">
import { UForm, UPasswordInput } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/password-input/style'

const form = reactive({ password: '' })
</script>

<template>
  <!-- 表单内用 field 绑定 model，禁止再写 v-model；label/rules/tips/span 此处才生效 -->
  <u-form :model="form">
    <u-password-input
      label="密码"
      field="password"
      tips="至少 8 位，须含字母和数字"
      span="full"
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
import { UPasswordInput } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/password-input/style'

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
>
> - 本库的密码遮盖是掩码字符 `●` 替换，不是原生 `type="password"` 的输入框；内部 `<input>` 始终是 `type="text"`。
> - `modelValue` 始终是真实密码，与显示的 `●` 无关；禁止从 DOM 读取该输入框的值。
> - `clearable` 默认 `false`（`UInput` 默认 `true`）；需要清空按钮时显式传 `clearable`，点击只清值，不触发 `clear` 事件。
> - 移动端是清除按钮有值 + 非禁用即常显，桌面端是悬停显示；清除按钮与明文切换按钮均为 44px 级触控热区（最小宽 44px 且撑满输入行高度）。
> - 移动端密度取 `--um-*` token：输入行继承 `UInput` 的 `max(--um-control-height-*, --um-touch-target)` 高度、`--um-control-radius-*` 圆角与 `--um-font-size-main`（16px，防 iOS 聚焦缩放）；嵌入 `UFormItem` 控件区后自动呈行式形态（去边框、透明底、占满控件区）。
> - 类型上仅声明 `update:modelValue` 一个事件；`focus` / `blur` / `change` / `clear` 监听不到，用 `watch` 监听 `modelValue` 代替。
> - `pattern`、`prefix`、`suffix`（字符串）、`nativeReadonly` 不会转发给内部 `UInput`，传入不生效；前缀用 `#prefix` 插槽，`#suffix` 插槽被显隐按钮占用。
> - 明文/密文状态是内部状态，初始密文，无 props 与事件控制。
> - 在 `UForm` 内必须用 `field` 绑定值，禁止同时写 `v-model`；`label` / `field` / `rules` / `tips` / `span` 仅在表单内生效。
> - 按需引入样式必须走 `import '@veltra/mobile/components/password-input/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 监听不到 `blur` / `focus`

原因：`PasswordInputEmits` 只声明 `update:modelValue`，其余事件没有出口。修复：

```vue
<script setup lang="ts">
import { UPasswordInput } from '@veltra/mobile'
import { shallowRef, watch } from 'vue'
import '@veltra/mobile/components/password-input/style'

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
