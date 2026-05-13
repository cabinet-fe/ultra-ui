# UTree — 树形控件

> `import type { TreeProps, TreeEmit, TreeExposed } from '@veltra/desktop'`

支持单选/多选、展开/折叠、过滤搜索、虚拟滚动（节点数 > 80 时自动启用）、右键菜单、自定义节点渲染。

## Import

```ts
// UTree 由 Vite 自动导入，无需手动 import
// 类型
import type { TreeProps, TreeEmit, TreeExposed } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record<string, any>[]` | `() => []` | 树形数据 |
| `labelKey` | `string` | `'label'` | 标签字段名 |
| `valueKey` | `string` | `'value'` | 值字段名 |
| `childrenKey` | `string` | `'children'` | 子节点字段名 |
| `expandAll` | `boolean` | — | 是否展开所有节点 |
| `expandOnClickNode` | `boolean` | `false` | 是否在点击节点时展开或折叠节点 |
| `checkable` | `boolean` | — | 是否可多选 |
| `selectable` | `boolean` | — | 是否可单选 |
| `checked` | `any[]` | — | 多选选中项（`v-model:checked`） |
| `selected` | `any` | — | 单选选中项（`v-model:selected`） |
| `checkStrictly` | `boolean` | `false` | 严格选择，父子节点勾选状态互不关联 |
| `disabledNode` | `(item: Record<string, any>, node: TreeNode) => boolean` | — | 禁止单选或多选的节点判断函数 |
| `slots` | `Record<string, any>` | — | 插槽穿透，支持通过 props 传入自定义渲染函数 |
| `scrollToView` | `boolean` | — | 使选中项或勾选项自动滚动到可视区域 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:checked` | `(checked: any[], checkedData: Record<string, any>[])` | 多选选中项变化 |
| `update:selected` | `(selected?: any, selectedData?: Record<string, any>, node?: TreeNode)` | 单选选中项变化 |
| `node-click` | `(node: TreeNode)` | 节点点击 |
| `expand` | `(node: TreeNode)` | 节点展开/折叠 |
| `node-contextmenu` | `(event: MouseEvent, node: TreeNode)` | 节点右键菜单 |
| `selected-synced` | `(selected?: Record<string, any>)` | 选中项同步完成（用于异步数据加载后同步选中状态） |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ node: TreeNode, data: Record<string, any> }` | 自定义节点内容，返回 VNode 或字符串；不提供时渲染 `node.label` |

## Exposed

```ts
interface TreeExposed {
  /** 滤树节点。注意：不要在 watchEffect 中调用！ */
  filter(filter: string | ((node: TreeNode) => boolean)): void
  /** 多选勾选/取消勾选节点 */
  checkNode(node: TreeNode, check: boolean): void
  /** 单选选中节点 */
  selectNode(node: TreeNode): void
  /** 全选/取消全选 */
  checkAll(check: boolean): void
  /** 展开全部节点 */
  expandAll(): void
  /** 折叠全部节点 */
  collapseAll(): void
  /** 滚动到指定索引的节点 */
  scrollTo(index: number): void
  /** 获取选中的节点数据 */
  getSelected(): Record<string, any> | undefined
  /** 获取所有勾选的节点数据 */
  getChecked(): Record<string, any>[]
}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
const data = [
  {
    id: 1,
    label: '一级 1',
    children: [
      { id: 2, label: '二级 1-1' },
      { id: 3, label: '二级 1-2' }
    ]
  },
  { id: 4, label: '一级 2' }
]
</script>

<template>
  <u-tree :data="data" style="height: 300px" />
</template>
```

### 多选 + 搜索过滤

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { TreeExposed } from '@veltra/desktop'

const treeRef = shallowRef<TreeExposed>()
const checked = shallowRef<string[]>([])
const query = shallowRef('')

function onSearch() {
  treeRef.value?.filter(query.value)
}
</script>

<template>
  <u-input v-model="query" placeholder="搜索节点" @input="onSearch" />
  <u-tree
    ref="treeRef"
    :data="data"
    checkable
    v-model:checked="checked"
    style="height: 300px"
  />
</template>
```

### 单选 + 自定义节点插槽

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef()
</script>

<template>
  <u-tree
    :data="data"
    selectable
    v-model:selected="selected"
    @update:selected="(val, data, node) => console.log('选中:', data)"
  >
    <template #default="{ data }">
      <span class="custom-node">
        <b>{{ data.label }}</b>
        <span class="count">({{ data.count ?? 0 }})</span>
      </span>
    </template>
  </u-tree>
</template>
```

### 严格选择 + 禁用节点 + 右键菜单

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const checked = shallowRef<string[]>([])

function onContextMenu(e: MouseEvent, node: TreeNode) {
  e.preventDefault()
  console.log('右键节点:', node.label)
  // 在此打开自定义右键菜单
}
</script>

<template>
  <u-tree
    :data="data"
    checkable
    check-strictly
    v-model:checked="checked"
    :disabled-node="(item) => item.disabled === true"
    @node-contextmenu="onContextMenu"
    style="height: 300px"
  />
</template>
```
