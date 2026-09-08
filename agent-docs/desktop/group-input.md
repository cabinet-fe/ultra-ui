---
title: "UGroupInput - 分组输入"
description: "动态增删一组条目；表单内用 field 绑数组，条目内控件对 item 用 v-model"
keywords:
  - UGroupInput
  - @veltra/desktop
  - group-input
  - GroupInput
  - 分组输入
aliases: ["group-input", "UGroupInput", "GroupInput", "分组输入"]
---

## 快速上手

```ts
import { UGroupInput } from '@veltra/desktop'
```

## 典型示例

`UGroupInput` 绑定对象数组。默认 `creatable` 为 `true`，可用 `max`、`item-default`、`item-style`。插槽参数是 `{ item, index }`，`item` 是当前条目对象。独立使用时外层走 `v-model`；放进 `UForm` 时外层用 `field`，条目内控件对 `item` 写 `v-model`（不是 form 的 field）。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const users = shallowRef<{ name: string; age: string }[]>([])
</script>

<template>
  <u-group-input v-model="users" :max="5" :item-default="{ name: '', age: '' }">
    <template #default="{ item }">
      <u-input v-model="item.name" placeholder="姓名" />
      <u-input v-model="item.age" placeholder="年龄" />
    </template>
  </u-group-input>
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ contacts: [] as { name: string; phone: string }[] })
</script>

<template>
  <u-form :model="form">
    <u-group-input label="联系人" field="contacts" :max="5" creatable span="full">
      <template #default="{ item }">
        <u-input v-model="item.name" placeholder="姓名" />
        <u-input v-model="item.phone" placeholder="电话" />
      </template>
    </u-group-input>
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
    number | 'full' | ({ [key in BreakpointName]?: 'full' | number } & { default: number | 'full' })
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

import type { StyleValue } from 'vue'

/** 分组输入组件属性 */
export interface GroupInputProps<
  GroupItem extends Record<string, any> = Record<string, any>
> extends FormComponentProps {
  modelValue?: GroupItem[]
  /** 最大数量 */
  max?: number
  /** 是否允许创建 */
  creatable?: boolean
  /** 默认值 */
  itemDefault?: Record<string, any>
  /** 输入项样式 */
  itemStyle?: StyleValue
}

/** 分组输入组件定义的事件 */
export interface GroupInputEmits<GroupItem extends Record<string, any> = Record<string, any>> {
  (e: 'update:modelValue', modelValue: GroupItem[]): void
}

/** 分组输入组件暴露的属性和方法(组件内部使用) */
export interface _GroupInputExposed {}

/** 分组输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GroupInputExposed = DeconstructValue<_GroupInputExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
