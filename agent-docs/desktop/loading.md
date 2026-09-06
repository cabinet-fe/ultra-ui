---
title: "ULoading - 加载"
description: "ULoading 渲染动画；vLoading 指令在目标元素上盖遮罩"
keywords:
  - ULoading
  - @veltra/desktop
  - loading
  - Loading
  - 加载
aliases: ["loading", "ULoading", "Loading", "加载"]
---
## 快速上手

```ts
import { ULoading } from '@veltra/desktop'
```

## 典型示例

`ULoading` 的 `type` 为 `'dual-ring' | 'dot' | 'ring' | 'bars'`。遮罩场景用指令 `vLoading`（模板里 `v-loading`），值为真时渲染；指令参数即动画类型。

```vue
<template>
  <u-loading type="dual-ring" />
  <u-loading type="dot" />
  <u-loading type="ring" />
  <u-loading type="bars" />
</template>
```

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { vLoading } from '@veltra/desktop'

const loading = shallowRef(true)
</script>

<template>
  <div v-loading:dual-ring="loading" style="height: 120px; position: relative">内容区</div>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type LoadingType = 'dual-ring' | 'dot' | 'ring' | 'bars'

/** loading组件属性 */
export interface LoadingProps {
  /** 加载类型 */
  type: LoadingType
}

/** loading组件定义的事件 */
export interface LoadingEmits {
  (e: 'update:modelValue', value: string): void
}

/** loading组件暴露的属性和方法(组件内部使用) */
export interface _LoadingExposed {}

/** loading组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LoadingExposed = DeconstructValue<_LoadingExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### vLoading

在目标元素上显示加载遮罩指令。

使用示例:

```ts
import { vLoading } from '@veltra/desktop'
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
