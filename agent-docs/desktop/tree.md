---
title: UTree 树形控件
description: "@veltra/desktop 导出的树形控件。data 全量驱动，labelKey/valueKey/childrenKey 自定义字段；支持单选（selectable）、父子联动的多选勾选（checkable）、严格勾选、节点过滤、展开折叠、右键菜单、作用域插槽自定义节点；扁平节点超过 80 自动启用虚拟滚动。不支持懒加载与拖拽。"
aliases: [UTree, Tree, 树形控件, TreeSelect 数据源, 勾选树]
keywords: [TreeProps, TreeExposed, TreeNode, checkable, selectable, checkStrictly, checkOnClickNode, expandOnClickNode, labelKey, valueKey, childrenKey, disabledNode, filter, getChecked, node-contextmenu, 勾选树, 节点过滤, 虚拟滚动, 父子联动, 展开折叠]
---

# UTree 树形控件

`@veltra/desktop` 导出树形控件 `UTree`。`data` 一次性全量传入（本库不支持懒加载），字段名由 `labelKey` / `valueKey` / `childrenKey` 自定义；`selectable` 开启单选、`checkable` 开启带父子联动的多选勾选，`checkStrictly` 切换严格勾选；支持字符串或函数过滤、展开/折叠控制、右键菜单、作用域插槽自定义节点；扁平可见节点数超过 80 时自动启用虚拟滚动。不支持拖拽。

## 快速上手

```vue
<script setup lang="ts">
import { UTree } from '@veltra/desktop'
import { ref } from 'vue'

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
</script>

<template>
  <!-- 容器必须限高，否则无滚动区域 -->
  <u-tree v-model:selected="selected" :data="data" selectable style="height: 300px" />
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、树无颜色。

## API 签名

```ts
import type { ComputedRef, ShallowRef } from 'vue'
import type { Forest } from '@cat-kit/core'

/** 树组件属性 */
export interface TreeProps {
  /** 初始是否展开全部节点。默认 false */
  expandAll?: boolean
  /** 点击节点时是否切换该节点的展开/折叠。默认 false */
  expandOnClickNode?: boolean
  /** 节点标题字段名。默认 'label' */
  labelKey?: string
  /** 节点值字段名。默认 'value' */
  valueKey?: string
  /** 子节点数组字段名。默认 'children' */
  childrenKey?: string
  /** 树数据，数组可含多个根（森林）。默认 () => [] */
  data?: Record<string, any>[]
  /** 返回 true 的节点禁用（不可单选/不可勾选）；整棵树构建完成后调用，可安全访问 node.children / node.isLeaf */
  disabledNode?: (item: Record<string, any>, node: TreeNode) => boolean
  /** 开启多选（节点前渲染 checkbox） */
  checkable?: boolean
  /**
   * 点击节点时是否触发勾选，仅 checkable 时生效。默认 true。
   * 注意：与 expandOnClickNode 同时为 true 时，点击节点只展开/折叠、不勾选
   */
  checkOnClickNode?: boolean
  /** 开启单选 */
  selectable?: boolean
  /** 严格勾选：父子勾选互不联动。默认 false */
  checkStrictly?: boolean
  /** 单选选中值（valueKey 字段的值），配合 v-model:selected */
  selected?: any
  /** 多选选中值数组（每项为 valueKey 字段的值），配合 v-model:checked */
  checked?: any[]
  /** 插槽穿透：包装组件（如 UTreeSelect）向内部 UTree 传插槽用 */
  slots?: Record<string, any>
  /** selected/checked 同步时把选中项滚动进可视区域；需 selectable 或 checkable */
  scrollToView?: boolean
}

/** 树组件事件 */
export interface TreeEmit {
  /** 节点展开/折叠后触发（点击展开图标，或 expandOnClickNode 点击节点） */
  (e: 'expand', node: TreeNode): void
  /** 点击节点内容区触发（点展开图标不触发） */
  (e: 'node-click', node: TreeNode): void
  /** 单选：用户点击节点选择时触发（selected 同步回显不触发） */
  (e: 'update:selected', selected?: any, selectedData?: Record<string, any>, node?: TreeNode): void
  /** 多选：勾选状态变化时触发 */
  (e: 'update:checked', checked: any[], checkedData: Record<string, any>[]): void
  /** 节点右键；默认菜单不会被阻止，需自行 event.preventDefault() */
  (e: 'node-contextmenu', event: MouseEvent, node: TreeNode): void
  /** 外部 selected 值同步进组件完成后触发 */
  (e: 'selected-synced', selected?: Record<string, any>): void
}

