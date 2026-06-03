# UBreadcrumb 示例

## 基础用法

```vue
<template>
  <u-breadcrumb
    :items="[
      { title: '首页', href: '/home' },
      { title: '产品', href: '/products' },
      { title: '详情' }
    ]"
  />
</template>
```

## 禁用项与点击事件

```vue
<template>
  <u-breadcrumb
    :items="[
      { title: '首页', href: '/home' },
      { title: '分类', disabled: true },
      { title: '详情' }
    ]"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '@veltra/desktop'

const handleClick = (item: BreadcrumbItem, index: number, ev: Event) => {
  console.log('clicked:', item.title, index)
}
</script>
```

## 自定义分隔符与项渲染

```vue
<template>
  <u-breadcrumb :items="crumbs">
    <template #separator>→</template>
    <template #item="{ item, isLast }">
      <span :style="{ fontWeight: isLast ? 'bold' : 'normal' }">
        {{ item.title }}
      </span>
    </template>
  </u-breadcrumb>
</template>

<script setup lang="ts">
const crumbs = [{ title: '首页', href: '/' }, { title: '设置' }, { title: '安全' }]
</script>
```

## 末级作为链接

```vue
<template>
  <u-breadcrumb
    last-linked
    :items="[
      { title: '首页', href: '/' },
      { title: '列表', href: '/list' },
      { title: '详情', href: '/detail/42' }
    ]"
  />
</template>
```
