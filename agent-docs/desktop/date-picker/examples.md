---
title: UDatePicker 日期选择示例
description: 用 UDatePicker 选择日/月/年，独立场景用 v-model，表单内用 field
---

`UDatePicker` 默认 `type="date"`、`data-type="string"`。`data-type` 还可为 `date`（原生 `Date`）或 `timestamp`（数字）；只有字符串模式才看 `value-format`。`format` 控制输入框展示。`disabled-date` 收到 `Dater` 与原始 `Date`。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import type { Dater } from '@cat-kit/core'
import { ref } from 'vue'

const joinDate = ref('2026-09-01')

function disabledDate(d: Dater) {
  return d.timestamp > Date.now()
}
</script>

<template>
  <u-date-picker v-model="joinDate" clearable :disabled-date="disabledDate" />
  <u-date-picker v-model="joinDate" type="month" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ birthday: '', hiredAt: undefined as number | undefined })
</script>

<template>
  <u-form :model="form">
    <u-date-picker label="生日" field="birthday" />
    <u-date-picker label="入职时间戳" field="hiredAt" data-type="timestamp" />
  </u-form>
</template>
```