/** 运行时节点实例（shallowReactive，可写 expanded/checked 等字段） */
export interface TreeNode<Data extends Record<string, any> = Record<string, any>> {
  /** 原始数据对象 */
  data: Data
  parent?: TreeNode<Data>
  children?: TreeNode<Data>[]
  /** 是否叶子节点 */
  isLeaf: boolean
  /** 层级，根为 0；渲染缩进按 depth 生成 */
  depth: number
  /** 展开状态（可写） */
  expanded: boolean
  /** 勾选状态（可写） */
  checked: boolean
  /** 是否禁用 */
  disabled: boolean
  /** 过滤后是否可见（可写） */
  visible: boolean
  loading: boolean
  loaded: boolean
  /** 子节点勾选数大于 0 时为 true（半选） */
  indeterminate: boolean
  /** 直接子节点勾选数量 */
  childrenCheckCount: number
  /** String(data[labelKey]) */
  label: string
  /** data[valueKey] */
  key: string | number
  /** 向上冒泡执行 setter，setter 返回 false 停止冒泡 */
  bubbleSet(setter: (node: TreeNode<Data>) => boolean | void): void
}

/**
 * 树暴露的属性和方法。
 * 原 `_TreeExposed` 经 DeconstructValue 解包：模板 ref 上直接访问，
 * nodes / forest 已解包为值，不需要 .value。
 */
