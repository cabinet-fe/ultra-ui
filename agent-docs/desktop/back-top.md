---
title: UBackTop 回到顶部
description: 从 @veltra/desktop 导出的回到顶部按钮：监听页面或指定容器滚动，超出 visibility-height 阈值后固定在视口右下角出现，点击平滑滚回顶部。
aliases: [BackTop, back-top, 返回顶部, 回顶按钮, BackToTop, scroll-to-top]
keywords:
  [
    visibilityHeight,
    target,
    click,
    scroll,
    smooth,
    scrollTo,
    回到顶部,
    平滑滚动,
    滚动容器,
    滚动阈值,
    悬浮按钮,
    页面滚动
  ]
---

# UBackTop 回到顶部

`@veltra/desktop` 导出回到顶部组件 `UBackTop`：监听页面滚动（默认 `window`）或 `target` 指定的滚动容器，滚动距离超过 `visibility-height`（默认 400px）后按钮固定出现在视口右下角；点击后目标容器平滑滚回顶部并触发 `click` 事件。视觉形态与本库 `UFloatButton` 一致（圆形主色按钮 + 浮层阴影，Teleport 到 `body`）。

## 快速上手

```vue
<script setup lang="ts">
import { UBackTop } from '@veltra/desktop'
</script>

<template>
  <!-- 页面滚动超过 400px 后右下角出现按钮，点击平滑回到顶部 -->
  <u-back-top />
</template>
```

## API 签名

```ts
/** 回到顶部组件属性 */
export interface BackTopProps {
  /** 滚动超出该像素值后显示按钮，默认 400 */
  visibilityHeight?: number
  /** 监听滚动的目标容器：CSS 选择器或元素本身；默认 window 页面滚动 */
  target?: string | HTMLElement
}

/** 回到顶部组件事件 */
export interface BackTopEmits {
  /** 点击回到顶部按钮时触发，无 payload */
  (e: 'click'): void
}

/** 回到顶部组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _BackTopExposed {}
export type BackTopExposed = DeconstructValue<_BackTopExposed>
```

## 参数说明

| 参数               | 类型                    | 默认  | 必填 | 约束                                                            |
| ------------------ | ----------------------- | ----- | :--: | --------------------------------------------------------------- |
| `visibilityHeight` | `number`                | `400` |  否  | 非负像素值；滚动距离 `>=` 该值时按钮出现                        |
| `target`           | `string \| HTMLElement` | —     |  否  | 字符串按 `document.querySelector` 取首个匹配；未传监听 `window` |

## 方法与事件

- `click()`：点击按钮时同步触发，无 payload。触发时组件已调用 `scrollTo({ top: 0, behavior: 'smooth' })` 开始平滑滚动；组件无其它公开方法与暴露成员。

## 典型示例

### 指定容器回到顶部（选择器）

```vue
<script setup lang="ts">
import { UBackTop } from '@veltra/desktop'
</script>

<template>
  <div class="scroll-box">
    <p v-for="n in 50" :key="n">第 {{ n }} 行内容，向下滚动容器验证按钮出现。</p>
  </div>

  <!-- 容器滚动超过 100px 后按钮出现，点击只滚回该容器顶部 -->
  <u-back-top target=".scroll-box" :visibility-height="100" />
</template>

<style scoped>
.scroll-box {
  height: 300px;
  overflow-y: auto;
}
</style>
```

### 指定容器回到顶部（元素引用）

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { UBackTop } from '@veltra/desktop'

const box = useTemplateRef('box')

function handleClick() {
  console.log('已回到顶部') // => 点击按钮后输出
}
</script>

<template>
  <div ref="box" class="scroll-box">
    <p v-for="n in 50" :key="n">第 {{ n }} 行内容。</p>
  </div>

  <u-back-top :target="box" :visibility-height="100" @click="handleClick" />
</template>

<style scoped>
.scroll-box {
  height: 300px;
  overflow-y: auto;
}
</style>
```

### 监听 click 事件

```vue
<script setup lang="ts">
import { UBackTop } from '@veltra/desktop'

function onClick() {
  // 例如：埋点记录一次回顶行为
  console.log('back-top clicked')
}
</script>

<template>
  <u-back-top :visibility-height="200" @click="onClick" />
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库 `target` 接受 CSS 选择器字符串或 `HTMLElement`，不是 Ant Design BackTop 的 `() => HTMLElement` 函数。
> - 默认监听 `window`：若页面滚动实际发生在某个布局容器内（`overflow: auto` 的容器、本库 `u-scroll` 等），必须传 `target` 指向该容器，否则按钮永不出现。
> - 选择器在挂载时解析一次：匹配不到任何元素时回退监听 `window`；目标元素晚于组件挂载时改传元素引用。
> - 无 `right` / `bottom` / `duration` 位置与动画参数：按钮固定在视口右下角（`right: 10px; bottom: 10px`），回顶用浏览器原生 `behavior: 'smooth'` 平滑滚动，参照 `UFloatButton` 形态。
> - 组件 `Teleport` 到 `body` 渲染，不占据文档流位置。

## 常见问题

### 滚动了但按钮不出现

原因：滚动发生在容器内而未传 `target`（组件在监听 `window`），或滚动距离未达到 `visibilityHeight`。修复：把 `target` 指向真实滚动容器，必要时调小阈值。

```vue
<script setup lang="ts">
import { UBackTop } from '@veltra/desktop'
</script>

<template>
  <div class="page-scroll">
    <p v-for="n in 80" :key="n">第 {{ n }} 行内容。</p>
  </div>

  <u-back-top target=".page-scroll" :visibility-height="100" />
</template>

<style scoped>
.page-scroll {
  height: 100%;
  overflow-y: auto;
}
</style>
```

### 点击后页面没有回到顶部

原因：`target` 指向的元素不是实际滚动容器（例如选中了内容包裹层而不是 `overflow: auto` 的那一层）。修复：确认选中的元素自身产生滚动（`scrollHeight > clientHeight`）。
