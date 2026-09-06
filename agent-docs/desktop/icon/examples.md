---
title: UIcon 图标容器示例
description: 用 UIcon 包裹 @veltra/icons 图标，用 size 控制尺寸、父级 color 上色
---

`UIcon` 只有 `size`（数字或 `` `${number}px` ``），没有 `color` prop。单色图标从 `@veltra/icons/normal` 导入后放进默认插槽，颜色走 `currentColor`。加载转圈给根节点加 class `is-loading`（选择器 `.u-icon.is-loading`）。图标命名见 `agent-docs/icons.md`。

```vue
<script setup lang="ts">
import { Search } from '@veltra/icons/normal'
</script>

<template>
  <div style="color: var(--u-color-primary)">
    <u-icon :size="16">
      <Search />
    </u-icon>
  </div>
  <u-icon :size="20" class="is-loading">
    <Search />
  </u-icon>
</template>
```
