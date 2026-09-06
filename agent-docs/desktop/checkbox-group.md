---
title: "UCheckboxGroup - 复选框组"
description: "用 items 渲染一组复选，以及在 UForm 内用 field 绑定"
---

# UCheckboxGroup - 复选框组

## 引入

```ts
import { UCheckboxGroup } from '@veltra/desktop'
```

## 示例

`UCheckboxGroup` 的值为数组。`items` 必填；默认按 `label` / `value` 取值，可用 `label-key` / `value-key` 改字段。`block` 为纵向排布。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref<number[]>([])
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" />
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" block />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ hobbies: [] as string[] })
const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' }
]
</script>

<template>
  <u-form :model="form">
    <u-checkbox-group label="爱好" field="hobbies" :items="hobbyList" :rules="{ required: true }" />
  </u-form>
</template>
```

## API / 类型

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

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: Array<any>
  /** 复选框项 */
  items: Array<Record<string, any>>
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
  /** 块级显示 */
  block?: boolean
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法 */
export interface CheckboxGroupExposed {}
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。
