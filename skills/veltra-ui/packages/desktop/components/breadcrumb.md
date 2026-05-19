# UBreadcrumb — 面包屑

> `import type { BreadcrumbProps, BreadcrumbEmits, BreadcrumbExposed } from '@veltra/desktop'`

## Import

```ts
// UBreadcrumb 由 Vite 自动导入，无需手动 import
```

## Props

| prop         | type               | default     | 说明                                                               |
| ------------ | ------------------ | ----------- | ------------------------------------------------------------------ |
| `items`      | `BreadcrumbItem[]` | —           | 路径项，顺序为从一级到末级                                         |
| `size`       | `ComponentSize`    | `'default'` | 尺寸                                                               |
| `lastLinked` | `boolean`          | `false`     | 末级是否作为链接渲染。默认末级为当前页，使用 `aria-current="page"` |

### BreadcrumbItem

| prop       | type                   | 说明                                    |
| ---------- | ---------------------- | --------------------------------------- |
| `title`    | `string`               | 展示文案                                |
| `href`     | `string \| undefined`  | 存在时渲染为 `<a>`，由浏览器处理导航    |
| `disabled` | `boolean \| undefined` | 为 `true` 时不跳转、不触发 `click` 事件 |

## Emits

| event   | 参数                                               | 说明                                                                               |
| ------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `click` | `(item: BreadcrumbItem, index: number, ev: Event)` | 可交互项（无 `href` 的链接项）被点击或按键时触发；有 `href` 时不触发（走原生导航） |

## Slots

| slot        | 作用域                                                     | 说明                                                   |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `item`      | `{ item: BreadcrumbItem, index: number, isLast: boolean }` | 自定义单项渲染，默认根据 `href` 渲染 `<a>` 或 `<span>` |
| `separator` | —                                                          | 自定义分隔符，默认为 `/`                               |

## Exposed

```ts
interface BreadcrumbExposed {}
```

无暴露属性。

## Examples

### 基础用法

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

### 禁用项与点击事件

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

### 自定义分隔符与项渲染

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

### 末级作为链接

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
