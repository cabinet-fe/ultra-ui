---
title: UNumberRangeInput 示例
description: 数字区间输入，可用元组或 start/end，以及在 UForm 内用 field 绑定
---

`modelValue` 类型是 `[number | undefined, number | undefined]`，也可用 `v-model:start` / `v-model:end`。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import type { NumberRangeTuple } from '@veltra/desktop'
import { ref } from 'vue'

const range = ref<NumberRangeTuple>([10, 80])
const start = ref<number | undefined>(5)
const end = ref<number | undefined>(20)
</script>

<template>
  <u-number-range-input
    v-model="range"
    :min="0"
    :max="100"
    :step="5"
    start-placeholder="最小"
    end-placeholder="最大"
    separator="至"
  />
  <u-number-range-input v-model:start="start" v-model:end="end" separator="至" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ scoreRange: [0, 100] as [number, number] })

function validateScoreRange(val: [number, number] | undefined) {
  if (!val?.length) return ''
  const [min, max] = val
  if (min != null && max != null && min > max) return '最低分不能高于最高分'
  return ''
}
</script>

<template>
  <u-form :model="form">
    <u-number-range-input
      label="分数区间"
      field="scoreRange"
      :min="0"
      :max="100"
      :rules="{ validator: validateScoreRange }"
      start-placeholder="最低分"
      end-placeholder="最高分"
    />
  </u-form>
</template>
```
