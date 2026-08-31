# UFloatButton 示例

## 基础用法

```vue
<script setup lang="ts">
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'add', name: '新增' },
  { key: 'edit', name: '编辑' },
  { key: 'delete', name: '删除' }
]

const onAction = (key: string) => {
  console.log(key)
}
</script>

<template>
  <u-float-button :items="items" @click="onAction" />
</template>
```

## 带图标与不同颜色

```vue
<script setup lang="ts">
import { Plus, Edit, Delete } from '@veltra/icons'
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'add', icon: Plus, name: '新增' },
  { key: 'edit', icon: Edit, name: '编辑', type: 'info' },
  { key: 'delete', icon: Delete, name: '删除', type: 'danger' }
]

const onAction = (key: string) => {
  console.log(key)
}
</script>

<template>
  <u-float-button :items="items" @click="onAction" />
</template>
```

## 纯图标（无 name）

```vue
<script setup lang="ts">
import { Setting, Bell } from '@veltra/icons'

const items = [
  { key: 'settings', icon: Setting },
  { key: 'notifications', icon: Bell }
]
</script>

<template>
  <u-float-button size="small" :items="items" />
</template>
```

## 结合路由跳转

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus, Search } from '@veltra/icons'

const router = useRouter()

const items = [
  { key: '/create', icon: Plus, name: '新建' },
  { key: '/search', icon: Search, name: '搜索' }
]

const handleClick = (key: string) => {
  router.push(key)
}
</script>

<template>
  <u-float-button :items="items" @click="handleClick" />
</template>
```
