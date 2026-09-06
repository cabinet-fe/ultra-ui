---
title: UTree 树示例
description: 用 UTree 展示可展开、单选或多选的树数据
---

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
  <u-tree
    ref="tree"
    :data="data"
    selectable
    expand-all
    v-model:selected="selected"
  />
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
  <u-tree
    :data="data"
    label-key="name"
    value-key="id"
    checkable
    v-model:checked="checked"
  />
</template>
```
