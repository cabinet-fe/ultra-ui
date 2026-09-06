---
title: "UMultiTreeSelect - 多选树形选择器"
description: "用 UMultiTreeSelect 从树数据勾选多个节点"
keywords:
  - UMultiTreeSelect
  - @veltra/desktop
  - multi-tree-select
  - MultiTreeSelect
  - 多选树形选择器
aliases: ["multi-tree-select", "UMultiTreeSelect", "MultiTreeSelect", "多选树形选择器"]
---
## 快速上手

```ts
import { UMultiTreeSelect } from '@veltra/desktop'
```

## 典型示例

`UMultiTreeSelect` 的 `modelValue` 是节点值数组。树字段默认 `label` / `value` / `children`，可用 `label-key`、`value-key`、`children-key` 改。`disabled-node` 在整棵树构建完成后调用，第二个参数是树节点。公开类型不含 `checkable` / `selectable`：组件本身就是多选勾选。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref<(string | number)[]>(['hz'])
const data = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      { label: '杭州', value: 'hz' },
      { label: '宁波', value: 'nb' }
    ]
  },
  { label: '上海', value: 'sh' }
]

function disabledNode(item: Record<string, any>) {
  return item.value === 'nb'
}
</script>

<template>
  <u-multi-tree-select
    v-model="checked"
    :data="data"
    :disabled-node="disabledNode"
    filterable
    clearable
  />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ depts: [] as string[] })
const data = [
  {
    name: '研发中心',
    id: 'rd',
    children: [
      { name: '前端', id: 'fe' },
      { name: '后端', id: 'be' }
    ]
  }
]
</script>

<template>
  <u-form :model="form">
    <u-multi-tree-select
      label="部门"
      field="depts"
      :data="data"
      label-key="name"
      value-key="id"
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

export interface TreeProps {
  /** 是否展开所有节点 */
  expandAll?: boolean
  /** 是否在点击节点的时候展开或者收缩节点 */
  expandOnClickNode?: boolean
  /** label键 */
  labelKey?: string
  /** value键 */
  valueKey?: string
  /** 子节点键 */
  childrenKey?: string
  /** 数据 */
  data?: Record<string, any>[]
  /**
   * 禁止单选或多选的节点。
   * 在整棵树构建完成后调用，可安全访问 `node.children` / `node.isLeaf`。
   */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /** 可多选 */
  checkable?: boolean
  /**
   * 点击节点时是否触发勾选。仅当 `checkable` 时生效；
   * 设为 `false` 后只有点击 checkbox 才会勾选。
   * @default true
   */
  checkOnClickNode?: boolean
  /** 可单选 */
  selectable?: boolean
  /**
   * 严格选择，选择的内容和父级不会产生关联
   * @default false
   */
  checkStrictly?: boolean
  /** 单选选中项 */
  selected?: any
  /** 多选选中项 */
  checked?: any[]
  /** 插槽穿透 */
  slots?: Record<string, any>
  /** 使选中项或多选项出现在滚动视图中 */
  scrollToView?: boolean
}

import type { CSSProperties } from 'vue'

/** 树形多选组件组件属性 */
export interface MultiTreeSelectProps
  extends FormComponentProps, Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: (string | number)[]

  /**自定义占位文字 */
  placeholder?: string
  /**
   * 是否可清空
   */
  clearable?: boolean
  /**
   * 是否可搜索
   */
  filterable?: boolean
  /**
   * 可见的节点数量限制 默认3
   */
  visibilityLimit?: number

  /**
   * 弹框最小宽度
   * @default '280px'
   */
  minWidth?: string
  /**
   * 弹框宽度
   * @default 跟随触发元素的宽度
   */
  width?: string
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 内容容器类名 */
  contentClass?: unknown
}

/** 树形多选组件组件定义的事件 */
export interface MultiTreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value: any[]): void
  (e: 'change', checked: Record<string, any>[]): void
}

/** 树形多选组件组件暴露的属性和方法(组件内部使用) */
export interface _MultiTreeSelectExposed {}

/** 树形多选组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiTreeSelectExposed = DeconstructValue<_MultiTreeSelectExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
