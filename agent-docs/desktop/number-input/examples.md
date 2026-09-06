---
title: UNumberInput 示例
description: 数字输入、货币与步进，以及在 UForm 内用 field 绑定
---

独立使用走 `v-model`（值为 `number`）；放进 `UForm` 时用 `field`，不要再写 `v-model`。`currency` 按 CNY 展示；`step` 为 `true` 或数字时显示累加按钮；`multiple` 把内部存储按倍数换算后展示。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const count = shallowRef(2.999)
const cents = shallowRef(12345)
</script>

<template>
  <u-number-input v-model="count" :min="0" :max="1000" :step="1" clearable />
  <u-number-input v-model="count" currency :precision="2" />
  <u-number-input v-model="cents" currency :multiple="100" suffix="元" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ age: 18, price: 0 })
</script>

<template>
  <u-form :model="form">
    <u-number-input label="年龄" field="age" :min="0" :max="150" :step="1" :rules="{ min: 0, max: 150 }" />
    <u-number-input label="单价" field="price" currency :precision="2" />
  </u-form>
</template>
```
