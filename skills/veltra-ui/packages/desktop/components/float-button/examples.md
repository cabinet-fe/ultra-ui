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
import { AddIcon, EditIcon, DeleteIcon } from '@veltra/icons'

const items = [
  { key: 'add', icon: AddIcon, name: '新增' },
  { key: 'edit', icon: EditIcon, name: '编辑', type: 'info' },
  { key: 'delete', icon: DeleteIcon, name: '删除', type: 'danger' }
]
</script>

<template>
  <u-float-button :items="items" @click="(key) => console.log(key)" />
</template>
```

## 纯图标（无 name）

```vue
<script setup lang="ts">
import { SettingIcon, NotificationIcon } from '@veltra/icons'

const items = [
  { key: 'settings', icon: SettingIcon },
  { key: 'notifications', icon: NotificationIcon }
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
import { CreateIcon, SearchIcon } from '@veltra/icons'

const router = useRouter()

const items = [
  { key: '/create', icon: CreateIcon, name: '新建' },
  { key: '/search', icon: SearchIcon, name: '搜索' }
]

const handleClick = (key: string) => {
  router.push(key)
}
</script>

<template>
  <u-float-button :items="items" @click="handleClick" />
</template>
```
