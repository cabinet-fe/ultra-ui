# UIcon — 图标容器

> `import type { IconProps } from '@veltra/desktop'`

包裹 @veltra/icons 提供的 SVG 图标组件，控制其字体大小。

## Import

```ts
import { UIcon } from '@veltra/desktop'
// 或按需
import { UIcon } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `size` | `number` \| `` `${number}px` `` | — | 图标尺寸，数字自动加 `px` |

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

### 带字符串单位

```vue
<script setup>
import { ArrowLeft } from '@veltra/icons/normal'
</script>

<template>
  <u-icon size="16px"><ArrowLeft /></u-icon>
  <u-icon size="1.5em"><ArrowLeft /></u-icon>
</template>
```

### 在按钮内使用

```vue
<script setup>
import { Edit } from '@veltra/icons/normal'
</script>

<template>
  <u-button type="primary" :icon="Edit" />
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
