# UTree 示例

## 基础用法

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

## 多选 + 搜索过滤

```vue
<script setup lang="ts">
import { shallowRef, useTemplateRef, watch } from 'vue'

const treeRef = useTemplateRef('tree')
const checked = shallowRef<string[]>([])
const query = shallowRef('')

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

// UInput 没有 input 事件，监听 v-model 变化后调用树实例的 filter
watch(query, (val) => {
  treeRef.value?.filter(val)
})
</script>

<template>
  <u-input v-model="query" placeholder="搜索节点" />
  <u-tree ref="tree" :data="data" checkable v-model:checked="checked" style="height: 300px" />
</template>
```

## 单选 + 自定义节点插槽

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const selected = shallowRef()

const data = [
  {
    id: 1,
    label: '一级 1',
    count: 3,
    children: [
      { id: 2, label: '二级 1-1', count: 2 },
      { id: 3, label: '二级 1-2' }
    ]
  },
  { id: 4, label: '一级 2', count: 0 }
]

function onSelect(val: any, data?: Record<string, any>) {
  console.log('选中:', data)
}
</script>

<template>
  <u-tree
    :data="data"
    selectable
    v-model:selected="selected"
    @update:selected="onSelect"
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

## 严格选择 + 禁用节点 + 右键菜单

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { TreeNode } from '@veltra/desktop'

const checked = shallowRef<string[]>([])

const data = [
  {
    id: 1,
    label: '一级 1',
    children: [
      { id: 2, label: '二级 1-1', disabled: true },
      { id: 3, label: '二级 1-2' }
    ]
  },
  { id: 4, label: '一级 2' }
]

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
