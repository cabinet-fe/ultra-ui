---
title: "USelect - 单选选择器"
description: "单选下拉、可搜索与可创建，以及在 UForm 内用 field 绑定"
keywords:
  - USelect
  - @veltra/desktop
  - select
  - Select
  - 单选选择器
aliases: ["select", "USelect", "Select", "单选选择器"]
---
## 快速上手

```ts
import { USelect } from '@veltra/desktop'
```

## 典型示例

`options` 为对象数组，或 `(qs: string) =>` 异步函数（传入函数时会强制开启搜索）。默认 `value` / `label` 字段，可用 `value-key` / `label-key` 改。展示文案由 options 推导，用 `@update:text` 同步冗余字段，不要写 `v-model:text`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

const city = shallowRef('')
const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' }
]

const dict = reactive<{ code?: string; text?: string }>({ code: 'beijing', text: '旧文案' })
</script>

<template>
  <u-select v-model="city" :options="cities" clearable filterable placeholder="请选择城市" />
  <u-select
    v-model="dict.code"
    :options="cities"
    clearable
    @update:text="dict.text = $event"
  />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ grade: '' })
const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' }
]
</script>

<template>
  <u-form :model="form">
    <u-select
      label="年级"
      field="grade"
      :options="gradeList"
      :rules="{ required: true }"
      clearable
      placeholder="请选择年级"
    />
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

import type { CSSProperties, ShallowRef } from 'vue'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue?: any
  /**
   * 列表选项
   * @description 如果传入一个函数，那么filterable会被强制启用
   */
  options?:
    | Record<string, any>[]
    | ((qs: string) => Promise<Record<string, any>[]> | Record<string, any>[])
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
  /** 弹框最小宽度 */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 是否允许创建新的选项 */
  creatable?: boolean

  /**
   * 配置网格布局
   *
   * - 开启网格布局将会导致虚拟滚动失效，因此网格布局不适合大量数据
   * @example
   * ```ts
   * const grid = true
   * // 或者
   * const grid = {
   *   cols: 12,
   *   gap: 10
   * }
   */
  grid?: { cols: number; gap?: number }
}

export interface SelectEmits {
  /**
   * 选中项文案变化（单向通知，用于同步父级冗余字段）
   * @description 展示始终由 options 推导，请用 `@update:text` 而非 `v-model:text`
   */
  (e: 'update:text', text?: string): void
  (e: 'update:modelValue', modelValue?: any): void
  (e: 'change', option?: Record<string, any>): void
}

export interface _SelectExposed {
  /** 信息文本 */
  infoText: ShallowRef<string | number>
}

export type SelectExposed = DeconstructValue<_SelectExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
