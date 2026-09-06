---
title: "UContextmenu - 右键菜单"
description: "组件用法传入 mousePosition 与 menus；函数式 API 用 contextmenu.pop"
keywords:
  - UContextmenu
  - @veltra/desktop
  - contextmenu
  - Contextmenu
  - 右键菜单
aliases: ["contextmenu", "UContextmenu", "Contextmenu", "右键菜单"]
---
## 快速上手

```ts
import { UContextmenu } from '@veltra/desktop'
```

## 典型示例

`UContextmenu` 需要 `mousePosition: { x, y }` 和 `menus`。菜单项可含 `label`、`icon`、`children`、`callback`、`disabled`、`divider`、`render`、`keepOpen`。关闭时触发 `destroy`。函数式入口是 `contextmenu.pop`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { contextmenu, type ContextmenuItem } from '@veltra/desktop'

const visible = shallowRef(false)
const pos = shallowRef({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
  { label: '复制', callback: () => {} },
  { divider: true },
  { label: '删除', disabled: true }
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}

function onPop(e: MouseEvent) {
  e.preventDefault()
  contextmenu.pop({
    mousePosition: { x: e.clientX, y: e.clientY },
    menus: [
      { label: '打开', callback: () => {} },
      { label: '重命名', callback: () => {} }
    ]
  })
}
</script>

<template>
  <div @contextmenu="onContextMenu">组件用法：在此右键</div>
  <u-contextmenu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />

  <div @contextmenu="onPop">函数式：在此右键调用 contextmenu.pop</div>
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

import type { Component } from 'vue'

/**
 * 右键菜单项
 */
export interface ContextmenuItem {
  /** 菜单名称（divider 时可空） */
  label?: string
  /** 菜单描述 */
  description?: string
  /** 菜单图标 */
  icon?: Component
  /** 子菜单 */
  children?: ContextmenuItem[]
  /** 菜单点击时的回调 */
  callback?: () => any
  /** 是否禁用 */
  disabled?: boolean | (() => boolean)
  /** 渲染为分割线（忽略其余字段） */
  divider?: boolean
  /** 自定义内容组件（替代 label 文本渲染） */
  render?: Component
  /** 点击本项不触发关闭流程（供内嵌交互组件使用） */
  keepOpen?: boolean
}

/** 鼠标右键菜单组件属性 */
export interface ContextmenuProps extends ComponentProps {
  /** 鼠标位置 */
  mousePosition: { x: number; y: number }
  /**
   * 菜单宽度。传数字为固定 px；传 `'max-content'` 时由内容撑开（配合根样式 min-width: 120px）。
   * @default 150
   */
  width?: number | string
  /** 菜单项 */
  menus: ContextmenuItem[] | (() => ContextmenuItem[])
}

/** 鼠标右键菜单组件定义的事件 */
export interface ContextmenuEmits {
  (e: 'destroy'): void
}

/** 鼠标右键菜单组件暴露的属性和方法(组件内部使用) */
export interface _ContextmenuExposed {}

/** 鼠标右键菜单组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ContextmenuExposed = DeconstructValue<_ContextmenuExposed>
```

### 辅助工具

本组件通常配合以下工具来使用。

#### contextmenu

在鼠标位置弹出右键菜单（函数式 API）。

使用示例:

```ts
import { contextmenu } from '@veltra/desktop'
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
