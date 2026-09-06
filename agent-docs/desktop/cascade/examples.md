---
title: UCascade 级联选择示例
description: 用 UCascade 单选或多选层级数据，表单内用 field 绑定
---

`UCascade` 的 `data` 默认用 `label` / `value` / `children` 字段（可用 `label-key`、`value-key`、`children-key` 改）。单选时 `modelValue` 是字符串，多选时是字符串数组。`show-full-path` 默认 `true`：展示、提交值和 `update:label` 都走完整路径；设为 `false` 时只体现叶子。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const region = ref<string>()
const data = [
  {
    value: 'east',
    label: '华东',
    children: [
      { value: 'sh', label: '上海' },
      { value: 'hz', label: '杭州' }
    ]
  },
  {
    value: 'north',
    label: '华北',
    children: [
      { value: 'bj', label: '北京' },
      { value: 'tj', label: '天津' }
    ]
  }
]
</script>

<template>
  <u-cascade v-model="region" :data="data" clearable placeholder="请选择地区" />
</template>
```

表单与多选：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ city: '', cities: [] as string[] })
const data = [
  {
    value: 'gd',
    label: '广东',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' }
    ]
  }
]
</script>

<template>
  <u-form :model="form">
    <u-cascade label="城市" field="city" :data="data" />
    <u-cascade label="多选" field="cities" :data="data" multiple filterable />
  </u-form>
</template>
```
