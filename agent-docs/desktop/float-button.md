---
title: UFloatButton 浮动按钮
description: 从 @veltra/desktop 导出的浮动按钮组：Teleport 到 body 并固定在视口右下角，items 配置按钮项，首项常显、其余悬停展开，点击回传 item.key，适合快捷操作入口。
aliases:
  - FloatButton
  - float-button
  - 悬浮按钮
  - 悬浮球
  - 快捷操作按钮
keywords:
  - items
  - FloatButtonItem
  - key
  - name
  - icon
  - type
  - ComponentSize
  - Teleport
  - 右下角
  - hover 展开
  - 快捷入口
  - 回到顶部
---

# UFloatButton 浮动按钮

`@veltra/desktop` 导出浮动按钮组件 `UFloatButton`：Teleport 到 `body` 后固定在视口右下角，`items` 数组配置按钮项，首项常显、其余悬停时依次展开；每个按钮点击时回传 `item.key`。

## 快速上手

```vue
<script setup lang="ts">
import { UFloatButton } from '@veltra/desktop'
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'create', name: '新建' },
  { key: 'edit', name: '编辑' }
]

function onClick(key: string) {
  console.log(key) // => 点击「编辑」时输出 'edit'
}
</script>

<template>
  <u-float-button :items="items" @click="onClick" />
</template>
```

## API 签名

```ts
import type { Component } from 'vue'

export type ComponentSize = 'small' | 'default' | 'large'

export type ButtonType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 浮动按钮项 */
export interface FloatButtonItem {
  /** 标识，必填且唯一：既是列表 key，也是 click 事件的回传值 */
  key: string
  /** 图标组件，从 @veltra/icons/normal 或 @veltra/icons/colorful 导入 */
  icon?: Component
  /** 名称：无 icon 时取其首字符显示；同时作为按钮的 title 提示 */
  name?: string
  /** 按钮颜色类别。默认 'primary' */
  type?: ButtonType
}

/** 悬浮按钮组件属性 */
export interface FloatButtonProps {
  /** 组件尺寸，透传给每个按钮 */
  size?: ComponentSize
  /** 操作项列表 */
  items?: FloatButtonItem[]
}

/** 悬浮按钮组件事件 */
export interface FloatButtonEmits {
  /** 点击任意按钮时触发，payload 为该项的 key */
  (e: 'click', key: string): void
}

/** 悬浮按钮组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _FloatButtonExposed {}
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `items` | `FloatButtonItem[]` | `[]`（不渲染按钮） | 否 | 每项 `key` 必填且必须唯一；数组第一项为常显主按钮 |
| `size` | `ComponentSize` | `'default'` | 否 | 枚举 `'small' \| 'default' \| 'large'`，透传给每个 `UButton` |

`FloatButtonItem` 字段：

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `key` | `string` | — | 是 | 唯一标识；既作 `v-for` key 又作 `click` 回传值 |
| `icon` | `Component` | — | 否 | 图标组件；已传时优先渲染图标，忽略 `name` 首字符 |
| `name` | `string` | — | 否 | 无 `icon` 时显示 `name` 首字符；`title` 提示取 `name ?? key` |
| `type` | `ButtonType` | `'primary'` | 否 | 枚举 `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger'` |

## 方法与事件

- `click(key)`：点击任一按钮触发，`key` 是被点项的 `key` 字符串。组件内部用 `UButton` 渲染，按钮自身的 `MouseEvent` 不对外抛出，只抛 `key`。

## 典型示例

### 图标按钮与不同颜色

```vue
<script setup lang="ts">
import { Plus, Edit, Delete } from '@veltra/icons/normal'
import { UFloatButton } from '@veltra/desktop'
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'create', name: '新建', icon: Plus },
  { key: 'edit', name: '编辑', icon: Edit, type: 'info' },
  { key: 'delete', name: '删除', icon: Delete, type: 'danger' }
]

function onClick(key: string) {
  if (key === 'delete') {
    // 删除逻辑
  }
}
</script>

<template>
  <u-float-button :items="items" @click="onClick" />
</template>
```

### 无图标时显示首字符

```vue
<script setup lang="ts">
import { UFloatButton } from '@veltra/desktop'
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [
  { key: 'workbench', name: '工作台' },
  { key: 'audit', name: '审批' }
]
</script>

<template>
  <!-- 无 icon：按钮内显示 name 首字符「工」「审」，title 为完整 name -->
  <u-float-button size="small" :items="items" />
</template>
```

### 结合路由跳转

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus, Search } from '@veltra/icons/normal'
import { UFloatButton } from '@veltra/desktop'

const router = useRouter()

const items = [
  { key: '/create', name: '新建', icon: Plus },
  { key: '/search', name: '搜索', icon: Search }
]

function onClick(key: string) {
  router.push(key)
}
</script>

<template>
  <u-float-button :items="items" @click="onClick" />
</template>
```

## 注意事项

> [!WARNING]
> - 位置固定在视口右下角（`right: 10px; bottom: 10px`），组件无任何定位 props；本库用 `items` 驱动按钮列表，不是 Ant Design FloatButton 的单按钮 + `tooltip` / `menu` 模式。
> - 数组顺序与视觉顺序相反：容器是纵向反排（`column-reverse`），`items[0]` 显示在最下方、最靠近右下角，且是唯一常显项。
> - 其余按钮仅在鼠标悬停整个组件时展开（缩放 + 淡入，逐项延迟 0.1s），鼠标移开后收起并隐藏；禁止依赖收起态下的非首项按钮可点击。
> - `key` 必填且唯一：重复 `key` 会破坏列表复用，并让 `click` 无法区分按钮。
> - 图标必须是组件（从 `@veltra/icons/normal` / `@veltra/icons/colorful` 导入后传给 `icon`），传字符串路径不会渲染。

## 常见问题

### 组件渲染了但右下角看不到按钮

原因：`items` 未传或为空数组。修复：传入至少一项。

```vue
<script setup lang="ts">
import { UFloatButton } from '@veltra/desktop'
import type { FloatButtonItem } from '@veltra/desktop'

const items: FloatButtonItem[] = [{ key: 'top', name: '顶部' }]
</script>

<template>
  <u-float-button :items="items" />
</template>
```

### 图标不显示、只有文字

原因：`icon` 传的是字符串而不是组件。修复：显式 import 图标组件。

```vue
<script setup lang="ts">
import { Bell } from '@veltra/icons/normal'
import { UFloatButton } from '@veltra/desktop'

const items = [{ key: 'notice', name: '通知', icon: Bell }]
</script>

<template>
  <u-float-button :items="items" />
</template>
```
