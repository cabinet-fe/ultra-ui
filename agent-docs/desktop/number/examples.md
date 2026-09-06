---
title: UNumber 示例
description: 展示数字，支持货币 / 百分比 / 十进制格式与补间动画
---

`UNumber` 是展示组件，用 `value` 传入数字，不是表单控件。`format` 为 `currency`（CNY）、`percent` 或 `decimal`（默认）。`tween` 开启补间，`duration` 默认 800。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const amount = ref(1000)
</script>

<template>
  <u-number :value="amount" format="currency" :min-precision="1" />
  <u-number :value="0.856" format="percent" />
  <u-number :value="amount" tween format="currency" />
  <u-button type="primary" @click="amount += 1000">+1000</u-button>
</template>
```
