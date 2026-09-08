---
title: "UTree - 树形控件"
description: "用 UTree 展示可展开、单选或多选的树数据"
keywords:
  - UTree
  - @veltra/desktop
  - tree
  - Tree
  - 树形控件
aliases: ["tree", "UTree", "Tree", "树形控件"]
---

## 快速上手

```ts
import { UTree } from '@veltra/desktop'
```

## 典型示例

`UTree` 的 `data` 默认字段是 `label` / `value` / `children`。单选用 `selectable` 与 `v-model:selected`，多选用 `checkable` 与 `v-model:checked`。`check-strictly` 为真时父子勾选互不影响。通过模板引用可调用 `filter`、`expandAll`、`getChecked` 等（类型 `TreeExposed`）。

```vue
<script setup lang="ts">
import type { TreeExposed } from '@veltra/desktop'
import { ref, useTemplateRef, watch } from 'vue'

const treeRef = useTemplateRef<TreeExposed>('tree')
const keyword = ref('')
const selected = ref<string>()
const data = [
  {
    label: '文档',
    value: 'docs',
    children: [
      { label: '指南', value: 'guide' },
      { label: 'API', value: 'api' }
    ]
  },
  { label: '示例', value: 'examples' }
]

watch(keyword, (qs) => {
  treeRef.value?.filter(qs)
})
</script>

<template>
  <u-input v-model="keyword" placeholder="过滤" />
  <u-tree ref="tree" :data="data" selectable expand-all v-model:selected="selected" />
</template>
```

多选：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const checked = ref<string[]>(['guide'])
const data = [
  {
    name: '文档',
    id: 'docs',
    children: [
      { name: '指南', id: 'guide' },
      { name: 'API', id: 'api' }
    ]
  }
]
</script>

<template>
  <u-tree :data="data" label-key="name" value-key="id" checkable v-model:checked="checked" />
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type Forest<T = any> = T[]

export type ITreeNode<T = any> = T

import type { ComputedRef, ShallowRef } from 'vue'

export interface TreeNode<Data extends Record<string, any> = Record<string, any>> extends ITreeNode<
  Data,
  TreeNode<Data>
> {
  parent?: TreeNode<Data>
  children?: TreeNode<Data>[]
  valueKey: string
  labelKey: string
  visible: boolean
  expanded: boolean
  loading: boolean
  loaded: boolean
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  label: string
  key: string | number
  childrenCheckCount: number

  bubbleSet: (setter: (node: TreeNode<Data>) => void) => void
}

/** 树组件属性 */
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

export interface TreeEmit {
  /** 节点展开/折叠事件 */
  (e: 'expand', node: TreeNode): void
  /** 节点点击事件 */
  (e: 'node-click', node: TreeNode): void
  /** 单选选中项 */
  (e: 'update:selected', selected?: any, selectedData?: Record<string, any>, node?: TreeNode): void
  /** 多选选中项 */
  (e: 'update:checked', checked: any[], checkedData: Record<string, any>[]): void
  /** 节点右键菜单事件 */
  (e: 'node-contextmenu', event: MouseEvent, node: TreeNode): void
  /** 选中项同步完成事件 */
  (e: 'selected-synced', selected?: Record<string, any>): void
}

export interface TreeNodeProps {
  node: TreeNode
  /**
   * 虚拟项索引：对应 `nodes` 数组中的绝对位置。
   * 需要传入以便在节点卸载时正确通知 `Virtualizer` 解绑，避免 size=0 的脏测量。
   */
  index?: number
  measureElement?: (index: number, el: Element | null) => void
}

/** 树组件暴露的属性和方法(组件内部使用) */
export interface _TreeExposed {
  /** 滚动到目标元素 */
  scrollTo: (index: number) => void
  /**
   * 过滤树节点。注意：不要再watchEffect中调用！
   * @param filter 过滤器或一个字符串
   */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  forest: ComputedRef<Forest<Record<string, unknown>, any>>
  nodes: ShallowRef<TreeNode[]>
  /** 多选选择节点 */
  checkNode: (node: TreeNode, check: boolean) => void
  /** 单选选择节点 */
  selectNode: (node: TreeNode) => void
  /** 对全部节点进行勾选/取消勾选 */
  checkAll: (check: boolean) => void
  /** 获取选择的节点值 */
  getSelected(): Record<string, any> | undefined
  /** 获取选中的节点值 */
  getChecked(): Record<string, any>[]
  /** 展开全部节点 */
  expandAll(): void
  /** 折叠全部节点 */
  collapseAll(): void
}

/** 树组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TreeExposed = DeconstructValue<_TreeExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
