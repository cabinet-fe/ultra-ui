---
title: UTabs / UTabsHorizontal / UTabsVertical 示例
description: 组合标签页用同名插槽渲染面板；独立水平/垂直栏只负责切换，不含内容区
---

`items` 每项必须有 `key`。`v-model` 绑定当前 `key`。`UTabs` 用与 `key` 同名的插槽渲染面板；`keep-alive` 切换时保留面板状态。`UTabsHorizontal` / `UTabsVertical` 只有标签栏，适合自己排内容区。`closable` 为组件级默认，单项可覆盖；禁用项不显示关闭按钮。关闭后要自己从 `items` 里删掉并改 `v-model`。

## UTabs

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items: TabItem[] = [
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户', disabled: true },
  { key: 'order', name: '订单' }
]
</script>

<template>
  <u-tabs v-model="active" :items="items" rounded>
    <template #home>首页内容</template>
    <template #order>订单内容</template>
  </u-tabs>
</template>
```

`position` 为 `top` / `bottom` / `left` / `right`。水平方向才支持 `block`（标签栏铺满宽度，项本身宽度不变）。

## UTabsHorizontal

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem) {
  const next = items.value.filter(tab => tab.key !== item.key)
  items.value = next
  if (active.value === item.key) active.value = next[0]?.key ?? ''
}
</script>

<template>
  <u-tabs-horizontal v-model="active" :items="items" closable rounded block @close="onClose" />
</template>
```

`position` 只能是 `top` 或 `bottom`。

## UTabsVertical

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('general')
const items: TabItem[] = [
  { key: 'general', name: '通用' },
  { key: 'security', name: '安全' }
]
</script>

<template>
  <u-tabs-vertical v-model="active" :items="items" rounded />
  <div>当前：{{ active }}</div>
</template>
```

`position` 只能是 `left` 或 `right`。
