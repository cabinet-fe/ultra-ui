---
title: "UDrawer - 抽屉"
description: "用 v-model 打开抽屉，direction 控制滑出方向"
keywords:
  - UDrawer
  - @veltra/desktop
  - drawer
  - Drawer
  - 抽屉
aliases: ["drawer", "UDrawer", "Drawer", "抽屉"]
---
## 快速上手

```ts
import { UDrawer } from '@veltra/desktop'
```

## 典型示例

`UDrawer` 用 `v-model` 控制显隐。`direction` 为 `'left' | 'right' | 'top' | 'bottom'`，默认从右侧滑出。关闭按钮由 `showClose` 控制。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const visible = shallowRef(false)
</script>

<template>
  <u-button type="primary" @click="visible = true">打开抽屉</u-button>

  <u-drawer v-model="visible" title="详情" direction="right" show-close @close="visible = false">
    <p>抽屉内容</p>
  </u-drawer>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

/** 抽屉方向 */
export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉模式 */
export type DrawerMode = 'edge' | 'inset'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉 */
  modelValue?: boolean
  /** 抽屉方向 */
  direction?: DrawerDirection

  /** 是否显示关闭按钮 */
  showClose?: boolean
  /** 抽屉标题 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 关闭时触发 */
  (e: 'close'): void
  /** 完全关闭后触发 */
  (e: 'closed'): void
}

/** 抽屉组件暴露的属性和方法(组件内部使用) */
export interface _DrawerExposed {}

/** 抽屉组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DrawerExposed = DeconstructValue<_DrawerExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
