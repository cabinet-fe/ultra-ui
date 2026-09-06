---
title: UGridInput 示例
description: 分格数字输入，可配置长度、分隔符与是否允许 0
---

`UGridInput` 不是表单控件（没有 `field`），用 `v-model` 绑定字符串。默认 6 格、分隔符 `-`、不可输入 0。`zero` 为 `true` 时允许 0–9（验证码）；组织编码等场景保持默认，每位只能是 1–9。暴露 `clear()`。

```vue
<script setup lang="ts">
import type { GridInputExposed } from '@veltra/desktop'
import { shallowRef, useTemplateRef } from 'vue'

const code = shallowRef('')
const otp = shallowRef('')
const inputRef = useTemplateRef<GridInputExposed>('input')

function handleClear() {
  inputRef.value?.clear()
  otp.value = ''
}
</script>

<template>
  <u-grid-input v-model="code" />
  <u-grid-input ref="input" v-model="otp" :length="6" :zero="true" separator="" />
  <u-button @click="handleClear">清空验证码</u-button>
</template>
```
