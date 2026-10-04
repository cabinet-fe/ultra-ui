---
title: 'UAnchor 锚点导航'
description: '锚点导航：UAnchor 容器 + UAnchorItem 锚点项，点击项平滑滚动到页内锚点、滚动容器时高亮当前命中项；支持指定滚动容器（选择器 / 元素 / window）与定位偏移，v-model:current 受控高亮。'
aliases: [Anchor, AnchorLink, 锚点, 锚点组件, 页内导航, 锚点定位]
keywords:
  [
    UAnchor,
    UAnchorItem,
    href,
    title,
    container,
    offset,
    current,
    change,
    click-item,
    锚点导航,
    锚点,
    页内导航,
    滚动定位,
    滚动高亮,
    侧边目录,
    目录导航,
    平滑滚动
  ]
---

# UAnchor 锚点导航

`@veltra/desktop` 导出 `UAnchor`（锚点导航容器）与 `UAnchorItem`（锚点项）。`UAnchorItem` 声明 `href`（`#id` 形式的页内锚点）与 `title` 文案，点击项平滑滚动到目标锚点；滚动容器时按锚点项顺序高亮当前命中的区块，`v-model:current` 可受控读取高亮项。

## 快速上手

```vue
<template>
  <div class="page">
    <div ref="scrollRef" class="page__content">
      <section id="overview">
        <h3>概述</h3>
        <p>长内容……</p>
      </section>
      <section id="usage">
        <h3>用法</h3>
        <p>长内容……</p>
      </section>
    </div>

    <u-anchor :container="scrollRef">
      <u-anchor-item href="#overview" title="概述" />
      <u-anchor-item href="#usage" title="用法" />
    </u-anchor>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
// 走 VeltraUIResolver 按需导入时无需显式 import 组件；
// 显式使用（h / TSX / 非 resolver 项目）则从 '@veltra/desktop' 导入 UAnchor / UAnchorItem，
// 并补样式入口 import '@veltra/desktop/components/anchor/style'

const scrollRef = useTemplateRef('scrollRef')
</script>

<style scoped>
.page {
  display: flex;
  gap: 24px;
}

.page__content {
  flex: 1;
  height: 300px;
  overflow-y: auto;
}
</style>
```

## API 签名

```ts
import type { AnchorProps, AnchorEmits, AnchorItemProps } from '@veltra/desktop'

/** 锚点导航容器属性 */
export interface AnchorProps {
  /**
   * 滚动容器
   * CSS 选择器或容器元素（含模板引用初始的 null）；缺省时监听 window 滚动
   */
  container?: string | HTMLElement | null
  /**
   * 定位偏移：点击定位与高亮判定统一使用
   * 滚动停止时锚点距容器视口顶部的距离
   * @default 0
   */
  offset?: number
}

/** 锚点导航事件 */
export interface AnchorEmits {
  /** 高亮锚点变化 */
  (e: 'change', current: string): void
  /** 锚点项点击（点击后平滑滚动到目标锚点） */
  (e: 'click-item', href: string, event: MouseEvent): void
}

/** 锚点导航项属性 */
export interface AnchorItemProps {
  /** 目标锚点，`#id` 形式的选择器，需与页内锚点元素对应 */
  href: string
  /** 导航文案 */
  title?: string
}
```

## 参数说明

UAnchor：

| 参数        | 类型                            | 默认        | 必填 | 约束                                                                 |
| ----------- | ------------------------------- | ----------- | :--: | -------------------------------------------------------------------- |
| `container` | `string \| HTMLElement \| null` | `undefined` |  否  | 字符串按 CSS 选择器在 `document` 内取首个匹配元素，取不到回落 window |
| `offset`    | `number`                        | `0`         |  否  | `>=0`；同时用于点击定位落点与滚动高亮判定边界                        |

UAnchorItem：

| 参数    | 类型     | 默认        | 必填 | 约束                                     |
| ------- | -------- | ----------- | :--: | ---------------------------------------- |
| `href`  | `string` | —           |  是  | `#id` 形式选择器；目标不存在时点击无效果 |
| `title` | `string` | `undefined` |  否  | 不传时需用默认插槽提供内容               |

