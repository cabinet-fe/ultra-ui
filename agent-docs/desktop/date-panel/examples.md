---
title: UDatePanel 日期面板示例
description: 用 UDatePanel 做内嵌日/月/年选择或范围选择，日期类型为 Dater
---

`UDatePanel` 是无输入框的日历面板，供自定义布局或被 `UDatePicker` 复用。选中日通过 `date` + `@select:date` 同步，值为 `@cat-kit/core` 的 `Dater`，不是原生 `Date`。`type` 为 `date` / `month` / `year`。范围模式用 `range`、`range-date` 与 `@select:range-date`。

```vue
<script setup lang="ts">
import { date, type Dater } from '@cat-kit/core'
import { ref } from 'vue'

const selected = ref<Dater>()

function disabledDate(d: Dater) {
  return d.timestamp < date().timestamp
}
</script>

<template>
  <u-date-panel :date="selected" :disabled-date="disabledDate" @select:date="selected = $event" />
</template>
```

按月选择，或选一段范围：

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { ref } from 'vue'

const month = ref<Dater>()
const range = ref<[Dater, Dater]>()
</script>

<template>
  <u-date-panel type="month" :date="month" @select:date="month = $event" />
  <u-date-panel range :range-date="range" @select:range-date="range = $event" />
</template>
```
