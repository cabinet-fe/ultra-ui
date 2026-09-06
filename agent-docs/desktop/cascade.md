---
title: "UCascade - 级联选择器"
description: "用 UCascade 单选或多选层级数据，表单内用 field 绑定"
---

# UCascade - 级联选择器

## 引入

```ts
import { UCascade } from '@veltra/desktop'
```

## 示例

`UCascade` 的 `data` 默认用 `label` / `value` / `children` 字段（可用 `label-key`、`value-key`、`children-key` 改）。单选时 `modelValue` 是字符串，多选时是字符串数组。`show-full-path` 默认 `true`：展示、提交值和 `update:label` 都走完整路径；设为 `false` 时只体现叶子。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const region = ref<string>()
const data = [
  {
    value: 'east',
    label: '华东',
    children: [
      { value: 'sh', label: '上海' },
      { value: 'hz', label: '杭州' }
    ]
  },
  {
    value: 'north',
    label: '华北',
    children: [
      { value: 'bj', label: '北京' },
      { value: 'tj', label: '天津' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="region" :data="data" clearable placeholder="请选择地区" />
</template>
```

表单与多选：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ city: '', cities: [] as string[] })
const data = [
  {
    value: 'gd',
    label: '广东',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' }
    ]
  }
]
</script>

<template>
  <u-form :model="form">
    <u-cascade label="城市" field="city" :data="data" />
    <u-cascade label="多选" field="cities" :data="data" multiple filterable />
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

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type TreeNode<T = any> = T

export interface CascadeNode<
  Data extends Record<string, any> = Record<string, any>
> extends TreeNode<Data, CascadeNode<Data>> {
  visible: boolean
  value: string
  label: string
}

/** 级联选择器组件属性 */
export interface CascadeProps extends FormComponentProps {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: string
  /** 数据值 */
  modelValue?: string[] | string
  /** 级联数据项的标签字段 */
  labelKey?: string
  /** 级联数据项的值字段 */
  valueKey?: string
  /** 占位符 */
  placeholder?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 子级字段 */
  childrenKey?: string
  /** 严格模式 */
  strict?: boolean
  /**
   * 是否展示/提交完整路径
   * @default true
   * false 时显示、modelValue、update:label 均只体现选中叶子节点
   */
  showFullPath?: boolean
  /**
   * 数据项
   */
  data?: Record<string, any>[]

  /**
   * 多选
   */
  multiple?: boolean
  /**
   * 搜索
   */
  filterable?: boolean
  visibilityLimit?: number
}

export interface PanelItem {
  key: number
  nodes: CascadeNode[]
}

/** 级联选择器组件定义的事件 */
export interface CascadeEmits {
  /** 触发更新 label 事件 */
  (e: 'update:label', label?: string | string[]): void
  (e: 'update:modelValue', value?: string | string[]): void
  (
    e: 'change',
    items: (Record<string, any> & { fullLabel?: string })[],
    fullLabels?: string[]
  ): void
  (
    e: 'change',
    item: (Record<string, any> & { fullLabel?: string }) | undefined,
    fullLabel?: string
  ): void
  (e: 'clear'): void
}

/** 级联选择器组件暴露的属性和方法(组件内部使用) */
export interface _CascadeExposed {}

/** 级联选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CascadeExposed = DeconstructValue<_CascadeExposed>
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。
