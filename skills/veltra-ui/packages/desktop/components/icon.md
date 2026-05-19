# UIcon — 图标容器

> `import type { IconProps } from '@veltra/desktop'`

包裹 `@veltra/icons` 提供的 SVG 图标组件，控制其字体大小。渲染为 `<i class="u-icon">` 元素。

## Import

```ts
// UIcon 由 Vite 自动导入，无需手动 import
// 类型
import type { IconProps } from '@veltra/desktop'
```

## Props

| prop   | type                            | default | 说明                        |
| ------ | ------------------------------- | ------- | --------------------------- |
| `size` | `number` \| `` `${number}px` `` | —       | 图标尺寸，数字自动追加 `px` |

## Emits

无。

## Slots

| slot      | 作用域 | 说明                                           |
| --------- | ------ | ---------------------------------------------- |
| `default` | —      | 图标内容，放入 `@veltra/icons` 的 SVG 图标组件 |

## Exposed

```ts
interface IconExposed {}
```

## Examples

### 基础使用

```vue
<script setup>
import { Check, Loading } from '@veltra/icons/normal'
</script>

<template>
  <u-icon :size="16"><Check /></u-icon>
  <u-icon :size="20"><Loading /></u-icon>
  <u-icon :size="24"><Check /></u-icon>
</template>
```

### 数字自动追加 px

```vue
<script setup>
import { ArrowLeft } from '@veltra/icons/normal'
</script>

<template>
  <u-icon :size="16"><ArrowLeft /></u-icon>
  <!-- 等价于 size="16px" -->
</template>
```

### 在 Input suffix 中使用

```vue
<script setup>
import { Search } from '@veltra/icons/normal'
</script>

<template>
  <u-input v-model="keyword" placeholder="搜索...">
    <template #suffix>
      <u-icon :size="18"><Search /></u-icon>
    </template>
  </u-input>
</template>
```
