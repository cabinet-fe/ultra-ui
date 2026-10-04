---
title: 'UEmpty 空状态（@veltra/mobile 移动端）'
description: '@veltra/mobile 导出的空状态组件：用内置图标与文案（默认「暂无数据」）为空列表、空搜索结果提供占位提示，仅 size 与 text 两个属性，无插槽与事件；图标经 1em 容器随 size 缩放。'
aliases: [UEmpty, Empty, 空状态, 暂无数据, 空列表占位, 移动端空态]
keywords:
  [
    EmptyProps,
    size,
    text,
    暂无数据,
    空列表占位,
    无数据提示,
    列表为空,
    搜索无结果,
    占位图标,
    图标尺寸,
    条件渲染,
    空态提示
  ]
---

# UEmpty 空状态（@veltra/mobile 移动端）

`@veltra/mobile` 导出组件 `UEmpty`：渲染内置 `Empty` 图标（`@veltra/icons/normal`）加一行辅助色文案，用于空列表、空搜索结果等无数据场景的占位提示。只有 `size` 与 `text` 两个属性，没有插槽、事件与暴露方法。

## 快速上手

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'
</script>

<template>
  <!-- 图标默认 48px，文案默认「暂无数据」 -->
  <div style="text-align: center">
    <UEmpty />
  </div>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、图标与文字无颜色。组件样式按需引入：`import '@veltra/mobile/components/empty/style'`。

## API 签名

```ts
/** 空状态组件属性 */
export interface EmptyProps {
  /** 图标大小，单位 px。默认 48 */
  size?: number
  /** 空文案。默认 '暂无数据' */
  text?: string
}

/** 空状态组件定义的事件（空） */
export interface EmptyEmits {}
```

组件内部把 `size` 换算成 `font-size`（`size + 'px'`）作用在 1em 图标容器上，图标 SVG 按 1em 缩放；文案用 assist 档字号，不随 `size` 变化。图标不可替换，文字只能整体替换、不支持插槽。

## 参数说明

| 参数   | 类型     | 默认         | 必填 | 约束                                            |
| ------ | -------- | ------------ | :--: | ----------------------------------------------- |
| `size` | `number` | `48`         |  否  | 单位 px，换算为图标容器的 `font-size`；文字不随 `size` 变化 |
| `text` | `string` | `'暂无数据'` |  否  | 纯文本，不支持 HTML 与插槽                      |

无事件、无暴露方法（`EmptyEmits` / `EmptyExposed` 均为空类型）。

## 典型示例

### 空列表条件渲染

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'

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

### 搜索无结果 + 自定义尺寸

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'
</script>

<template>
  <div style="text-align: center; padding: 48px 0">
    <UEmpty text="搜索无结果" :size="64" />
  </div>
</template>
```

### 空状态 + 引导按钮

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'
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
> - 移动端是 `inline-flex` 纵向容器：图标与文案在组件内部互相水平居中，但组件自身仍是行内级元素，整块在页面上水平居中必须在外层容器写 `text-align: center` 或 flex 布局。
> - 移动端图标容器是 1em（`size` 换算为 `font-size` 直接缩放 SVG），桌面端经 `UIcon` 组件包裹传 `size`；两端视觉效果一致，但移动端包内 `UEmpty` 不依赖 `UIcon`。
> - 图标是内置的 `Empty`，不可通过 props / 插槽替换；需要自定义图标时自行组合图标组件与文案，不要复用本组件。
> - `text` 只支持纯文本；需要富文本提示时在 `UEmpty` 外自行追加元素。
> - 移动端按需样式路径是 `@veltra/mobile/components/empty/style`，不是 `@veltra/desktop/components/empty/style`。
> - 需要主题 token：入口必须调用 `@veltra/styles/theme` 的 `loadTheme()`，否则图标与文字无颜色（辅助色 token）。

## 常见问题

### 图标和文字没有水平对齐到组件中心

原因：组件内部用 `inline-flex; align-items: center` 居中，正常情况必然对齐；看到错位时是外层样式覆盖了 `display` 或 `flex-direction`。修复：删除针对 `.um-empty` 的外部 `display` / `flex-direction` 覆盖，整块居中改在外层容器处理：

```vue
<script setup lang="ts">
import { UEmpty } from '@veltra/mobile'
import '@veltra/mobile/components/empty/style'
</script>

<template>
  <div style="text-align: center">
    <UEmpty text="暂无数据" />
  </div>
</template>
```

### 改了 size 文字大小没有变

行为如此：`size` 只作用于图标（1em 容器的 `font-size`），文案固定用 assist 档字号。需要更大文字时在组件外自行排版。
