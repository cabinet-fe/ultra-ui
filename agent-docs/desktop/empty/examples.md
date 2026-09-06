---
title: UEmpty 空状态示例
description: 用 UEmpty 展示空列表占位图标与文案
---

`UEmpty` 默认图标尺寸 48、文案「暂无数据」。没有插槽，只改 `size` 和 `text`。

```vue
<template>
  <u-empty />
  <u-empty :size="64" text="暂无符合条件的记录" />
</template>
```
