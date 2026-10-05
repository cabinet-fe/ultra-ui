---
title: 'UCheckboxGroup 复选框组（移动端）'
description: '从 `@veltra/mobile` 导出的复选框组，用 items 渲染一组行式 UCheckbox（左侧圆形勾选指示器、整行热区 ≥44px、行高对齐 48px）并把选中的 value 收集为数组；选项纵向排列占满整行，divider 可开行间细分隔线，readonly 态渲染为 UTag 标签列表；支持自定义 label/value 字段名、整组禁用，可在 UForm 内用 field 绑定。'
aliases: [checkbox-group, u-checkbox-group, 移动端复选框组, 多选组, 勾选组, CheckboxGroup]
keywords:
  [
    modelValue,
    items,
    labelKey,
    valueKey,
    divider,
    field,
    rules,
    'update:modelValue',
    移动端复选框组,
    触控热区,
    勾选组,
    多选组,
    批量勾选,
    值数组,
    表单多选,
    全选,
    只读标签
  ]
---

# UCheckboxGroup 复选框组（移动端）

`@veltra/mobile` 导出 `UCheckboxGroup`。它按 `items` 渲染一组移动端 `UCheckbox`，选项呈**列表行式**（纵向排列、每项占满整行、左侧圆形勾选指示器），把选中项的 `value` 收集为**数组**写入 `modelValue`；需要单个布尔勾选（同意条款、独立开关型确认）时用 `UCheckbox`（见 `agent-docs/mobile/checkbox.md`）。与 `@veltra/desktop` 的 `UCheckboxGroup` 同名，但移动端移除了 `block`（默认就是纵向行式）、新增 `divider`。

## 快速上手

```vue
<script setup lang="ts">
import { UCheckboxGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox-group/style'

const checked = shallowRef<string[]>([])
const items = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '橙子', value: 'orange' }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" />
  <!-- => 勾选「苹果」「橙子」后 checked 为 ['apple', 'orange'] -->
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

/** 复选框组组件属性（移动端列表行式：选项纵向排列占满整行，v-model 为选中值数组） */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 选中项 value 组成的数组 */
  modelValue?: Array<any>
  /** 复选框项，必填 */
  items: Array<Record<string, any>>
  /** 标签文本的 key。默认 'label'；空串按 'label' 处理 */
  labelKey?: string
  /** 值的 key。默认 'value'；空串按 'value' 处理；项的该字段值必须为 truthy */
  valueKey?: string
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

/** 复选框组组件定义的事件 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}
```

## 参数说明

| 参数                     | 类型                                                       | 默认        | 必填 | 约束                                                                     |
| ------------------------ | ---------------------------------------------------------- | ----------- | :--: | ------------------------------------------------------------------------ |
| `v-model` / `modelValue` | `Array<any>`                                               | —           |  否  | 选中项 `value` 的数组；勾选/取消都产生新数组                             |
| `items`                  | `Array<Record<string, any>>`                               | —           |  是  | 选项列表；每项必须有 `valueKey` 指向的字段，且其值必须为 truthy          |
| `labelKey`               | `string`                                                   | `'label'`   |  否  | 选项文本字段名；空串按 `'label'` 处理                                    |
| `valueKey`               | `string`                                                   | `'value'`   |  否  | 选项值字段名；空串按 `'value'` 处理                                      |
| `divider`                | `boolean`                                                  | `false`     |  否  | `true` 时选项行间显示细分隔线；行式选项始终纵向排列，无横向排列开关      |
| `size`                   | `ComponentSize`                                            | `'default'` |  否  | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label`                  | `string`                                                   | —           |  否  | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效                          |
| `field`                  | `string`                                                   | —           |  否  | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model`     |
| `tips`                   | `string`                                                   | —           |  否  | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效                        |
| `span`                   | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | —           |  否  | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填           |
| `disabled`               | `boolean`                                                  | `false`     |  否  | 整组禁用；未设置时继承 `<u-form>` 的 `disabled`                          |
| `readonly`               | `boolean`                                                  | `false`     |  否  | 只读：渲染选中项为 `UTag` 标签列表，无选中时显示 `-`                     |
| `rules`                  | `ValidateRule`                                             | —           |  否  | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效                 |

## 方法与事件

| 事件                | payload             | 触发时机                                       |
| ------------------- | ------------------- | ---------------------------------------------- |
| `update:modelValue` | `value: Array<any>` | 任一选项勾选状态变化后，发出勾选后完整的值数组 |

