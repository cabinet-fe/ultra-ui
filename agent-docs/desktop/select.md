---
title: USelect 单选选择器
description: "从平铺选项列表中单选一个值的下拉选择器：支持本地/远程搜索过滤、输入创建新选项、可清空、键盘导航、网格布局与超长列表虚拟滚动。v-model 绑定选中项 valueKey 字段的值。"
aliases: [Select, SingleSelect, 下拉框, el-select]
keywords: [modelValue, options, valueKey, labelKey, filterable, creatable, clearable, update:text, SelectProps, placeholder, grid, 远程搜索, 可搜索, 可清空, 选项创建, 下拉选择, 虚拟滚动, 表单选择, 键盘导航]
---

# USelect 单选选择器

`@veltra/desktop` 导出下拉单选组件 `USelect`。`options` 接收平铺对象数组或远程搜索函数，`v-model` 绑定选中项 `valueKey` 字段的值（不是整个选项对象）；支持 `filterable` 搜索、`creatable` 输入创建、`clearable` 清除、键盘导航，选项超过 80 条自动虚拟滚动。分工规则：平铺数据单选用 `USelect`、多选用 `UMultiSelect`；树形层级数据用 `UTreeSelect`；值本身是自由文本、只需输入候选提示时用 `UAutoComplete`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/desktop'

const city = shallowRef<string>()

// 选项为对象数组，默认取 label 作为展示文案、value 作为绑定值
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
</script>

<template>
  <u-select v-model="city" :options="cities" placeholder="请选择城市" clearable filterable />
  <!-- 选中上海后：city => 'shanghai'（valueKey 字段的值，不是选项对象） -->
</template>
```

## API 签名

```ts
import type { CSSProperties, ShallowRef } from 'vue'

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

/** 选择器属性（FormComponentProps 已展开） */
export interface SelectProps {
  /** 绑定值：选中项 valueKey 字段的值，清除后为 undefined */
  modelValue?: any
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
  /** 是否允许创建新的选项。默认 false */
  creatable?: boolean
  /** 网格布局；开启后虚拟滚动失效 */
  grid?: { cols: number; gap?: number }
  /** 下拉面板样式 */
  contentStyle?: CSSProperties | string
  /** 下拉面板类名 */
  contentClass?: unknown
  /** 面板最小宽度 */
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
  /** 是否只读（渲染为纯文本，不渲染下拉）。默认 false */
  readonly?: boolean
  /** 校验规则，仅 UForm 内生效 */
  rules?: ValidateRule
}

export interface SelectEmits {
  /** 选中项文案变化（单向通知，用于同步父级冗余字段）。用 @update:text，不是 v-model:text */
  (e: 'update:text', text?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option?: Record<string, any>): void
}

/** ref 暴露类型（DeconstructValue 解包后的形态）。
 *  注意：当前源码未调用 defineExpose，模板 ref 上取不到 infoText；需要文案时监听 @update:text。 */
export interface SelectExposed {
  /** 信息文本 */
  infoText: string | number
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `any` | — | 否 | 选中项 `valueKey` 字段的值；清除后为 `undefined`。回显按 `===` 与选项严格匹配，类型必须一致 |
| `options` | `Record<string, any>[] \| ((qs: string) => Promise<Record<string, any>[]> \| Record<string, any>[])` | — | 是 | 数组为本地数据；传函数时 `filterable` 强制开启，初始以空串 `''` 调用一次，输入变化以 200ms 防抖调用 |
| `valueKey` | `string` | `'value'` | 否 | 选项对象取值字段名 |
| `labelKey` | `string` | `'label'` | 否 | 选项对象展示字段名；本地过滤仅按该字段 `includes` 匹配 |
| `clearable` | `boolean` | `true` | 否 | 悬停触发器且存在选中值时显示清除图标（替代下拉箭头） |
| `placeholder` | `string` | `'请选择'` | 否 | 无选中值时显示 |
| `filterable` | `boolean` | `false` | 否 | 面板展开后聚焦输入框即时过滤；本地过滤 200ms 防抖 |
| `creatable` | `boolean` | `false` | 否 | 输入串无同 `labelKey` 精确匹配项时置顶临时选项（label=value=输入串），选中后面板关闭时转正为创建项；清除选中会清空全部创建项 |
| `grid` | `{ cols: number; gap?: number }` | — | 否 | 网格布局，`cols` 必填、`gap` 单位 px；开启后虚拟滚动失效，禁止用于大量数据 |
| `contentStyle` | `CSSProperties \| string` | — | 否 | 下拉面板样式 |
| `contentClass` | `unknown` | — | 否 | 下拉面板类名 |
| `minWidth` | `string` | — | 否 | 面板最小宽度 |
| `width` | `string` | 跟随触发元素宽度 | 否 | — |
| `size` | `ComponentSize` | `'default'` | 否 | `'small' \| 'default' \| 'large'`；UForm 上设置的值兜底，组件 prop 优先 |
| `tips` | `string` | — | 否 | 仅 UForm（或 UFormItem）内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 仅 UForm 内生效；对象形态中 `default` 必填，值为列数或 `'full'` |
| `label` | `string` | — | 否 | 仅 UForm 内生效，生成 UFormItem 标签 |
| `field` | `string` | — | 否 | UForm 按该路径读写 `model`；设置后禁止再写 `v-model` |
| `disabled` | `boolean` | `false` | 否 | 禁用交互 |
| `readonly` | `boolean` | `false` | 否 | 渲染为纯文本，不渲染下拉；无选中时显示 `-` |
| `rules` | `ValidateRule` | — | 否 | 仅 UForm 内生效；枚举见 API 签名 |

## 方法与事件

- `update:modelValue` — payload 为选中项 `valueKey` 字段的值（`any`）；清除时 payload 为 `undefined`。`v-model` 即绑定此事件。
- `change` — payload `(option?: Record<string, any>)`：用户选择时为**整个选项对象**，清除时为 `undefined`。仅用户操作触发；UForm 内经 `field:change` 冒泡，`args` 为该 payload。
- `update:text` — payload `(text?: string)`：选中项展示文案。触发时机：用户选择、清除、`modelValue` 回显匹配成功、异步 `options` 到达后完成回显。单向通知，禁止写 `v-model:text`。
- 键盘：`ArrowDown` / `ArrowUp` 移动高亮，`Enter` 选中当前高亮项。
- 插槽：`prefix`（输入框前缀）；`default` 作用域插槽 `{ option, index }` 自定义选项渲染。

## 典型示例

### 可搜索 + 输入创建

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/desktop'

const userId = shallowRef<number>()

// 自定义字段：valueKey / labelKey 指向选项对象上的字段名
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 },
  { name: '王五', id: 3 }
]
</script>

