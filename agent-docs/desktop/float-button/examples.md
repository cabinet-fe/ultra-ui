---
title: UFloatButton 示例
description: 页面右下角悬浮操作，items 的 key 必填，点击回传该 key
---

`UFloatButton` 传送到 `body`，固定在视口右下。`items` 每项必须有唯一 `key`；无 `icon` 时用 `name` 或 `key` 的首字。`@click` 参数是被点项的 `key`。

```vue
<script setup lang="ts">
import type { FloatButtonItem } from '@veltra/desktop'
import { Edit, Plus } from '@veltra/icons/normal'

const items: FloatButtonItem[] = [
  { key: 'create', name: '新建', icon: Plus, type: 'primary' },
  { key: 'edit', name: '编辑', icon: Edit }
]

function onClick(key: string) {
  if (key === 'create') {
    // 打开新建流程
  }
}
</script>

<template>
  <u-float-button :items="items" @click="onClick" />
</template>
```
