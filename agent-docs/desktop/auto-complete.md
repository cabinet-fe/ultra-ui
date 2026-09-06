---
title: "UAutoComplete - 自动补全"
description: "建议列表、异步建议，以及在 UForm 内用 field 绑定"
keywords:
  - UAutoComplete
  - @veltra/desktop
  - auto-complete
  - AutoComplete
  - 自动补全
aliases: ["auto-complete", "UAutoComplete", "AutoComplete", "自动补全"]
---
## 快速上手

```ts
import { UAutoComplete } from '@veltra/desktop'
```

## 典型示例

`UAutoComplete` 根据 `suggestions` 给出补全。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。`suggestions` 可以是字符串数组，也可以是返回字符串数组的函数（实现会把当前输入作为可选参数传入）。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const city = shallowRef('')
const cities = ['北京', '上海', '广州', '深圳', '杭州']
</script>

<template>
  <u-auto-complete v-model="city" :suggestions="cities" placeholder="输入城市" clearable />
</template>
```

函数建议（按关键字过滤）：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const query = shallowRef('')
const all = ['Apple', 'Banana', 'Cherry', 'Grape']

function suggestions(keyword?: string) {
  if (!keyword) return all
  return all.filter((item) => item.toLowerCase().includes(keyword.toLowerCase()))
}
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="suggestions" placeholder="搜索" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ city: '' })
const cities = ['北京', '上海', '广州', '深圳']
</script>

<template>
  <u-form :model="form">
    <u-auto-complete label="城市" field="city" :suggestions="cities" clearable />
  </u-form>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
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
  /** 预设 */
  preset?: PresetRule
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 自动补全组件组件属性 */
export interface AutoCompleteProps extends FormComponentProps {
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 建议 */
  suggestions?: string[] | (() => Promise<string[]> | string[])
  /** 是否可清空 */
  clearable?: boolean
  /** 是否允许输入不在建议列表中的自定义值 */
  allowCustom?: boolean
}

/** 自动补全组件组件定义的事件 */
export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
}

/** 自动补全组件组件暴露的属性和方法(组件内部使用) */
export interface _AutoCompleteExposed {
  open: () => void
  close: () => void
}

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
