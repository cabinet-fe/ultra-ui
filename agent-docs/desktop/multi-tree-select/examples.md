---
title: UMultiTreeSelect 树形多选示例
description: 用 UMultiTreeSelect 从树数据勾选多个节点
---

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
