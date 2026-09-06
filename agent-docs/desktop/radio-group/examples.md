---
title: URadioGroup 示例
description: 用 items 渲染一组单选，以及在 UForm 内用 field 绑定
---

`items` 必填；默认 `value-key` 为 `'value'`、`label-key` 为 `'label'`。`disabled-item` 按项禁用，`block` 为纵向排布。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const gender = shallowRef('1')
const items = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]
</script>

<template>
  <u-radio-group v-model="gender" :items="items" />
  <u-radio-group v-model="gender" :items="items" :disabled-item="(item) => item.value === '1'" />
  <u-radio-group v-model="gender" :items="items" block />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ gender: '' })
const genderList = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]
</script>

<template>
  <u-form :model="form">
    <u-radio-group label="性别" field="gender" :items="genderList" :rules="{ required: true }" />
  </u-form>
</template>
```