export interface TreeExposed {
  /** 滚动到扁平节点数组（nodes）的第 index 项，垂直居中对齐 */
  scrollTo: (index: number) => void
  /**
   * 过滤树节点。传字符串按 label 包含匹配；传函数返回 true 显示。
   * 传空字符串恢复全部。禁止在 watchEffect 中调用！
   */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  /** 森林实例（已解包） */
  forest: Forest<Record<string, unknown>, any>
  /** 当前扁平可见节点数组（已解包） */
  nodes: TreeNode[]
  /** 勾选/取消单个节点；ctrlKey 为 true 时仅处理该节点，不联动子孙 */
  checkNode: (node: TreeNode, check: boolean, ctrlKey?: boolean) => void
  /** 单选一个节点（再次调用同一节点可取消） */
  selectNode: (node: TreeNode) => void
  /** 全选/全不选：对每个根节点执行勾选级联，跳过禁用节点 */
  checkAll: (check: boolean) => void
  /** 获取单选选中的原始数据对象 */
  getSelected(): Record<string, any> | undefined
  /** 获取勾选中的原始数据对象数组 */
  getChecked(): Record<string, any>[]
  /** 展开全部节点 */
  expandAll(): void
  /** 折叠全部节点 */
  collapseAll(): void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `data` | `Record<string, any>[]` | `[]` | 实际必填 | 必须一次性全量传入；运行期整体替换会重建整棵树，展开/勾选等运行时状态丢失后由 `checked`/`selected` 重新回显 |
| `labelKey` | `string` | `'label'` | 否 | 节点显示文本取 `data[labelKey]` |
| `valueKey` | `string` | `'value'` | 否 | 节点唯一键与选中值取 `data[valueKey]`；整棵树内必须唯一 |
| `childrenKey` | `string` | `'children'` | 否 | 子节点数组字段名 |
| `expandAll` | `boolean` | `false` | 否 | 仅控制初始展开；运行期改值会重建树 |
| `expandOnClickNode` | `boolean` | `false` | 否 | 为 `true` 时点击节点展开/折叠；同时勾选点击将不触发（见 `checkOnClickNode`） |
| `checkable` | `boolean` | `false` | 否 | 开启多选 checkbox；与 `selectable` 可同时开启 |
| `checkOnClickNode` | `boolean` | `true` | 否 | 仅 `checkable` 时生效；`expandOnClickNode` 为 `true` 时点击节点只展开不勾选，此时只有点 checkbox 才勾选 |
| `selectable` | `boolean` | `false` | 否 | 开启单选；点击已选中节点再次点击取消选中 |
| `checkStrictly` | `boolean` | `false` | 否 | `false`（默认）父子联动：勾选节点级联勾选全部子孙、全部子节点勾选后父节点自动勾选；`true` 时互不联动 |
| `selected` | `any` | — | 否 | 节点的 `valueKey` 值；外部赋值会自动展开其祖先链并发出 `selected-synced` |
| `checked` | `any[]` | — | 否 | 节点 `valueKey` 值数组；外部赋值做差集回显并自动展开相关祖先链 |
| `disabledNode` | `(item, node) => boolean` | — | 否 | 整棵树构建完成后 DFS 调用；禁用节点不可单选、不可被级联勾选，checkbox 呈禁用态。父组件每次重渲染生成新函数会触发整棵树重建，复杂函数应缓存 |
| `slots` | `Record<string, any>` | — | 否 | 供包装组件透传插槽；业务直接使用时写模板插槽即可 |
| `scrollToView` | `boolean` | `false` | 否 | 需 `selectable` 或 `checkable`；`selected`/`checked` 同步后自动把选中项滚动进视口 |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 影响节点行高（虚拟滚动估算基准 32/36/44px）与字号；回退链：自身 > UForm 上下文 > 全局配置 > `'default'` |

插槽：默认插槽，作用域 `{ node: TreeNode, data: Record<string, any> }`；不提供时渲染 `node.label`。

## 方法与事件

事件：

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `node-click` | `node: TreeNode` | 点击节点内容区；点击展开图标不触发。无论是否开启单选/多选都会发出 |
| `expand` | `node: TreeNode` | 节点展开/折叠后（点击展开图标或 `expandOnClickNode`）；程序设置 `expanded` 不触发 |
| `update:selected` | `(selected?, selectedData?, node?)` | 用户点击节点单选时；`selected` 为 value（取消时 `undefined`），`selectedData` 为原始数据对象 |
| `update:checked` | `(checked: any[], checkedData: Record<string, any>[])` | 勾选变化（点击 checkbox、点击节点、调用 `checkNode`/`checkAll`） |
| `node-contextmenu` | `(event: MouseEvent, node: TreeNode)` | 右键节点内容区；默认菜单不阻止，需自行 `event.preventDefault()` |
| `selected-synced` | `(selected?: Record<string, any>)` | 外部 `selected` 值同步进组件完成后 |

暴露方法（模板 ref 上直接调用，签名见 `TreeExposed`）：`filter` 同步执行、无返回值；`getSelected`/`getChecked` 同步返回数据对象；`checkNode`/`selectNode`/`checkAll`/`expandAll`/`collapseAll` 同步执行并发出对应 `update:*` 事件；`scrollTo(index)` 同步滚动。

## 典型示例

### 单选 + 自定义节点内容

```vue
<script setup lang="ts">
import { UTree } from '@veltra/desktop'
import type { TreeNode } from '@veltra/desktop'
import { ref } from 'vue'

const selected = ref<string>()
const data = [
  {
    id: 1,
    name: '一级 1',
    count: 3,
    children: [
      { id: 2, name: '二级 1-1', count: 2 },
      { id: 3, name: '二级 1-2' }
    ]
  },
  { id: 4, name: '一级 2', count: 0 }
]

function onSelect(value: unknown, data?: Record<string, any>, node?: TreeNode) {
  console.log('value:', value, 'data:', data) // => 点过的节点再点一次取消，value 为 undefined
}
</script>

<template>
  <u-tree
    v-model:selected="selected"
    :data="data"
    selectable
    label-key="name"
    value-key="id"
    expand-all
    @update:selected="onSelect"
    style="height: 300px"
  >
    <template #default="{ data }">
      <span>
        <b>{{ data.name }}</b>
        <span v-if="data.count != null">（{{ data.count }}）</span>
      </span>
    </template>
  </u-tree>
</template>
```

### 多选勾选（父子联动、禁用、右键菜单）

```vue
<script setup lang="ts">
import { UTree } from '@veltra/desktop'
import type { TreeNode } from '@veltra/desktop'
import { ref } from 'vue'

const checked = ref<string[]>(['0'])

const data = [
  {
    id: '0',
    label: '一级 1',
    children: [
      { id: '0-0', label: '二级 1-1' },
      { id: '0-1', label: '二级 1-2（禁用）' }
    ]
  },
  { id: '1', label: '一级 2' }
]

// 整棵树构建完成后调用，node 可安全访问 children / isLeaf
function disabledNode(item: Record<string, any>) {
  return item.label.includes('禁用')
}

function onContextMenu(e: MouseEvent, node: TreeNode) {
  e.preventDefault()
  console.log('右键节点:', node.label)
}
</script>

<template>
  <!-- Ctrl + 点击 checkbox 只勾选该节点，不级联子孙 -->
  <u-tree
    v-model:checked="checked"
    :data="data"
    checkable
    :disabled-node="disabledNode"
    @node-contextmenu="onContextMenu"
    style="height: 300px"
  />
</template>
```

### 搜索过滤与实例方法

```vue
<script setup lang="ts">
import { UInput, UTree } from '@veltra/desktop'
import type { TreeExposed } from '@veltra/desktop'
import { ref, useTemplateRef, watch } from 'vue'

const treeRef = useTemplateRef<TreeExposed>('tree')
const keyword = ref('')
const checked = ref<string[]>([])

const data = [
  {
    id: 1,
    label: '手抓饼',
    children: [
      { id: 11, label: '鱼香肉丝' },
      { id: 12, label: '宫保鸡丁' }
    ]
  },
  { id: 2, label: '凉皮' }
]

// UInput 无 input 事件，监听 v-model 后调用实例 filter
watch(keyword, (val) => {
  treeRef.value?.filter(val) // 传 '' 恢复全部；按 label 包含匹配
})
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索节点" clearable />
  <u-tree
    ref="tree"
    v-model:checked="checked"
    :data="data"
    checkable
    expand-all
    style="height: 300px"
  />
  <button @click="treeRef?.checkAll(false)">清空勾选</button>
  <button @click="console.log(treeRef?.getChecked())">输出勾选数据</button>
</template>
```

## 注意事项

> [!WARNING]
> - **不支持懒加载**：本库没有 `lazy` / `load` 属性，`TreeNode` 上的 `loading`/`loaded` 字段没有对应的按需加载钩子；节点数据必须通过 `data` 一次性全量传入。
> - **不支持拖拽**：没有 `draggable` 与拖拽相关事件；需要拖拽调序时自行扩展或换用其他方案。
> - `v-model:checked` / `v-model:selected` 绑定的是节点的 **value（`valueKey` 字段的值）**，不是节点对象也不是 label；拿原始数据用 `update:checked` 第二个参数或 `getChecked()`。
> - `filter` 是实例方法，不是 `filter-node-method` 属性；且类型注释原文为「注意：不要再watchEffect中调用！」——`filter` 会写 `visible`/`expanded`，放进 `watchEffect` 会自我触发死循环，用 `watch` 监听输入值后调用。
> - `checkOnClickNode` 默认 `true`，但 `expandOnClickNode` 同时为 `true` 时点击节点只展开/折叠、不勾选；两者需要共存时勾选只能通过 checkbox。
> - `data` / `labelKey` / `valueKey` / `childrenKey` / `expandAll` / `disabledNode` 任一变化都会重建整棵树，节点上手工改过的 `expanded` / `checked` / `visible` 全部丢失；`disabledNode` 用内联箭头函数时父组件每次重渲染都会触发重建。
> - 虚拟滚动无需配置：扁平可见节点数 **大于 80** 自动启用（估算行高 32/36/44px 按尺寸、间距 2px，ResizeObserver 实测回填）；80 及以下为普通渲染。
> - 树容器必须限高（`style="height: …"`），否则内容全部展开、没有滚动区。
> - `node-contextmenu` 不会自动 `preventDefault()`，浏览器默认菜单会弹出。

## 常见问题

### 点击节点没有勾选

`expandOnClickNode` 为 `true` 时点击节点只切换展开，不触发勾选。修复：把 `expandOnClickNode` 设为 `false`，或让用户点 checkbox 勾选。

### 输入框过滤不生效或报循环更新

把 `filter` 写进了 `watchEffect`。`filter` 内部修改节点可见性会再次触发 effect。修复：用 `watch` 监听搜索词后调用：

```ts
watch(keyword, (val) => {
  treeRef.value?.filter(val)
})
```

### 大数据量（上万节点）渲染卡顿

确认两点：容器已限高（虚拟滚动依赖滚动容器），且可见扁平节点数大于 80（低于该阈值不启用虚拟化）。数据仍需全量传入，本库不支持懒加载。
