---
title: "UAction / UActionGroup - 操作按钮"
description: "用操作组收纳表格行内按钮，超出 max 的项进入下拉，危险操作走确认"
keywords:
  - UAction
  - UActionGroup
  - @veltra/desktop
  - action
  - Action
  - ActionGroup
  - 操作按钮
aliases:
  - action
  - UAction
  - UActionGroup
  - Action
  - ActionGroup
  - 操作按钮
---

## 快速上手

```ts
import { UAction, UActionGroup } from '@veltra/desktop'
```

## 典型示例

`UAction` 继承按钮外观，真正的点击走 `@run`（`need-confirm` 时在弹窗确认后才触发）。放进 `UActionGroup` 后，组上的 `size` / `text` / `type` / `circle` / `loading` 作为子项默认值，单个 `UAction` 可覆盖。超出 `max`（默认 3）的项收进下拉；`in-dropdown` 为 true 时该项始终进下拉。

### UActionGroup 收纳行内操作

```vue
<script setup lang="ts">
function onView() {}
function onEdit() {}
function onDelete() {}
</script>

<template>
  <u-action-group :max="3">
    <u-action @run="onView">查看</u-action>
    <u-action @run="onEdit">编辑</u-action>
    <u-action need-confirm type="danger" @run="onDelete">删除</u-action>
  </u-action-group>
</template>
```

组默认 `text` 为 true、`type` 为 `primary`、`size` 为 `small`。需要实心按钮时在组上写 `:text="false"`。

### UAction 单独使用

不进组时仍可用 `need-confirm` 与 `@run`：

```vue
<script setup lang="ts">
function onArchive() {}
</script>

<template>
  <u-action need-confirm type="warning" @run="onArchive">归档</u-action>
</template>
```

## API 签名 / 类型定义

```ts
export type ColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface ButtonProps extends ComponentProps {
  /** 按钮类型 */
  type?: ButtonType
  /** 是否以文本形式展示 */
  text?: boolean
  /** 朴素模式 */
  plain?: boolean
  /** 加载中 */
  loading?: boolean
  /** 加载图标 */
  loadingIcon?: Component
  /** 圆形 */
  circle?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 图标 */
  icon?: Component
  /** 图标大小, 单位px */
  iconSize?: number
  /** 图标位置 */
  iconPosition?: 'left' | 'right'
  /** 事件是否传播（冒泡或者捕获） */
  propagate?: boolean
}

/** 操作组件属性 */
export interface ActionProps extends ButtonProps {
  /** 是否需要确认 */
  needConfirm?: boolean

  /**
   * 是否始终位于下拉菜单中，无视 `max` 限制
   * @default false
   */
  inDropdown?: boolean
}

/** 操作组组件属性 */
export interface ActionGroupProps {
  /** 是否加载中 */
  loading?: boolean
  /**
   * 是否为圆形按钮，适用于图标类。`hover` 模式下默认对所有子项生效
   * @default false
   */
  circle?: boolean

  /**
   * 最大可显示按钮数量，超出部分自动收纳到下拉菜单
   * @default 3
   */
  max?: number

  /**
   * 子项默认尺寸
   * @default 'small'
   */
  size?: 'small' | 'default' | 'large'

  /**
   * 子项默认是否使用文本样式
   * @default true
   */
  text?: boolean

  /**
   * 子项默认按钮类型
   * @default 'primary'
   */
  type?: ColorType
}

/** 操作组件定义的事件 */
export interface ActionEmits {
  (e: 'run'): void
}

/** 操作组件暴露的属性和方法(组件内部使用) */
export interface _ActionExposed {}

export interface _ActionGroupExposed {
  closeTip: () => void
}

/** 操作组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ActionExposed = DeconstructValue<_ActionExposed>

export type ActionGroupExposed = DeconstructValue<_ActionGroupExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
