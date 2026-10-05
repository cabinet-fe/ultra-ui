---
title: 'URadioGroup 单选框组（移动端）'
description: '从 `@veltra/mobile` 导出的单选框组，用 items 渲染一组行式 URadio（文本在左、圆形选中标记在行右、整行热区 ≥44px、行高对齐 48px）并把选中项的 value 写入 modelValue；选项纵向排列占满整行，divider 可开行间细分隔线，支持按项禁用、整组禁用，可在 UForm 内用 field 绑定表单字段。'
aliases: [radio-group, u-radio-group, 移动端单选框组, 选项组, 单选按钮组, RadioGroup]
keywords:
  [
    modelValue,
    items,
    labelKey,
    valueKey,
    disabledItem,
    divider,
    change,
    field,
    rules,
    移动端单选框组,
    触控热区,
    单选组,
    选项组,
    按项禁用,
    表单单选,
    纵向排列
  ]
---

# URadioGroup 单选框组（移动端）

`@veltra/mobile` 导出 `URadioGroup`。它按 `items` 渲染一组移动端 `URadio`，选项呈**列表行式**（纵向排列、每项占满整行、文本在左、圆形选中标记在行右），选中项的 `value` 写入 `modelValue`（单值，不是数组）；单个单选框的自定义布局用 `URadio`（见 `agent-docs/mobile/radio.md`），表单和常规选项组一律用 `URadioGroup`。与 `@veltra/desktop` 的 `URadioGroup` 同名，但移动端移除了 `block`（默认就是纵向行式）、新增 `divider`。

## 快速上手

```vue
<script setup lang="ts">
import { URadioGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const gender = shallowRef('')
const items = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

function handleChange(item: Record<string, any>) {
  console.log(item.label) // => '女'
}
</script>

<template>
  <u-radio-group v-model="gender" :items="items" @change="handleChange" />
  <!-- => 点选「女」后 gender 为 'female' -->
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

/** 单选框组组件属性（移动端列表行式：选项纵向排列占满整行，选中标记在行右侧） */
export interface RadioGroupProps extends FormComponentProps {
  /** 绑定值，等于选中项的 value */
  modelValue?: any
  /** 单选框项，必填 */
  items: Record<string, any>[]
  /** 选项值 key。默认 'value'；空串按 'value' 处理 */
  valueKey?: string
  /** 标签文本 key。默认 'label'；空串按 'label' 处理 */
  labelKey?: string
  /** 整组禁用 */
  disabled?: boolean
  /** 禁用的选项：返回 true 的项被禁用 */
  disabledItem?: (item: Record<string, any>) => boolean
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

/** 单选框组组件定义的事件 */
export interface RadioGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选项更新事件，payload 为选中的完整选项对象 */
  (e: 'change', item: Record<string, any>): void
}
```

## 参数说明

| 参数                     | 类型                                                       | 默认        | 必填 | 约束                                                                     |
| ------------------------ | ---------------------------------------------------------- | ----------- | :--: | ------------------------------------------------------------------------ |
| `v-model` / `modelValue` | `any`                                                      | —           |  否  | 必须与某项 `valueKey` 字段的值全等（`===`）才有选中项                    |
| `items`                  | `Record<string, any>[]`                                    | —           |  是  | 选项列表；每项必须有 `valueKey` / `labelKey` 指向的字段                  |
| `valueKey`               | `string`                                                   | `'value'`   |  否  | 选项值字段名；空串按 `'value'` 处理                                      |
| `labelKey`               | `string`                                                   | `'label'`   |  否  | 选项文本字段名；空串按 `'label'` 处理                                    |
| `disabled`               | `boolean`                                                  | `false`     |  否  | 整组禁用；未设置时继承 `<u-form>` 的 `disabled`                          |
| `disabledItem`           | `(item: Record<string, any>) => boolean`                   | —           |  否  | 按项禁用；与 `disabled` 同时设置时两项任一为真即禁用                     |
| `divider`                | `boolean`                                                  | `false`     |  否  | `true` 时选项行间显示细分隔线；行式选项始终纵向排列，无横向排列开关      |
| `size`                   | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label`                  | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效                          |
| `field`                  | `string`                                                   | —           |  否  | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`     |
| `tips`                   | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                        |
| `span`                   | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填           |
| `readonly`               | `boolean`                                                  | `false`     |  否  | 只读：渲染选中项的文本，未选中时显示 `-`                                 |
| `rules`                  | `ValidateRule`                                             | —           |  否  | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效                 |

