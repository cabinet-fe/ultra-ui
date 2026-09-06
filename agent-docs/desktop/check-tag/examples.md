---
title: UCheckTag 示例
description: 可切换选中态的标签，用 v-model 或 checked 控制
---

`UCheckTag` 不是表单控件（没有 `field`）。选中态优先读 `modelValue`，否则读 `checked`。点击时 emit `update:modelValue`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const vue = ref(true)
const react = ref(false)
</script>

<template>
  <u-check-tag v-model="vue">Vue</u-check-tag>
  <u-check-tag v-model="react">React</u-check-tag>
</template>
```
