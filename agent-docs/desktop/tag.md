---
title: "UTag - 标签"
description: "用 UTag 展示分类标签，支持类型、尺寸、圆角与关闭"
---

# UTag - 标签

## 引入

```ts
import { UTag } from '@veltra/desktop'
```

## 示例

`UTag` 文案放默认插槽。`type` 取 `primary` / `info` / `success` / `warning` / `danger`。`closable` 时点关闭会发 `close`，需自己从列表里删掉该项。`size` 为 `small` / `default` / `large`。`round` 圆角，`dark` 深色底。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const tags = ref(['待办', '进行中', '已完成'])

function remove(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index)
}
</script>

<template>
  <u-tag type="primary">主要</u-tag>
  <u-tag type="success" round>成功</u-tag>
  <u-tag size="small" dark>深色</u-tag>
  <u-tag v-for="(name, index) in tags" :key="name" closable @close="remove(index)">
    {{ name }}
  </u-tag>
</template>
```

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 标签组件属性 */
export interface TagProps {
  type?: ColorType
  /** 是否可移除 */
  closable?: boolean
  /** 尺寸大小 */
  size?: ComponentSize
  /** 是否为圆角 */
  round?: boolean
  /** 深色 */
  dark?: boolean
}

export interface TagEmits {
  (e: 'close'): void
}
export interface TagExposed {}
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
