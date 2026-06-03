# UTabs 示例

## 基础 + 可关闭 + 保活

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页', closable: false },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem, index: number) {
  items.value.splice(index, 1)
  if (active.value === item.key) active.value = items.value[0]?.key ?? ''
}
</script>

<template>
  <u-tabs :items="items" v-model="active" closable keep-alive rounded @close="onClose">
    <template #home>首页内容</template>
    <template #user>用户管理内容</template>
    <template #order>订单中心内容</template>
  </u-tabs>
</template>
```

## 垂直标签页

```vue
<u-tabs :items="items" v-model="active" position="left" rounded>
  <template #general>通用设置</template>
  <template #security>安全设置</template>
</u-tabs>
```

## 独立水平栏（后台路由栏）

```vue
<u-tabs-horizontal :items="barItems" v-model="active" rounded closable block @close="onClose" />
```
