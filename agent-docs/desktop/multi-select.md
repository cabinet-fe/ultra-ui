---
title: UMultiSelect 多选选择器
description: "从平铺选项列表中多选多个值的下拉多选器，已选项渲染为可关闭标签：支持全选、最大可选数 max、已选展示上限 visibilityLimit、本地/远程搜索、输入创建新选项与超长列表虚拟滚动。v-model 绑定选中值数组。"
aliases: [MultiSelect, MultipleSelect, 多选下拉, 标签多选]
keywords: [modelValue, options, valueKey, labelKey, filterable, creatable, clearable, visibilityLimit, max, MultiSelectProps, 全选, 标签, 批量选择, 远程搜索, 选项创建, 可搜索, 可清空, 虚拟滚动, 数量上限]
---

# UMultiSelect 多选选择器

`@veltra/desktop` 导出下拉多选组件 `UMultiSelect`。`options` 接收平铺对象数组或远程搜索函数，`v-model` 绑定选中项 `valueKey` 字段值的**数组**，已选项以可关闭标签展示；面板内置全选与已选计数，支持 `filterable` 搜索、`creatable` 回车创建、`max` 限制可选数、`visibilityLimit` 限制标签展示数，选项超过 80 条自动虚拟滚动。分工规则：平铺数据多选用 `UMultiSelect`、单选用 `USelect`；树形层级数据用 `UTreeSelect`；值本身是自由文本、只需输入候选提示时用 `UAutoComplete`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/desktop'

// 绑定值是数组，元素为各选中项 valueKey 字段的值
const selected = shallowRef<(string | number)[]>(['beijing'])

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' }
]
</script>

<template>
  <u-multi-select v-model="selected" :options="cities" placeholder="请选择城市" clearable filterable />
  <!-- 勾选上海、广州后：selected => ['beijing', 'shanghai', 'guangzhou'] -->
</template>
```

## API 签名

```ts
import type { CSSProperties } from 'vue'

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

/** 多选器属性（FormComponentProps 已展开） */
export interface MultiSelectProps {
  /** 绑定值：选中项 valueKey 字段值的数组 */
  modelValue?: Array<any>
  /** 列表选项。传入函数时 filterable 被强制开启，且初始会以空串调用一次 */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段名。默认 'value' */
  valueKey?: string
  /** 标签字段名。默认 'label' */
  labelKey?: string
  /** 是否可清除。默认 true */
  clearable?: boolean
  /** 占位符。默认 '请选择' */
  placeholder?: string
  /** 是否启用搜索。默认 false */
  filterable?: boolean
  /** 触发器上最多展示的标签数，超出折叠为 +N。默认 3 */
  visibilityLimit?: number
  /** 最大可选数量；达到上限后未选项禁用，且面板全选框禁用 */
  max?: number
  /** 允许输入创建新选项（回车创建）。默认 false */
  creatable?: boolean
  /** 下拉面板样式 */
  contentStyle?: CSSProperties | string
  /** 下拉面板类名 */
  contentClass?: unknown
  /** 面板最小宽度。默认 '220px' */
  minWidth?: string
  /** 面板宽度。默认跟随触发元素宽度 */
  width?: string
  /** 组件尺寸。默认 'default' */
  size?: ComponentSize
  /** UForm 内的提示文字，仅 UForm 内生效 */
  tips?: string
  /** 所占列数，仅 UForm 内生效 */
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
  /** 是否只读（渲染为纯标签，不渲染下拉）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<any>): void
  (e: 'change', options: Record<string, any>[]): void
}

/** ref 暴露类型（DeconstructValue 解包后的形态）：无暴露成员 */
export type MultiSelectExposed = Record<string, never>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `Array<any>` | — | 否 | 元素为各选中项 `valueKey` 字段的值；回显按 Map 键严格匹配（`===`），元素类型必须与选项值一致 |
| `options` | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])` | — | 是 | 数组为本地数据；传函数时 `filterable` 强制开启，初始以空串 `''` 调用一次，输入变化以 200ms 防抖调用 |
| `valueKey` | `string` | `'value'` | 否 | 选项对象取值字段名 |
| `labelKey` | `string` | `'label'` | 否 | 选项对象展示字段名；本地过滤仅按该字段 `includes` 匹配 |
| `clearable` | `boolean` | `true` | 否 | 悬停触发器且存在选中值时显示清除图标，点击清空全部 |
| `placeholder` | `string` | `'请选择'` | 否 | 无选中值且未开启搜索时显示 |
| `filterable` | `boolean` | `false` | 否 | 触发器内嵌查询输入框；本地过滤 200ms 防抖；`creatable` 或 `options` 传函数时强制开启 |
| `visibilityLimit` | `number` | `3` | 否 | 触发器最多展示的标签数，超出折叠为 `+N`；负值按 0 处理；`disabled` / `readonly` 时展示全部 |
| `max` | `number` | — | 否 | 最大可选数；已选数达到 `max` 后未选项禁用，面板全选框禁用，计数显示 `已选 X/max` |
| `creatable` | `boolean` | `false` | 否 | 输入后按 `Enter` 创建新选项，值与标签均为去除首尾空格后的输入串；创建项与已有选项同 label 时勾选原选项 |
| `contentStyle` | `CSSProperties \| string` | — | 否 | 下拉面板样式 |
| `contentClass` | `unknown` | — | 否 | 下拉面板类名 |
| `minWidth` | `string` | `'220px'` | 否 | 面板最小宽度 |
| `width` | `string` | 跟随触发元素宽度 | 否 | — |
| `size` | `ComponentSize` | `'default'` | 否 | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先 |
| `tips` | `string` | — | 否 | 仅 UForm（或 UFormItem）内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 仅 UForm 内生效；对象形态中 `default` 必填，值为列数或 `'full'` |
| `label` | `string` | — | 否 | 仅 UForm 内生效，生成 UFormItem 标签 |
| `field` | `string` | — | 否 | UForm 按该路径读写 `model`；设置后禁止再写 `v-model` |
| `disabled` | `boolean` | `false` | 否 | 禁用交互；标签不可关闭 |
| `readonly` | `boolean` | `false` | 否 | 渲染为纯标签，不渲染下拉；无选中时显示 `-` |
| `rules` | `ValidateRule` | — | 否 | 仅 UForm 内生效；枚举见 API 签名 |

## 方法与事件

- `update:modelValue` — payload 为选中值数组（`Array<any>`），按勾选顺序追加。`v-model` 即绑定此事件。
- `change` — payload `(options: Record<string, any>[])`：勾选、取消、全选、清除时触发，为**当前全部选中项的选项对象数组**。仅用户操作触发；UForm 内经 `field:change` 冒泡。
- 面板顶部常驻多选栏：全选复选框（支持半选态）与 `已选 X/Y` 计数，`Y` 为 `max ?? options.length`；设置 `max` 后全选框禁用。
- `creatable` 创建方式：在触发器输入框输入后按 `Enter`；重复 `Enter` 不会产生重复项。
- 插槽：`default` 作用域插槽 `{ option, index }` 自定义选项渲染。

## 典型示例

### 搜索 + 数量上限 + 标签折叠

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/desktop'

const users = shallowRef<string[]>([])

const userList = [
  { label: '张三', value: '1' },
  { label: '李四', value: '2' },
  { label: '王五', value: '3' },
  { label: '赵六', value: '4' },
  { label: '孙七', value: '5' }
]
</script>

<template>
  <!-- filterable 搜索；最多选 3 个；触发器最多展示 2 个标签，其余折叠为 +N -->
  <u-multi-select
    v-model="users"
    :options="userList"
    filterable
    :max="3"
    :visibility-limit="2"
    placeholder="最多选择 3 人"
  />
</template>
```

