---
title: "UCollapse / UCollapseItem - 折叠面板"
description: "折叠面板用 v-model 控制展开项，手风琴模式一次只开一项"
keywords:
  - UCollapse
  - UCollapseItem
  - @veltra/desktop
  - collapse
  - Collapse
  - CollapseItem
  - 折叠面板
aliases:
  - collapse
  - UCollapse
  - UCollapseItem
  - Collapse
  - CollapseItem
  - 折叠面板
---
## 快速上手

```ts
import { UCollapse, UCollapseItem } from '@veltra/desktop'
```

## 典型示例

包在 `UCollapse` 里时，每项 `value` 必填，展开状态由父级 `v-model` 管理（数组可同时展开多项；`accordion` 时为单值）。不要给子项再写 `v-model`。独立使用 `UCollapseItem` 时才用布尔 `v-model`。

### UCollapse 同时展开多项

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from '@veltra/desktop'

const opened = ref<CollapseModelValue>(['basic'])
</script>

<template>
  <u-collapse v-model="opened">
    <u-collapse-item value="basic" title="基础信息">姓名、邮箱与部门。</u-collapse-item>
    <u-collapse-item value="secure" title="安全设置">密码与二次验证。</u-collapse-item>
    <u-collapse-item value="notify" title="通知" disabled>该项不可点。</u-collapse-item>
  </u-collapse>
</template>
```

`accordion` 时 `v-model` 用单个 `value`。标题区可用 `#header` 自定义，展开图标仍由组件渲染。

### UCollapseItem 独立使用

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <u-collapse-item v-model="open" title="独立面板">
    不包在 UCollapse 内时，用布尔 v-model 控制展开。
  </u-collapse-item>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

import type { Component } from 'vue'

/** Collapse 项的唯一标识 */
export type CollapseValue = string | number

/** Collapse modelValue：手风琴模式为单值，普通模式为数组（也兼容传入单值） */
export type CollapseModelValue = CollapseValue | CollapseValue[]

/** Collapse 组件属性 */
export interface CollapseProps extends ComponentProps {
  /** 当前展开项的 value（单个或多个） */
  modelValue?: CollapseModelValue

  /**
   * 是否手风琴模式（一次只能展开一项）
   * @default false
   */
  accordion?: boolean

  /**
   * 是否默认折叠全部项。设为 false 时默认全部展开。
   * @default false
   */
  defaultCollapseAll?: boolean

  /**
   * 自定义展开图标组件，活动态会自动旋转 180°。
   * 接受任意 Vue 组件（SFC、Functional Component 等）。
   */
  expandIcon?: Component
}

export interface CollapseEmits {
  (e: 'update:modelValue', value: CollapseModelValue): void
  /** 当前展开项变更时触发 */
  (e: 'change', value: CollapseModelValue): void
}

/** CollapseItem 组件属性 */
export interface CollapseItemProps {
  /**
   * 唯一标识；在 `UCollapse` 内使用时必填。
   * 独立使用时可选。
   */
  value?: CollapseValue

  /**
   * 独立使用时的展开状态（`v-model`）。
   * 在 `UCollapse` 内由父组件 `modelValue` 管理，此属性无效。
   * @default false
   */
  modelValue?: boolean

  /** 标题文本（也可通过 #header 插槽自定义标题区；展开图标始终保留，可用 expandIcon 替换） */
  title?: string

  /** 是否禁用 */
  disabled?: boolean

  /**
   * 独立使用时的自定义展开图标，活动态会自动旋转 180°。
   * 在 `UCollapse` 内由父组件 `expandIcon` 统一管理。
   */
  expandIcon?: Component

  /**
   * 折叠动画结束后卸载内容 DOM（展开时重新挂载），减少长列表的内存与渲染成本。
   * 注意：卸载会丢失内容区的本地组件状态。
   * @default false
   */
  destroyOnCollapse?: boolean
}

export interface CollapseItemEmits {
  (e: 'update:modelValue', value: boolean): void
  /** 展开状态变更时触发（仅独立使用） */
  (e: 'change', value: boolean): void
}
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。
