---
title: "UPaginator - 分页器"
description: "分页器用 v-model:page-number 与 v-model:page-size，total 决定页数"
keywords:
  - UPaginator
  - @veltra/desktop
  - paginator
  - Paginator
  - 分页器
aliases: ["paginator", "UPaginator", "Paginator", "分页器"]
---
## 快速上手

```ts
import { UPaginator } from '@veltra/desktop'
```

## 典型示例

`page-number` / `page-size` 用对应的 `v-model`。`total` 为数据总条数。`simple` 为简洁模式（不展示页码按钮）。`page-size-options` 控制每页条数下拉；不传则用组件默认档位。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const pageNumber = ref(1)
const pageSize = ref(20)

function loadPage() {
  // 按 pageNumber / pageSize 请求当前页
}
</script>

<template>
  <u-paginator
    v-model:page-number="pageNumber"
    v-model:page-size="pageSize"
    :total="120"
    :page-size-options="[10, 20, 50]"
    @change:page-number="loadPage"
    @change:page-size="loadPage"
  />
</template>
```

`v-model` 写回页码和每页条数。翻页或改每页条数时听 `@change:page-number` / `@change:page-size` 去拉当前页。

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { ShallowRef } from 'vue'

/** 分页器组件组件属性 */
export interface PaginatorProps {
  /** 当前处于第几页 */
  pageNumber?: number
  /** 每页显示的数量 */
  pageSize?: number
  /** 大小模式 */
  size?: 'large' | 'default' | 'small'
  /** 数据总数 */
  total?: number
  /** 每页显示数量选项 */
  pageSizeOptions?: Array<number>
  /** 简洁模式 */
  simple?: boolean
}

/** 分页器组件组件定义的事件 */
export interface PaginatorEmits {
  (e: 'update:pageNumber', value: number): void
  (e: 'change:pageNumber', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change:pageSize', value: number): void
}

/** 分页器组件组件暴露的属性和方法(组件内部使用) */
export interface _PaginatorExposed {
  el: ShallowRef<HTMLElement | undefined>
}

/** 分页器组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
