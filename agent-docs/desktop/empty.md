---
title: UEmpty 空状态
description: 从 @veltra/desktop 导入 UEmpty 空状态组件，用内置图标与文案（默认「暂无数据」）为空列表、空搜索结果提供占位提示，仅 size、text、block 三个属性，block 模式撑满父容器并水平垂直居中，无插槽与事件。
aliases: [UEmpty, Empty, 空状态, 暂无数据, Empty 占位]
keywords:
  [EmptyProps, 暂无数据, 空列表占位, 无数据提示, 列表为空, 搜索无结果, 占位图标, 图标尺寸, 条件渲染, 块级居中]
---

# UEmpty 空状态

`@veltra/desktop` 导出组件 `UEmpty`：渲染内置 `Empty` 图标（`@veltra/icons/normal`）加一行辅助色文案，用于空列表、空搜索结果等无数据场景的占位提示。只有 `size`、`text`、`block` 三个属性，没有插槽、事件与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/desktop'
</script>

<template>
  <!-- 图标默认 48px，文案默认「暂无数据」 -->
  <div style="text-align: center">
    <UEmpty />
  </div>
</template>
```

`UEmpty` 默认是 `inline-block` 元素且不会自动水平居中：必须在外层容器用 `text-align: center` 或 flex 布局居中。需要组件自己撑满父容器并水平垂直居中时，加 `block` 属性。

## API 签名

```ts
/** 空状态组件属性 */
export interface EmptyProps {
  /** 图标大小，单位 px。默认 48 */
  size?: number
  /** 空文案。默认 '暂无数据' */
  text?: string
  /** 块级模式：撑满父容器并将内容水平垂直居中。默认 false */
  block?: boolean
}
```

组件内部等价于 `<UIcon :size="size"><Empty /></UIcon>` 加一行文字；图标不可替换，文字只能整体替换、不支持插槽。

## 参数说明

| 参数    | 类型      | 默认         | 必填 | 约束                                                                     |
| ------- | --------- | ------------ | :--: | ------------------------------------------------------------------------ |
| `size`  | `number`  | `48`         |  否  | 单位 px，只作用于图标；文字大小不随 `size` 变化                          |
| `text`  | `string`  | `'暂无数据'` |  否  | 纯文本，不支持 HTML 与插槽                                               |
| `block` | `boolean` | `false`      |  否  | `true` 时根元素输出 `u-empty is-block`：`flex` 纵向布局、宽高 `100%` 居中 |

无事件、无暴露方法（`EmptyEmits` / `EmptyExposed` 均为空类型）。

## 典型示例

### 空列表条件渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UEmpty } from '@veltra/desktop'

const list = ref<string[]>([])
</script>

<template>
  <div v-if="list.length">
    <p v-for="item in list" :key="item">{{ item }}</p>
  </div>
  <!-- 列表为空时显示占位 -->
  <div v-else style="text-align: center">
    <UEmpty text="暂无列表数据" />
  </div>
</template>
```

### 块级模式：撑满容器居中（父容器为 flex 或固定高度时）

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/desktop'
</script>

<template>
  <!-- 不需要外层 text-align / flex 居中，组件自己撑满并居中 -->
  <div style="display: flex; height: 200px; border: 1px dashed var(--u-border-color)">
    <UEmpty block text="搜索无结果" :size="64" />
  </div>
</template>
```

### 空状态 + 引导按钮

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/desktop'
</script>

<template>
  <div style="text-align: center">
    <UEmpty text="还没有订单" />
    <button style="margin-top: 12px">去下单</button>
  </div>
</template>
```

## 注意事项

> [!WARNING]
>
> - 默认（不传 `block`）是 `inline-block` 元素，禁止直接期待它水平居中；必须在外层容器写 `text-align: center` 或 flex 布局。`block` 模式下组件输出 `display: flex; width: 100%; height: 100%`，父容器没有固定高度时高度等于内容高度。
> - 图标是内置的 `Empty`，不可通过 props / 插槽替换；需要自定义图标时自行组合 `UIcon` 与文案，不要复用本组件。
> - `text` 只支持纯文本；需要富文本提示时在 `UEmpty` 外自行追加元素。
> - 需要主题 token：入口必须调用 `@veltra/styles/theme` 的 `loadTheme()`，否则图标与文字无颜色（辅助色 token）。
