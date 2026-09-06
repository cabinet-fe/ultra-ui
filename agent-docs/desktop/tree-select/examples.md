---
title: UTreeSelect 树形选择示例
description: "用 UTreeSelect 从树数据单选，展示文案用 update:text 同步不要 v-model:text"
---

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
const data = [
  {
    name: '总部',
    id: 'hq',
    children: [{ name: '财务', id: 'fin' }]
  }
]
</script>

<template>
  <u-form :model="form">
    <u-tree-select
      label="组织"
      field="org"
      :data="data"
      label-key="name"
      value-key="id"
    />
  </u-form>
</template>
```