## 方法与事件

| 事件                | payload                     | 触发时机                                                 |
| ------------------- | --------------------------- | -------------------------------------------------------- |
| `update:modelValue` | `modelValue: any`           | 选中项变化后，发出选中项的 `value`                       |
| `change`            | `item: Record<string, any>` | 选中项变化后，发出选中的完整选项对象；点选已选中项不触发 |

组件未 `defineExpose` 任何成员，模板 `ref` 上无可调用的属性或方法。

## 典型示例

### 自定义字段名、按项禁用与行间分隔线

```vue
<script setup lang="ts">
import { URadioGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const selected = shallowRef(2)
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 },
  { name: '王五', id: 3 }
]

function handleChange(item: Record<string, any>) {
  console.log(item.name) // => '李四'
}
</script>

<template>
  <u-radio-group
    v-model="selected"
    :items="users"
    label-key="name"
    value-key="id"
    :disabled-item="(item) => item.id === 3"
    divider
    @change="handleChange"
  />
  <!-- => 「王五」被禁用；divider 打开行间分隔线；点选「李四」后 selected 为 2，change 收到整个 { name: '李四', id: 2 } -->
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { UForm, URadioGroup } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const formData = reactive({ choice: '' })
const options = [
  { value: 'a', label: '选项 A' },
  { value: 'b', label: '选项 B' },
  { value: 'c', label: '选项 C' }
]
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.choice -->
  <u-form :model="formData">
    <u-radio-group label="选择" field="choice" :items="options" :rules="{ required: true }" />
  </u-form>
</template>
```

### 只读展示

```vue
<script setup lang="ts">
import { URadioGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const picked = shallowRef('b')
const items = [
  { label: '快递', value: 'a' },
  { label: '自提', value: 'b' }
]
</script>

<template>
  <!-- readonly 渲染选中项的 labelKey 文本；无选中时显示 - -->
  <u-radio-group v-model="picked" :items="items" readonly />
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端选项呈**列表行式**：纵向排列、每项占满整行、行高对齐 `--um-form-row-height`（48px）、整行热区保底 `--um-touch-target`（44px）、文本 16px（`--um-font-size-main`）、圆形选中标记在行右；嵌入 `UFormItem` 时整组占满控件区。
> - 桌面端仍是横向排列（列间距 `gap×2`、无行间距），无 44px 热区保底；两端正交的排列开关只有移动端的 `divider`（行间细分隔线，默认关闭）。
> - `modelValue` 是单值（选中项的 `value`），不是数组；收集多个值用 `UCheckboxGroup`。
> - 本库 `change` 事件的 payload 是**完整选项对象**，不是 value；取值用 `item[valueKey]`。
> - 选中判定是全等：`modelValue` 与 `valueKey` 字段值类型不一致（如 `'1'` 与 `1`）时无法回显选中。
> - 表单里禁止给多个 `URadio` 写同一个 `field`，一组单选必须用 `URadioGroup` + `field`；有 `field` 时禁止再写 `v-model`。
> - `label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 按需引入样式必须走 `import '@veltra/mobile/components/radio-group/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 设置了 `modelValue` 但没有选中项

原因：`modelValue` 与任何选项的 `valueKey` 字段值都不全等，常见于数字/字符串类型不一致。修复：统一类型，或改用对应字段并通过 `value-key` 指定：

```vue
<script setup lang="ts">
import { URadioGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/radio-group/style'

const selected = shallowRef(2) // 必须是数字 2，写成 '2' 无法回显
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-radio-group v-model="selected" :items="items" label-key="name" value-key="id" />
</template>
```

### 选项之间需要分隔线

移动端选项默认纵向行式排列、行与行紧贴；需要视觉分隔时传 `divider` 打开行间细分隔线，不要自行用 CSS 给选项加边框（会与 `--u-border-muted-color` 主题 token 脱钩）：

```vue
<u-radio-group v-model="selected" :items="items" divider />
```
