---
title: UMultiSelect 多选示例
description: 用 UMultiSelect 从选项列表多选，支持搜索、创建与数量上限
---

`UMultiSelect` 绑定值是数组。选项默认 `label` / `value`。`options` 可以是数组，也可以是 `(qs: string) => options` 的函数（同步或 Promise）。`filterable` 开启搜索，`creatable` 允许把当前输入建成新选项，`max` 限制可选数量，`visibility-limit` 限制已选项展示个数。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selected = ref<(string | number)[]>([1, 2])
const options = [
  { label: '设计', value: 1 },
  { label: '研发', value: 2 },
  { label: '测试', value: 3 },
  { label: '产品', value: 4 }
]
</script>

<template>
  <u-multi-select
    v-model="selected"
    :options="options"
    :max="3"
    filterable
    creatable
    clearable
  />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ tags: [] as string[] })
const options = [
  { label: '紧急', value: 'urgent' },
  { label: '缺陷', value: 'bug' }
]
</script>

<template>
  <u-form :model="form">
    <u-multi-select label="标签" field="tags" :options="options" />
  </u-form>
</template>
```
