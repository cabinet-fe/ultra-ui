# UIcon 示例

## 基础使用

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

## 数字自动追加 px

```vue
<script setup>
import { ArrowLeft } from '@veltra/icons/normal'
</script>

<template>
  <u-icon :size="16"><ArrowLeft /></u-icon>
  <!-- 等价于 size="16px" -->
</template>
```

## 在 Input suffix 中使用

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
