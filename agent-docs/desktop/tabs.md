---
title: "UTabs / UTabsHorizontal / UTabsVertical - 标签页"
description: "组合标签页用同名插槽渲染面板；独立水平/垂直栏只负责切换，不含内容区"
---

# UTabs / UTabsHorizontal / UTabsVertical - 标签页

## 引入

```ts
import { UTabs, UTabsHorizontal, UTabsVertical } from '@veltra/desktop'
```

## 示例

`items` 每项必须有 `key`。`v-model` 绑定当前 `key`。`UTabs` 用与 `key` 同名的插槽渲染面板；`keep-alive` 切换时保留面板状态。`UTabsHorizontal` / `UTabsVertical` 只有标签栏，适合自己排内容区。`closable` 为组件级默认，单项可覆盖；禁用项不显示关闭按钮。关闭后要自己从 `items` 里删掉并改 `v-model`。

### UTabs

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items: TabItem[] = [
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户', disabled: true },
  { key: 'order', name: '订单' }
]
</script>

<template>
  <u-tabs v-model="active" :items="items" rounded>
    <template #home>首页内容</template>
    <template #order>订单内容</template>
  </u-tabs>
</template>
```

`position` 为 `top` / `bottom` / `left` / `right`。水平方向才支持 `block`（标签栏铺满宽度，项本身宽度不变）。

### UTabsHorizontal

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('home')
const items = ref<TabItem[]>([
  { key: 'home', name: '首页' },
  { key: 'user', name: '用户管理' },
  { key: 'order', name: '订单中心' }
])

function onClose(item: TabItem) {
  const next = items.value.filter(tab => tab.key !== item.key)
  items.value = next
  if (active.value === item.key) active.value = next[0]?.key ?? ''
}
</script>

<template>
  <u-tabs-horizontal v-model="active" :items="items" closable rounded block @close="onClose" />
</template>
```

`position` 只能是 `top` 或 `bottom`。

### UTabsVertical

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { TabItem } from '@veltra/desktop'

const active = ref('general')
const items: TabItem[] = [
  { key: 'general', name: '通用' },
  { key: 'security', name: '安全' }
]
</script>

<template>
  <u-tabs-vertical v-model="active" :items="items" rounded />
  <div>当前：{{ active }}</div>
</template>
```

`position` 只能是 `left` 或 `right`。

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type TabItem = {
  /**
   * 标题名称
   * @description 如果不穿则以key为名称
   */
  name?: string
  /**
   * 标签页唯一标识
   */
  key: string
  /** 是否禁用 */
  disabled?: boolean
  /**
   * 单个标签是否可关闭
   * @description 未显式设置时，沿用组件级 `closable` 属性
   */
  closable?: boolean
}

/** 水平标签栏（top/bottom）属性 */
export interface TabsHorizontalProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否填充父容器宽度
   * @description 开启时 header 容器占满父容器宽度，背景完整铺开；tab-item 自身宽度保持不变
   * @default false
   */
  block?: boolean
  /**
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /**
   * 位置
   * @default 'top'
   */
  position?: 'top' | 'bottom'
}

/** 垂直标签栏（left/right）属性 */
export interface TabsVerticalProps {
  /** 组件尺寸 */
  size?: ComponentSize
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /**
   * 位置
   * @default 'left'
   */
  position?: 'left' | 'right'
}

/** 水平标签栏事件 */
export interface TabsHorizontalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 垂直标签栏事件 */
export interface TabsVerticalEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 标签页组件组件属性 */
export interface TabsProps extends ComponentProps {
  /** 当前激活的标签 key */
  modelValue?: string
  /** 标签项 */
  items: TabItem[]
  /**
   * 是否可关闭
   * @description 作为所有 TabItem 未显式 `closable` 时的默认值；禁用项不显示关闭按钮
   * @default false
   */
  closable?: boolean
  /**
   * 是否填充父容器宽度（仅在 position=top/bottom 时生效）
   * @description 开启时 header 容器占满父容器宽度，背景完整铺开；tab-item 自身宽度保持不变
   * @default false
   */
  block?: boolean
  /**
   * 是否开启圆角胶囊风格
   * @default false
   */
  rounded?: boolean
  /** 显示位置 */
  position?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * 是否保活
   * @default false
   */
  keepAlive?: boolean
}

/** 标签页组件组件定义的事件 */
export interface TabsEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'click', item: TabItem, index: number): void
  (e: 'close', item: TabItem, index: number): void
}

/** 标签页组件暴露的属性和方法(组件内部使用) */
export interface _TabsExposed {}

/** 标签页组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface TabsExposed {}

/** 水平标签栏暴露的属性和方法(组件内部使用) */
export interface _TabsHorizontalExposed {}

/** 水平标签栏暴露的属性和方法(组件外部使用) */
export interface TabsHorizontalExposed {}

/** 垂直标签栏暴露的属性和方法(组件内部使用) */
export interface _TabsVerticalExposed {}

/** 垂直标签栏暴露的属性和方法(组件外部使用) */
export interface TabsVerticalExposed {}
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
