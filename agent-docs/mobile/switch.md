---
title: 'USwitch 开关（移动端）'
description: '从 `@veltra/mobile` 导出的开关控件，绑定布尔值表示开/关状态：拨杆热区 ≥44×44、滑轨随尺寸放大（28/30/36px）、支持开/关两侧文案；可在 UForm 内用 field 绑定表单字段。'
aliases: [switch, u-switch, 移动端开关, 切换开关, Switch, 拨动开关]
keywords:
  [
    modelValue,
    activeText,
    inactiveText,
    change,
    field,
    rules,
    'update:modelValue',
    移动端开关,
    触控热区,
    开关,
    切换,
    启用禁用,
    表单开关,
    布尔值
  ]
---

# USwitch 开关（移动端）

`@veltra/mobile` 导出开关控件 `USwitch`。它把布尔值渲染为拨动开关，用于两种互斥状态的切换（启用/禁用、开/关）；需要「勾选/不勾选」语义时用 `UCheckbox`，需要从多个选项取一个值时用 `URadioGroup`。API 与 `@veltra/desktop` 的 `USwitch` 同名同默认值，交互形态按触屏适配。

## 快速上手

```vue
<script setup lang="ts">
import { USwitch } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/switch/style'

const enabled = shallowRef(false)
</script>

<template>
  <u-switch v-model="enabled" />
  <!-- => 打开后 enabled 为 true，关闭后为 false -->
</template>
```

视觉初始化前提：入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** 预设校验规则 */
export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

/** 字段校验规则（rules 属性的类型，UForm 内生效） */
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

/** 开关组件属性（与 @veltra/desktop USwitch 对齐） */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态。默认 false */
  modelValue?: boolean
  /** 打开时显示的文字，位于开关右侧；不设置则不显示 */
  activeText?: string
  /** 关闭时显示的文字，位于开关左侧；不设置则不显示 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}
```

## 参数说明

| 参数                     | 类型                                                       | 默认        | 必填 | 约束                                                                          |
| ------------------------ | ---------------------------------------------------------- | ----------- | :--: | ----------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `boolean`                                                  | `false`     |  否  | 仅 `true` / `false`；本库没有 `activeValue` / `inactiveValue`，不支持非布尔值 |
| `activeText`             | `string`                                                   | —           |  否  | 打开状态的文案，渲染在开关右侧；不设置则不渲染文案                            |
| `inactiveText`           | `string`                                                   | —           |  否  | 关闭状态的文案，渲染在开关左侧；不设置则不渲染文案                            |
| `size`                   | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size`      |
| `label`                  | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效                               |
| `field`                  | `string`                                                   | —           |  否  | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`          |
| `tips`                   | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                             |
| `span`                   | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填                |
| `disabled`               | `boolean`                                                  | `false`     |  否  | 禁用：点击无效；未设置时继承 `<u-form>` 的 `disabled`                         |
| `readonly`               | `boolean`                                                  | `false`     |  否  | 只读：点击无效，渲染形态不变；未设置时继承 `<u-form>` 的 `readonly`           |
| `rules`                  | `ValidateRule`                                             | —           |  否  | 校验规则；仅在 `UForm` 内生效                                                 |

## 方法与事件

| 事件                | payload          | 触发时机                                                    |
| ------------------- | ---------------- | ----------------------------------------------------------- |
| `update:modelValue` | `value: boolean` | 开关状态切换后                                              |
| `change`            | `value: boolean` | 开关状态切换后；`disabled` 或 `readonly` 时点击无效、不触发 |

组件未 `defineExpose` 任何成员，模板 `ref` 上无可调用的属性或方法。

## 典型示例

### 文案与 change 事件

```vue
<script setup lang="ts">
import { USwitch } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/switch/style'

const notification = shallowRef(false)

function handleToggle(value: boolean) {
  console.log('notification:', value) // => 打开后输出 true
}
</script>

<template>
  <!-- 文案仅由 activeText / inactiveText 控制，不设置就不显示 -->
  <u-switch v-model="notification" active-text="开" inactive-text="关" @change="handleToggle" />
</template>
```

### 尺寸、禁用与只读

```vue
<script setup lang="ts">
import { USwitch } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/switch/style'

const enabled = shallowRef(true)
</script>

<template>
  <u-switch v-model="enabled" size="small" />
  <u-switch v-model="enabled" />
  <u-switch v-model="enabled" size="large" />
  <u-switch v-model="enabled" disabled />
  <!-- => disabled 后点击无效，状态不变 -->
  <u-switch v-model="enabled" readonly />
  <!-- => readonly 后点击无效，开关渲染形态不变（不变成文字） -->
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { UForm, USwitch } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/switch/style'

const formData = reactive({ enabled: true, notification: false })
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.enabled / formData.notification -->
  <u-form :model="formData">
    <u-switch label="启用状态" field="enabled" active-text="启用" inactive-text="禁用" />
    <u-switch label="推送通知" field="notification" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端是整个 `<label>` 为拨动热区，最小 `max(--u-form-component-height-*, 44px)` 保底 44×44；桌面端热区高度直接取 `--u-form-component-height-*`，无 44px 保底。
> - 移动端是滑轨高度取 `max(--u-switch-height-<size> × 1.5, 28px)`（small 28px / default 30px / large 36px），宽度为高度两倍；桌面端滑轨高度直接取 `--u-switch-height-<size>`（small 18px / default 20px / large 24px）。
> - 移动端没有 hover，按压反馈走 `:active`（滑轨变色加深）；焦点环由视觉隐藏的原生 `<input>` 驱动（`:focus-visible`）。
> - `modelValue` 是布尔值。本库没有 `activeValue` / `inactiveValue`（不是 Element Plus 的自定义开/关值）；非布尔的两态切换用 `URadioGroup`。
> - 本库没有 `show-text` 属性：文案是否显示由 `activeText` / `inactiveText` 是否设置决定，两个属性互不依赖。
> - `activeText` 渲染在开关右侧，`inactiveText` 渲染在开关左侧；文案不随状态切换隐藏，两侧都设置时同时可见。
> - `readonly` 仅阻止交互，不改变渲染形态。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`；`label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 按需引入样式必须走 `import '@veltra/mobile/components/switch/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 点击开关状态不变

原因：设置了 `disabled` 或 `readonly`，或该属性由 `<u-form>` 继承而来。修复：移除组件上的对应属性，或在表单上放开 `disabled`：

```vue
<script setup lang="ts">
import { UForm, USwitch } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/switch/style'

const formData = reactive({ enabled: true })
</script>

<template>
  <!-- 表单级 disabled 会传导到内部所有开关 -->
  <u-form :model="formData" :disabled="false">
    <u-switch field="enabled" label="启用状态" />
  </u-form>
</template>
```

### 开关尺寸改小后点不中

移动端热区有 44×44 保底，`size="small"` 只缩小滑轨（28px）不缩小热区；点不中的原因不是尺寸，而是 `disabled` / `readonly` 或事件未绑在 `@change` / `v-model` 上。
