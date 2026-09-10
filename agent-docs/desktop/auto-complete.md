---
title: UAutoComplete 自动补全
description: "从 @veltra/desktop 导入的自动补全输入框：输入时给出候选，候选支持静态数组本地过滤或同步/异步函数远程获取，支持键盘上下选择、自定义候选模板与自由输入。"
aliases: [AutoComplete, auto-complete, 自动完成, 输入联想, 输入框补全]
keywords: [modelValue, suggestions, allowCustom, select, clearable, open, close, field, 候选列表, 远程搜索, 异步候选, 输入联想, 自由输入, 键盘导航]
---

# UAutoComplete 自动补全

`@veltra/desktop` 导出的 `UAutoComplete` 是自动补全输入框：`modelValue` 为输入的字符串，`suggestions` 提供候选（静态数组本地过滤，或函数同步/异步获取），选中候选的展示可完全自定义。定位规则：给出一批固定选项让用户挑选用 `USelect`；选项是树形数据用 `UTreeSelect` / `UMultiTreeSelect`；用户输入任意文本并按输入给出候选、最终值允许不在候选中时用 `UAutoComplete`。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const city = shallowRef('')

// 输入变化后按子串包含过滤（区分大小写），输入为空给全量
const cities = ['北京', '上海', '广州', '深圳', '杭州']
</script>

<template>
  <!-- 输入「广」出现候选「广州」，点选或按 Enter 后 city 为 '广州' -->
  <UAutoComplete v-model="city" :suggestions="cities" placeholder="输入城市" />
</template>
```

独立使用（不在 `<u-form>` 内）走 `v-model`；放进 `<u-form>` 必须改用 `field` 绑定，写 `field` 后禁止再写 `v-model`。

## API 签名

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  required?: boolean | string
  length?: number | [number, string]
  min?: number | [number, string]
  max?: number | [number, string]
  minLen?: number | [number, string]
  maxLen?: number | [number, string]
  match?: RegExp | [RegExp, string] | string
  preset?: PresetRule
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

/** 表单控件公共属性（继承自 @veltra/utils 的 FormComponentProps） */
export interface FormComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段：UForm 内用它绑定 model 字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

export interface AutoCompleteProps extends FormComponentProps {
  /** 输入值 */
  modelValue?: string
  /** 占位符，默认 '请输入' */
  placeholder?: string
  /** 候选：字符串数组（本地过滤），或以当前输入为实参的函数（同步/异步） */
  suggestions?: string[] | (() => Promise<string[]> | string[])
  /** 是否可清空，默认 true */
  clearable?: boolean
  /** 是否把不在候选列表中的当前输入作为候选项，默认 true */
  allowCustom?: boolean
}

export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  /** 选中候选时触发；自由输入不触发 */
  (e: 'select', value: string): void
}

/** ref 暴露的方法（经 DeconstructValue 解包，模板 ref 上直接可调用） */
export interface AutoCompleteExposed {
  /** 打开候选面板 */
  open: () => void
  /** 关闭候选面板 */
  close: () => void
}
```

插槽：`default`（作用域 `{ option: string; index: number }`，自定义候选项内容）、`prefix`、`suffix`。

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `v-model` | `string` | — | 否 | 自由输入的候选外文本也会写入 `modelValue` |
| `suggestions` | `string[] \| (() => Promise<string[]> \| string[])` | — | 否 | 数组：按当前输入做子串包含过滤（区分大小写），空输入给全量；函数：输入变化 200ms 防抖后以当前输入为实参调用，返回值整体作为候选、不做本地过滤；不传时面板仅显示已采纳历史 |
| `placeholder` | `string` | `'请输入'` | 否 | 占位文字 |
| `clearable` | `boolean` | `true` | 否 | 悬停且有值时显示清除按钮 |
| `allowCustom` | `boolean` | `true` | 否 | `true` 且当前输入不在候选中时，面板顶部出现「当前输入」候选项；`false` 不出现。两个取值都不阻止自由输入 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 组件未设置时继承 `UForm` 的 `size` |
| `label` | `string` | — | 否 | 标签文字，仅 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 内必须用它绑定字段；写了 `field` 禁止再写 `v-model` |
| `rules` | `ValidateRule` | — | 否 | 校验规则，仅 `UForm` 内生效 |
| `tips` | `string` | — | 否 | 表单内提示文字，仅 `UForm` 内生效 |
| `span` | `number \| 'full' \| 响应式对象` | — | 否 | 所占列宽，仅 `UForm` 内生效 |
| `disabled` | `boolean` | `false` | 否 | 未设置时继承 `UForm` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 未设置时继承 `UForm`；只读时渲染为纯文本 |