### 远程搜索 + 回车创建标签

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { UMultiSelect } from '@veltra/desktop'

const tags = shallowRef<(string | number)[]>([])

// options 传函数即远程搜索：filterable 自动开启，200ms 防抖
// 初始会以空串调用一次，因此空串分支必须返回数组
async function searchTags(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/tags?q=${encodeURIComponent(qs)}`)
  return (await res.json()) as { id: number; name: string }[]
}
</script>

<template>
  <!-- 输入无匹配项时按 Enter 创建，创建项值=标签=输入串 -->
  <u-multi-select
    v-model="tags"
    :options="searchTags"
    creatable
    value-key="id"
    label-key="name"
    placeholder="搜索或创建标签"
  />
</template>
```

### UForm 内 field 绑定 + 必填校验

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

import { UButton, UForm, UMultiSelect } from '@veltra/desktop'

// UForm 按 field 路径读写 model；控件上禁止再写 v-model
const form = reactive({ tags: [] as string[] })

const formRef = useTemplateRef<{ validate: (keys?: string[]) => Promise<boolean> }>('formRef')

const options = [
  { label: '紧急', value: 'urgent' },
  { label: '缺陷', value: 'bug' },
  { label: '需求', value: 'feature' }
]

async function submit() {
  const ok = await formRef.value?.validate()
  if (ok) console.log(form.tags) // => ['urgent', 'bug']
}
</script>

<template>
  <u-form ref="formRef" :model="form">
    <u-multi-select
      label="标签"
      field="tags"
      :options="options"
      :rules="{ required: '至少选择一个标签' }"
      :span="12"
    />
    <u-button @click="submit">提交</u-button>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效。
> - `v-model` 绑定的是选中值**数组**，不是选项对象数组；需要对象时监听 `@change`（payload 为选中项对象数组）。
> - 本库没有 `update:text` 事件（那是 USelect / UTreeSelect 的），需要文案从 `@change` 的对象数组里取 `labelKey` 字段。
> - `options` 传函数时 `filterable` 被强制开启，且初始以空串 `''` 调用一次，函数必须能处理空串。
> - 本库 `options` 是平铺数组，没有选项分组能力。
> - 设置 `max` 后面板全选框被禁用，这是预期行为；需要全选时移除 `max`。
> - 全选只勾选当前列表里的正式选项，跳过 `creatable` 输入过程中产生的临时项。
> - 清除、取消勾选、全选取消会同步移除 `creatable` 产生的创建项。
> - 选项数超过 80 自动启用虚拟滚动。
> - 面板内选项列表为空（数据为空、过滤无结果、远程返回空数组）时渲染内置空态组件 `UEmpty`；面板顶部的全选栏始终渲染。
> - 类型 JSDoc 中 `width` 标注默认 `'220px'`，实际源码默认的是 `minWidth: '220px'`，`width` 未传时面板跟随触发元素宽度。

## 常见问题

### 回显后标签不显示或只显示部分

原因：`modelValue` 数组元素与选项 `valueKey` 字段的值类型不一致，回显按 Map 键严格匹配，`1` 匹配不到 `'1'`。修复：保证元素类型与选项值一致。

```ts
// 选项为 { label: '设计', value: 1 } 时，初值元素必须是 number
const selected = ref<number[]>([1, 2]) // 正确
// const selected = ref<string[]>(['1']) // 错误：无法匹配，标签不显示
```

### 达到 `max` 后无法继续勾选也无法全选

达到 `max` 后未选项自动禁用、全选框禁用，均为预期行为。需要放开上限时调整 `:max` 取值或移除该属性。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
