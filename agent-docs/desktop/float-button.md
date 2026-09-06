---
title: "UFloatButton - 浮动按钮"
description: "页面右下角悬浮操作，items 的 key 必填，点击回传该 key"
keywords:
  - UFloatButton
  - @veltra/desktop
  - float-button
  - FloatButton
  - 浮动按钮
aliases: ["float-button", "UFloatButton", "FloatButton", "浮动按钮"]
---
## 快速上手

```ts
import { UFloatButton } from '@veltra/desktop'
```

## 典型示例

`UFloatButton` 传送到 `body`，固定在视口右下。`items` 每项必须有唯一 `key`；无 `icon` 时用 `name` 或 `key` 的首字。`@click` 参数是被点项的 `key`。

```vue
<script setup lang="ts">
import type { FloatButtonItem } from '@veltra/desktop'
import { Edit, Plus } from '@veltra/icons/normal'

const items: FloatButtonItem[] = [
  { key: 'create', name: '新建', icon: Plus, type: 'primary' },
  { key: 'edit', name: '编辑', icon: Edit }
]

function onClick(key: string) {
  if (key === 'create') {
    // 打开新建流程
  }
}
</script>

<template>
  <u-float-button :items="items" @click="onClick" />
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type ButtonType = ColorType

import type { Component } from 'vue'

export interface FloatButtonItem {
  /** 一个图标 */
  icon?: Component
  /** 名称 */
  name?: string
  /** 按钮颜色类别 */
  type?: ButtonType
  /** 标识，用来确定唯一性 */
  key: string
}

/** 悬浮按钮组件属性 */
export interface FloatButtonProps extends ComponentProps {
  /** 操作项 */
  items?: FloatButtonItem[]
}

/** 悬浮按钮组件定义的事件 */
export interface FloatButtonEmits {
  (e: 'click', key: string): void
}

/** 悬浮按钮组件暴露的属性和方法(组件内部使用) */
export interface _FloatButtonExposed {}

/** 悬浮按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
