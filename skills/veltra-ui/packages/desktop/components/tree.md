# UTree — 树形控件

> `import type { TreeProps, TreeExposed } from '@veltra/desktop'`

支持单选/多选、展开/折叠、过滤搜索、虚拟滚动、自定义节点渲染。

## Import

```ts
import { UTree } from '@veltra/desktop'
// 类型
import type { TreeExposed } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `data` | `Record[]` | `[]` | 树形数据 |
| `labelKey` | `string` | `'label'` | 标签字段名 |
| `valueKey` | `string` | `'value'` | 值字段名 |
| `childrenKey` | `string` | `'children'` | 子节点字段名 |
| `checkable` | `boolean` | — | 可多选 |
| `selectable` | `boolean` | — | 可单选 |
| `checked` | `any[]` | — | 多选值 (v-model:checked) |
| `selected` | `any` | — | 单选值 (v-model:selected) |
| `checkStrictly` | `boolean` | `false` | 严格选择（父子不关联） |
| `expandAll` | `boolean` | — | 展开所有节点 |
| `expandOnClickNode` | `boolean` | `false` | 点击节点展开 |
| `disabledNode` | `(item, node) => boolean` | — | 禁用节点判断 |

## Emits

| event | 参数 |
|-------|------|
| `update:checked` | `(checked: any[], checkedData: Record[])` |
| `update:selected` | `(selected?: any, selectedData?: Record, node?: TreeNode)` |
| `node-click` | `(node: TreeNode)` |
| `expand` | `(node: TreeNode)` |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ data, node }` | 自定义节点内容 |

## Exposed (TreeExposed)

| 方法 | 说明 |
|------|------|
| `filter(filter)` | 过滤节点（字符串或函数） |
| `checkNode(node, check)` | 勾选/取消节点 |
| `checkAll(check)` | 全选/取消全选 |
| `selectNode(node)` | 单选选中节点 |
| `expandAll()` | 展开全部 |
| `collapseAll()` | 折叠全部 |
| `scrollTo(index)` | 滚动到指定索引 |
| `getChecked()` | 获取选中数据 |
| `getSelected()` | 获取单选数据 |

## Examples

### 基础树

```vue
<script setup>
import { UTree } from '@veltra/desktop'

const data = [
  {
    label: '一级 1',
    children: [
      { label: '二级 1-1' },
      { label: '二级 1-2' }
    ]
  },
  { label: '一级 2' }
]
</script>

<template>
  <u-tree :data="data" style="height: 300px" />
</template>
```

### 多选 + 过滤搜索

```vue
<script setup>
import { shallowRef } from 'vue'
import type { TreeExposed } from '@veltra/desktop'

const treeRef = shallowRef<TreeExposed>()
const checked = shallowRef([])
const qs = shallowRef('')

function onSearch() {
  treeRef.value?.filter(qs.value)
}
</script>

<template>
  <u-input v-model="qs" placeholder="搜索节点" @input="onSearch" />
  <u-tree
    ref="treeRef"
    :data="data"
    checkable
    v-model:checked="checked"
    style="height: 300px"
  />
</template>
```

### 单选 + 自定义节点

```vue
<u-tree
  selectable
  :data="data"
  v-model:selected="selected"
  @update:selected="(val, data, node) => console.log(data)"
>
  <template #default="{ data }">
    <span style="margin-left: 8px">
      <b>{{ data.label }}</b>
      <span style="color: #999">({{ data.count ?? 0 }})</span>
    </span>
  </template>
</u-tree>
```

### 禁用特定节点 + 严格选择

```vue
<u-tree
  :data="data"
  checkable
  check-strictly
  v-model:checked="checked"
  :disabled-node="(item) => item.id === '0-1'"
/>
```
