---
title: UTextarea 示例
description: 多行输入、字数统计与自适应高度，以及在 UForm 内用 field 绑定
---

独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。`autosize` 随内容增高；`show-count` 配合 `maxlength` 显示字数；`resize` 控制能否拖拽。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const text = shallowRef('')
</script>

<template>
  <u-textarea v-model="text" :rows="3" autosize placeholder="请输入" />
  <u-textarea v-model="text" :maxlength="200" show-count clearable />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ description: '' })
</script>

<template>
  <u-form :model="form">
    <u-textarea label="简介" field="description" :rows="3" span="full" placeholder="请输入简介" />
  </u-form>
</template>
```