UAnchorItem 未命名的默认插槽优先于 `title` 渲染。

## 方法与事件

| 名称              | 签名                                        | 触发条件                                             |
| ----------------- | ------------------------------------------- | ---------------------------------------------------- |
| `v-model:current` | `current: string \| undefined`              | 高亮锚点的受控绑定；点击或滚动命中变化时更新         |
| `change`          | `(current: string) => void`                 | 高亮锚点变化（同一次值不变不重复触发）               |
| `click-item`      | `(href: string, event: MouseEvent) => void` | 点击锚点项；回调前已阻止默认跳转并平滑滚动到目标锚点 |

高亮判定：按 `UAnchorItem` 出现顺序，取布局顶部越过 `offset` 边界的最后一项为命中项；容器滚动到底部时直接命中最后一项；位于首个锚点之前时命中第一项。

## 典型示例

### 受控高亮（v-model:current）

```vue
<template>
  <u-anchor :container="scrollEl" v-model:current="current">
    <u-anchor-item href="#overview" title="概述" />
    <u-anchor-item href="#usage" title="用法" />
  </u-anchor>
  <span>当前高亮：{{ current ?? '未命中' }}</span>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'

const current = shallowRef<string>()
const scrollEl = document.querySelector<HTMLElement>('.layout__main') // 已存在的滚动容器元素
</script>
```

### 定位偏移与事件

```vue
<template>
  <u-anchor container=".layout__main" :offset="20" @change="onChange" @click-item="onClickItem">
    <u-anchor-item v-for="s in sections" :key="s.id" :href="`#${s.id}`" :title="s.title" />
  </u-anchor>
</template>

<script setup lang="ts">
const sections = [
  { id: 'overview', title: '概述' },
  { id: 'usage', title: '用法' },
  { id: 'api', title: 'API' }
]

function onChange(current: string) {
  console.log('高亮变化：', current)
}

function onClickItem(href: string) {
  console.log('点击锚点：', href)
}
</script>
```

### 整页滚动（缺省 window 容器）

```vue
<template>
  <!-- 页面自身滚动，不传 container 即监听 window -->
  <u-anchor>
    <u-anchor-item href="#overview" title="概述" />
    <u-anchor-item href="#usage" title="用法" />
  </u-anchor>
</template>

<script setup lang="ts">
import { UAnchor, UAnchorItem } from '@veltra/desktop'
// 显式 import 时必须补样式入口，否则无样式
import '@veltra/desktop/components/anchor/style'
</script>
```

## 注意事项

> [!WARNING]
>
> - 本库是「点击滚动 + 滚动高亮」，点击锚点项**不改写 `location.hash`**（AntD Anchor 默认改写地址栏）；SPA 路由场景不会被锚点点击打断路由。
> - `offset` 兼作点击定位落点与滚动高亮判定边界（Element Plus 分 `offset` 与 `bound` 两个参数，本库合并为一个）。
> - `href` 必须是 `#id` 形式选择器且目标元素存在于 `document`；目标不存在时点击无效果、滚动高亮跳过该项。
> - `UAnchorItem` 必须放在 `UAnchor` 默认插槽内（通过依赖注入向容器注册）；独立使用不报错但不参与联动。
> - 走 resolver 的模板组件禁止再显式 import 组件本体；`h()` / TSX 显式使用时必须补 `import '@veltra/desktop/components/anchor/style'`。

## 常见问题

### 滚动时高亮不更新

原因：`container` 未指向实际发生滚动的元素（回落到了 window）。修复：把 `container` 指向真正 `overflow: auto` 的元素。

```vue
<template>
  <!-- 错误：外层壳不滚动；正确：传真正滚动的 .layout__main -->
  <u-anchor container=".layout__main">
    <u-anchor-item href="#overview" title="概述" />
  </u-anchor>
</template>
```