组件只有 `update:modelValue`，没有 `change` 事件；要监听变化用 `v-model` 配合 `watch`，或直接监听 `@update:model-value`。组件未 `defineExpose` 任何成员。

## 典型示例

### 自定义字段名与行间分隔线

```vue
<script setup lang="ts">
import { UCheckboxGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox-group/style'

const checked = shallowRef<number[]>([])
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="users" label-key="name" value-key="id" />
  <!-- => 勾选「张三」后 checked 为 [1] -->
  <u-checkbox-group v-model="checked" :items="users" label-key="name" value-key="id" divider />
  <!-- => divider 时选项行间显示细分隔线 -->
</template>
```

### 全选联动 UCheckbox 与只读标签展示

```vue
<script setup lang="ts">
import { UCheckbox, UCheckboxGroup } from '@veltra/mobile'
import { computed, shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox/style'
import '@veltra/mobile/components/checkbox-group/style'

const items = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' },
  { label: '音乐', value: 'music' }
]
const hobbies = shallowRef<string[]>(['reading'])

const allChecked = computed(() => hobbies.value.length === items.length)
const indeterminate = computed(
  () => hobbies.value.length > 0 && hobbies.value.length < items.length
)

function handleCheckAll(checked: boolean) {
  hobbies.value = checked ? items.map((item) => item.value) : []
}
</script>

<template>
  <u-checkbox :model-value="allChecked" :indeterminate="indeterminate" @change="handleCheckAll">
    全部爱好
  </u-checkbox>
  <u-checkbox-group v-model="hobbies" :items="items" />
  <!-- readonly 时同一份数据渲染为 UTag 标签列表 -->
  <u-checkbox-group v-model="hobbies" :items="items" readonly />
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { UCheckboxGroup, UForm } from '@veltra/mobile'
import { reactive } from 'vue'
import '@veltra/mobile/components/checkbox-group/style'

const formData = reactive({ hobbies: ['reading'] as string[] })
const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' }
]
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.hobbies -->
  <u-form :model="formData">
    <u-checkbox-group
      label="爱好"
      field="hobbies"
      :items="hobbyList"
      :rules="{ required: true }"
    />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端选项呈**列表行式**：纵向排列、每项占满整行、行高对齐 `--um-form-row-height`（48px）、整行热区保底 `--um-touch-target`（44px）、文本 16px（`--um-font-size-main`）、左侧圆形勾选指示器；嵌入 `UFormItem` 时整组占满控件区。
> - 桌面端仍是横向 flex-wrap 排列（纵横间距统一 `gap×2`），无 44px 热区保底；两端正交的排列开关只有移动端的 `divider`（行间细分隔线，默认关闭）。
> - `readonly` 态渲染为 `UTag` 标签列表（虚线描边），无选中值时显示 `-`；此形态不是禁用外观的复选框。
> - 选项的值字段（`valueKey` 指向的字段）取值必须为 truthy：`0`、`''`、`null` 无法勾选也无法回显选中状态。
> - `modelValue` 是数组，不是单个布尔值；禁止把布尔值绑给 `UCheckboxGroup`。
> - 本库没有 `change` 事件，监听变化用 `@update:model-value` 或 `watch` 值数组。
> - 需要单个布尔勾选用 `UCheckbox`；需要收集一组值用 `UCheckboxGroup`，禁止手写一组 `UCheckbox` 再各自绑定同一个数组字段。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`；`label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 按需引入样式必须走 `import '@veltra/mobile/components/checkbox-group/style'`；独立页面使用前必须初始化主题：`import '@veltra/styles/normalize'`、`import { loadTheme } from '@veltra/styles/theme'` 后调用 `loadTheme()`，否则组件无颜色。

## 常见问题

### 勾选后 `modelValue` 没有变化

原因：该选项 `valueKey` 指向的字段值为 falsy（`0`、`''`、`null`），勾选与回显均被忽略。修复：为每项提供 truthy 的值字段，或改用其他字段并通过 `value-key` 指定：

```vue
<script setup lang="ts">
import { UCheckboxGroup } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/checkbox-group/style'

const checked = shallowRef<number[]>([])
// id 为 0 时勾选无效，改为从 1 开始
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" />
</template>
```

### 选项之间需要分隔线

移动端选项默认纵向行式排列、行与行紧贴；需要视觉分隔时传 `divider` 打开行间细分隔线，不要自行用 CSS 给选项加边框（会与 `--u-border-muted-color` 主题 token 脱钩）：

```vue
<u-checkbox-group v-model="checked" :items="items" divider />
```
