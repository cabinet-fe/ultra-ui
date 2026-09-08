---
title: "UDropdown - 下拉菜单"
description: "用 trigger 与 content 插槽组成下拉，可通过 ref 调用 open / close"
keywords:
  - UDropdown
  - @veltra/desktop
  - dropdown
  - Dropdown
  - 下拉菜单
aliases: ["dropdown", "UDropdown", "Dropdown", "下拉菜单"]
---

## 快速上手

```ts
import { UDropdown } from '@veltra/desktop'
```

## 典型示例

`UDropdown` 默认 `trigger` 为 `'hover'`，也可设 `'click'` 或 `'custom'`。触发器用 `#trigger`，弹出内容用 `#content`。宽度默认跟随触发器，可用 `width` / `minWidth` 覆盖。

```vue
<template>
  <u-dropdown trigger="click" width="200px">
    <template #trigger>
      <u-button>操作</u-button>
    </template>
    <template #content>
      <ul>
        <li>编辑</li>
        <li>复制</li>
        <li>删除</li>
      </ul>
    </template>
  </u-dropdown>
</template>
```

`trigger="custom"` 时用暴露的 `open` / `close` 指定触发元素：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { DropdownExposed } from '@veltra/desktop'

const dropdownRef = shallowRef<DropdownExposed>()
const spanRef = shallowRef<HTMLSpanElement>()
</script>

<template>
  <u-button @click="dropdownRef?.open({ trigger: spanRef })">在目标处打开</u-button>
  <span ref="spanRef">锚点</span>
  <u-dropdown ref="dropdownRef" trigger="custom" width="160px">
    <template #content>
      <div>自定义触发的菜单</div>
    </template>
  </u-dropdown>
</template>
```

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { CSSProperties } from 'vue'

/** 下拉框组件属性 */
export interface DropdownProps {
  /**
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'custom'
  /**
   * 宽度
   * @default - 跟随触发宽度
   */
  width?: string
  /**
   * 最小宽度
   */
  minWidth?: string
  /**
   * 内容容器标签
   */
  contentTag?: string
  /** 内容容器类 */
  contentClass?: unknown
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 显示下拉框 */
  visible?: boolean
  /** 禁用 */
  disabled?: boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  /** 下拉框显示或隐藏事件 */
  (e: 'update:visible', visible: boolean): void
  /** 键盘事件 */
  (e: 'keydown', event: KeyboardEvent): void
}

/** 下拉框组件暴露的属性和方法(组件内部使用) */
export interface _DropdownExposed {
  /**
   * 打开下拉擦菜单
   * @param config 配置
   */
  open: (config?: {
    /** 自定义触发元素 */
    trigger?: HTMLElement
  }) => void
  /** 关闭 */
  close: () => void
  /** 更新下拉框位置 */
  updateDropdown: () => void
}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
