---
title: "UTreeSelect - 树形选择器"
description: "用 UTreeSelect 从树数据单选，展示文案用 update:text 同步不要 v-model:text"
keywords:
  - UTreeSelect
  - @veltra/desktop
  - tree-select
  - TreeSelect
  - 树形选择器
aliases: ["tree-select", "UTreeSelect", "TreeSelect", "树形选择器"]
---

## 快速上手

```ts
import { UTreeSelect } from '@veltra/desktop'
```

## 典型示例

`UTreeSelect` 绑定单个节点值。树字段默认 `label` / `value` / `children`。展示文案始终由 `data` 推导；需要把文案同步到父级冗余字段时监听 `@update:text`，不要写 `v-model:text`。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

const city = ref<string>('hz')
const echo = reactive({ code: 'hz', text: '' })
const data = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      { label: '杭州', value: 'hz' },
      { label: '宁波', value: 'nb' }
    ]
  }
]
</script>

<template>
  <u-tree-select v-model="city" :data="data" expand-all filterable clearable />
  <u-tree-select
    v-model="echo.code"
    :data="data"
    expand-all
    @update:text="echo.text = $event ?? ''"
  />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ org: '' })
const data = [{ name: '总部', id: 'hq', children: [{ name: '财务', id: 'fin' }] }]
</script>

<template>
  <u-form :model="form">
    <u-tree-select label="组织" field="org" :data="data" label-key="name" value-key="id" />
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

/** 树形选择器组件属性 */
export interface TreeSelectProps
  extends FormComponentProps, Omit<TreeProps, 'selected' | 'checked' | 'selectable' | 'checkable'> {
  modelValue?: string | number

  /** 自定义占位文字 */
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
   * 最小宽度
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

/** 树形选择器组件定义的事件 */
export interface TreeSelectEmits {
  (e: 'clear'): void
  (e: 'update:modelValue', value?: string | number): void
  (e: 'change', selectedData?: Record<string, any>): void
  /**
   * 选中项文案变化（单向通知，用于同步父级冗余字段）
   * @description 展示始终由 data 推导，请用 `@update:text` 而非 `v-model:text`
   */
  (e: 'update:text', text?: string): void
}

/** 树形选择器组件暴露的属性和方法(组件内部使用) */
export interface _TreeSelectExposed {}

/** 树形选择器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeSelectExposed = DeconstructValue<_TreeSelectExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
