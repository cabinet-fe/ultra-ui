---
title: UTag 标签示例
description: 用 UTag 展示分类标签，支持类型、尺寸、圆角与关闭
---

`UTag` 文案放默认插槽。`type` 取 `primary` / `info` / `success` / `warning` / `danger`。`closable` 时点关闭会发 `close`，需自己从列表里删掉该项。`size` 为 `small` / `default` / `large`。`round` 圆角，`dark` 深色底。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tags = ref(['待办', '进行中', '已完成'])

function remove(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-tag type="primary">主要</u-tag>
  <u-tag type="success" round>成功</u-tag>
  <u-tag size="small" dark>深色</u-tag>
  <u-tag v-for="(name, index) in tags" :key="name" closable @close="remove(index)">
    {{ name }}
  </u-tag>
</template>
```
