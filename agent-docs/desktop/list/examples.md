---
title: UList / UListItem 示例
description: 列表用 data 驱动，默认插槽拿到 item / index，项内容放进 UListItem
---

`UList` 的 `data` 必填。默认插槽对每一行暴露 `{ item, index }`。行外观用 `UListItem` 包一层（它本身没有额外 props，内容走默认插槽）。列表内部是 `UScroll`，需要限高时在 `UList` 上设 `style="height: …"`。

## UList

```vue
<script setup lang="ts">
const data = [
  { id: 1, title: '收件箱' },
  { id: 2, title: '已发送' },
  { id: 3, title: '草稿' }
]
</script>

<template>
  <u-list :data="data" style="height: 320px" v-slot="{ item }">
    <u-list-item>{{ item.title }}</u-list-item>
  </u-list>
</template>
```

## UListItem 点击行

```vue
<script setup lang="ts">
const data = [
  { id: 'a', title: '任务 A' },
  { id: 'b', title: '任务 B' }
]

function onPick(row: { id: string; title: string }) {
  console.log(row.id)
}
</script>

<template>
  <u-list :data="data" v-slot="{ item }">
    <u-list-item @click="onPick(item)">{{ item.title }}</u-list-item>
  </u-list>
</template>
```