<template>
  <!-- 输入"赵"无精确匹配时置顶临时项，点击或回车即创建并选中 -->
  <u-select
    v-model="userId"
    :options="users"
    value-key="id"
    label-key="name"
    filterable
    creatable
    placeholder="选择或输入创建"
  />
</template>
```

### 远程搜索

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

import { USelect } from '@veltra/desktop'

const productId = shallowRef<number>()

// options 传函数即远程搜索：filterable 自动开启，200ms 防抖
// 初始会以空串调用一次，因此空串分支必须返回数组
async function searchProducts(qs: string) {
  if (!qs) return []
  const res = await fetch(`/api/products?q=${encodeURIComponent(qs)}`)
  return (await res.json()) as { id: number; name: string }[]
}
</script>

<template>
  <u-select
    v-model="productId"
    :options="searchProducts"
    value-key="id"
    label-key="name"
    placeholder="输入关键词搜索产品"
  />
</template>
```

### UForm 内 field 绑定 + 校验 + 同步冗余文案

```vue
<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'

import { UButton, UForm, USelect } from '@veltra/desktop'

// UForm 按 field 路径读写 model；控件上禁止再写 v-model
const form = reactive({ grade: undefined as number | undefined, gradeText: '' })

const formRef = useTemplateRef<{ validate: (keys?: string[]) => Promise<boolean> }>('formRef')

const gradeList = [
  { label: '一年级', value: 1 },
  { label: '二年级', value: 2 },
  { label: '三年级', value: 3 }
]

async function submit() {
  // validate 为异步，全部通过返回 true
  const ok = await formRef.value?.validate()
  if (ok) console.log(form.grade) // => 选中的 value，如 2
}
</script>

<template>
  <u-form ref="formRef" :model="form">
    <u-select
      label="年级"
      field="grade"
      :options="gradeList"
      :rules="{ required: '请选择年级' }"
      :span="12"
      tips="入学年级"
      @update:text="form.gradeText = $event ?? ''"
    />
    <u-button @click="submit">提交</u-button>
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 在 UForm 中必须用 `field` 绑定，禁止再写 `v-model`；`label` / `rules` / `span` / `tips` 仅在 UForm（或 UFormItem）内生效。
> - `v-model` 绑定的是选中项 `valueKey` 字段的值（标量），不是整个选项对象；需要对象时监听 `@change`。
> - 展示文案始终由 `options` 推导；同步冗余文案用 `@update:text`，本库没有 `v-model:text`。
> - `options` 传函数时 `filterable` 被强制开启，且初始以空串 `''` 调用一次，函数必须能处理空串。
> - 本库 `options` 是平铺数组，没有选项分组能力（不是 Element Plus 的 `el-option-group` 模式）。
> - 选项数超过 80 自动启用虚拟滚动；设置 `grid` 后虚拟滚动失效，禁止将 `grid` 用于大量数据。
> - `SelectExposed.infoText` 仅在类型中声明，当前源码未调用 `defineExpose`，模板 ref 上取不到该值；需要文案时用 `@update:text`。
> - 本地搜索只匹配 `labelKey` 字段的 `includes`，不匹配 `valueKey` 与其他字段。
> - 面板内选项列表为空（数据为空、过滤无结果、远程返回空数组）时渲染内置空态组件 `UEmpty`。
> - 清除选中会同时清空 `creatable` 产生的历史创建项。

## 常见问题

### 回显显示原始值而不是 label

原因：`modelValue` 与选项 `valueKey` 字段的值类型不一致，回显按 `===` 严格匹配，`'1'` 匹配不到 `1`。修复：保证类型一致。

```ts
// 选项为 { label: '一年级', value: 1 } 时，初值必须是 number
const grade = ref<number>(1) // 正确
// const grade = ref<string>('1') // 错误：显示 '1' 而不是 '一年级'
```

### 远程搜索函数从未被调用

原因：`options` 传成了数组或函数没有被正确传入（必须用 `:options="searchFn"` 传函数引用，而不是 `options="..."`）。传字符串只会被当作普通属性。

### 在 UForm 中同时写了 `field` 和 `v-model`

状态由 `field` 接管后 `v-model` 是重复绑定，两者会竞争写入。修复：删除 `v-model`，只保留 `field`。
