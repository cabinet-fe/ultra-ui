---
title: UButton / UButtonGroup 示例
description: 按钮类型、图标与按钮组统一透传 props
---

`UButton` 的 `type` 取主题色（`primary` / `success` / `warning` / `danger` / `info`）。`plain` 为描边，`text` 为文本按钮，`circle` 为圆形（通常配合 `icon`）。`icon` 传 `@veltra/icons/normal` 的组件。默认点击会冒泡，需要拦住时设 `:propagate="false"`。

## UButton

```vue
<script setup lang="ts">
import { Edit, Search } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary" :icon="Search">搜索</u-button>
  <u-button type="primary" plain>朴素</u-button>
  <u-button type="danger" text>文本</u-button>
  <u-button type="primary" circle :icon="Edit" />
  <u-button loading type="primary">保存中</u-button>
</template>
```

## UButtonGroup

组通过默认插槽参数 `props` 把组上的 `size` / `disabled` 等 `ButtonProps` 透传给每个子按钮，子项 `v-bind="props"` 后再写自己的 `type`。

```vue
<template>
  <u-button-group v-slot="{ props }" size="small">
    <u-button v-bind="props" type="primary">剪切</u-button>
    <u-button v-bind="props" type="primary">复制</u-button>
    <u-button v-bind="props" type="primary">粘贴</u-button>
  </u-button-group>
</template>
```
