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
import { shallowRef, useTemplateRef } from 'vue'

const treeRef = useTemplateRef('tree')
const checked = shallowRef<string[]>([])
const query = shallowRef('')

function onSearch() {
  treeRef.value?.filter(query.value)
}
</script>

<template>
  <u-input v-model="query" placeholder="搜索节点" @input="onSearch" />
  <u-tree ref="tree" :data="data" checkable v-model:checked="checked" style="height: 300px" />
</template>
```

## 单选 + 自定义节点插槽

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

## 严格选择 + 禁用节点 + 右键菜单

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
