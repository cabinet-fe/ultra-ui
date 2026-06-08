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

## 独立水平/垂直标签页组件

我们可以独立使用 `u-tabs-horizontal` 和 `u-tabs-vertical` 组件来实现轻量级的标签页功能：它们们不包含标签页内容，仅负责标签的展示和切换，适合需要自定义内容区域的场景。

```vue
<u-tabs-horizontal :items="barItems" v-model="active" rounded closable block @close="onClose" />
<u-tabs-vertical :items="barItems" v-model="active" rounded closable block @close="onClose" />
```

## 自定义标签内容（默认插槽）

`u-tabs-horizontal` / `u-tabs-vertical` 可以使用默认插槽统一渲染每个标签内容，作用域为 `{ item, index }`。

```vue
<u-tabs-horizontal :items="barItems" v-model="active">
  <template #default="{ item, index }">
    <u-icon><Star /></u-icon>
    <span>{{ index + 1 }}. {{ item.name ?? item.key }}</span>
  </template>
</u-tabs-horizontal>
```
