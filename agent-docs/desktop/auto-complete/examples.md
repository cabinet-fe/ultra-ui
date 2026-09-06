---
title: UAutoComplete 示例
description: 建议列表、异步建议，以及在 UForm 内用 field 绑定
---

`UAutoComplete` 根据 `suggestions` 给出补全。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。`suggestions` 可以是字符串数组，也可以是返回字符串数组的函数（实现会把当前输入作为可选参数传入）。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const city = shallowRef('')
const cities = ['北京', '上海', '广州', '深圳', '杭州']
</script>

<template>
  <u-auto-complete v-model="city" :suggestions="cities" placeholder="输入城市" clearable />
</template>
```

函数建议（按关键字过滤）：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const query = shallowRef('')
const all = ['Apple', 'Banana', 'Cherry', 'Grape']

function suggestions(keyword?: string) {
  if (!keyword) return all
  return all.filter((item) => item.toLowerCase().includes(keyword.toLowerCase()))
}
</script>

<template>
  <u-auto-complete v-model="query" :suggestions="suggestions" placeholder="搜索" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ city: '' })
const cities = ['北京', '上海', '广州', '深圳']
</script>

<template>
  <u-form :model="form">
    <u-auto-complete label="城市" field="city" :suggestions="cities" clearable />
  </u-form>
</template>
```