## 方法与事件

**ref 方法**（`AutoCompleteExposed` 经 `DeconstructValue` 解包，模板 ref 上直接调用）：

| 方法 | 签名 | 返回 | 说明 |
| --- | --- | --- | --- |
| `open` | `open(): void` | 同步 | 打开候选面板 |
| `close` | `close(): void` | 同步 | 关闭候选面板 |

**事件**：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 输入、点选候选、清除 |
| `select` | `value: string` | 点选候选或键盘选中候选；自由输入、采纳「当前输入」候选项不触发 |

**键盘导航**：`ArrowDown` / `ArrowUp` 循环移动高亮项（面板关闭时按下会展开面板）；`Enter` 选中高亮项；`Escape` 关闭面板；输入时面板自动展开。

**已采纳历史**：每次选中候选后会记入历史并持续出现在候选里，与 `suggestions` 的过滤/返回结果合并展示。

## 典型示例

### 静态候选 + 自定义候选模板

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const query = shallowRef('')

const users = ['Alice', 'Bob', 'Charlie', 'Diana']
</script>

<template>
  <UAutoComplete v-model="query" :suggestions="users" clearable>
    <template #default="{ option, index }">
      <!-- option 是候选字符串，index 为 -1 时是「当前输入」候选项 -->
      <span>{{ index }}号候选：{{ option }}</span>
    </template>
  </UAutoComplete>
</template>
```

### 异步函数候选 + select 事件

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { UAutoComplete } from '@veltra/desktop'

const keyword = shallowRef('')

async function fetchSuggestions(qs?: string): Promise<string[]> {
  if (!qs) return []
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(qs)}`)
    // 必须返回 string[]；请求失败时返回空数组，避免候选区报错
    return (await res.json()) as string[]
  } catch {
    return []
  }
}

function handleSelect(value: string) {
  console.log(value) // => 仅点选/键盘选中候选时触发，如 'Alice'
}
</script>

<template>
  <!-- 输入变化 200ms 后调用 fetchSuggestions，组件对返回结果不做本地过滤 -->
  <UAutoComplete
    v-model="keyword"
    :suggestions="fetchSuggestions"
    placeholder="搜索用户"
    @select="handleSelect"
  />
</template>
```

### UForm 内 field 绑定 + 禁止候选外取值提示

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UAutoComplete, UForm } from '@veltra/desktop'

const form = reactive({ city: '' })

const cities = ['北京', '上海', '广州', '深圳']

// 自由输入不在候选里时给出校验提示
const rules = {
  validator: (value: string) =>
    cities.includes(value) ? '' : '请从候选列表中选择'
}
</script>

<template>
  <!-- 表单内用 field 接管绑定与校验，禁止再写 v-model -->
  <UForm :model="form">
    <UAutoComplete label="城市" field="city" :suggestions="cities" :rules="rules" />
  </UForm>
</template>
```

## 注意事项

> [!WARNING]
> - 在 `<u-form>` 内必须用 `field` 绑定字段，禁止再写 `v-model`。
> - `suggestions` 是 `string[]`，候选内容就是字符串本身，本库没有 `{ value, label }` 对象候选。
> - 函数式候选直接 `return` 数组或 `Promise<string[]>`，不是 Element `el-autocomplete` 的 `(query, callback)` 回调式；签名只有一个入参（当前输入）。
> - `allowCustom` 只控制「把当前输入列为候选项」，不阻止自由输入；要把值限制在候选内必须自己配 `rules` 校验。
> - `select` 仅在选中候选时触发；自由输入只触发 `update:modelValue`，采纳「当前输入」候选项两个事件都不触发（值已在 `modelValue` 中）。
> - 数组式本地过滤区分大小写；函数式调用有 200ms 防抖，远程接口必须自行处理失败：在函数内 `catch` 后返回 `[]`。
> - 本库没有 `filterable` / `remote` 属性，过滤行为由 `suggestions` 的形态决定。

## 常见问题

### 监听不到 `select` 事件

原因：`select` 只在点选或键盘选中候选时触发；用户直接输入的文本只走 `update:modelValue`。修复：需要捕获最终输入值时监听 `v-model` / `update:modelValue`，或在 `UForm` 内用 `field` + `rules` 校验。

```vue
<script setup lang="ts">
import { UAutoComplete } from '@veltra/desktop'

const cities = ['北京', '上海', '广州', '深圳']
</script>

<template>
  <!-- 需要每次输入变化都拿到值时监听 update:modelValue -->
  <UAutoComplete :suggestions="cities" @update:model-value="handleChange" />
</template>
```
