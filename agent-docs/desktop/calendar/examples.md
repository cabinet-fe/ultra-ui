---
title: UCalendar 日历示例
description: 用 UCalendar 按 v-model 日期字符串展示当月日历格
---

`UCalendar` 根据 `v-model` 的日期字符串（或未绑定时的当天）画出该月日历。它只负责展示，没有选日回调；需要选择日期请用 `UDatePicker` 或 `UDatePanel`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const month = ref('2026-09-01')
</script>

<template>
  <u-calendar v-model="month" />
</template>
```
