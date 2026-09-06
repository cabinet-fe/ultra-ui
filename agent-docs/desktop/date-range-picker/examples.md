---
title: UDateRangePicker 日期范围示例
description: 用 UDateRangePicker 选择起止日期，绑定值为二元组
---

`UDateRangePicker` 的 `modelValue` 是 `[start, end]`，元素类型随 `data-type`：默认字符串，也可为 `Date` 或时间戳。占位默认为 `['起始日期', '结束日期']`。`type` 同样支持 `date` / `month` / `year`。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const range = ref<[string, string]>(['2026-03-01', '2026-03-15'])
</script>

<template>
  <u-date-range-picker v-model="range" clearable />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ period: undefined as [string, string] | undefined })
</script>

<template>
  <u-form :model="form">
    <u-date-range-picker label="统计区间" field="period" />
  </u-form>
</template>
```
