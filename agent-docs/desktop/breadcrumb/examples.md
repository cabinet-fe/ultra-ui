---
title: UBreadcrumb 示例
description: 用 items 渲染面包屑路径，无 href 的项走 click 事件做 SPA 跳转
---

`UBreadcrumb` 只吃 `items`：每项必有 `title`。带 `href` 的项渲染为 `<a>`，由浏览器导航，不触发 `@click`；无 `href` 的链式项点击才发出 `@click`。末级默认是当前页（`aria-current="page"`），需要末级也可点时加 `last-linked`。

```vue
<script setup lang="ts">
import type { BreadcrumbItem } from '@veltra/desktop'
import { shallowRef } from 'vue'

const items: BreadcrumbItem[] = [
  { title: '首页', href: '#/' },
  { title: '设置' },
  { title: '个人资料' }
]

const last = shallowRef('')

function onClick(item: BreadcrumbItem, index: number) {
  last.value = `${index}:${item.title}`
}
</script>

<template>
  <u-breadcrumb :items="items" @click="onClick" />
</template>
```

自定义分隔符用 `#separator` 插槽。禁用某一级设 `disabled: true`，该项既不跳转也不触发 `click`。
