---
title: ULayout 示例
description: 用 cols / rows 分栏，resizable 时至少一列是固定像素才能拖拽
---

`ULayout` 是 CSS Grid 外壳。`cols` / `rows` 可以是空格分隔字符串或数组。`resizable` 为 true 时 `gap` 固定，且需要至少一列宽度是固定像素才能拖；可用 `col-min-sizes` 按列索引限制最小宽度（未写的列可被压到 0）。

```vue
<template>
  <u-layout cols="200px 1fr" :gap="16" style="height: 100vh">
    <aside>侧栏</aside>
    <main>主区</main>
  </u-layout>
</template>
```

可拖拽三栏，并限制每列不小于 120px：

```vue
<template>
  <u-layout cols="240px 1fr 280px" resizable :col-min-sizes="[120, 120, 120]">
    <aside>左</aside>
    <main>中</main>
    <aside>右</aside>
  </u-layout>
</template>
```

行布局用 `rows`，例如页头 + 内容 + 页脚：`rows="auto 1fr auto"`。
