---
title: ExpandTransition 高度折叠展开动画过渡组件与钩子
description: 动画过渡工具函数，通过精准测量元素 scrollHeight 实现 0 到 auto 高度平滑展开与折叠收起动效，支持配合 Vue Transition 组件使用或原生 DOM 命令式调用，适用于手风琴折叠面板与下拉菜单展开动画
---

`ExpandTransition` 驱动元素高度（及可选 opacity）的展开/收起。可挂到 Vue `<transition>` 钩子，也可用 `expand` / `collapse` 命令式播放。相关类型：`ExpandTransitionOptions`。

## 构造选项 ExpandTransitionOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `transition` | `string` | 进出共用的 CSS `transition`；缺省 `'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'` |
| `enterTransition` | `string` | 进入过渡，优先于 `transition` |
| `leaveTransition` | `string` | 离开过渡，优先于 `transition` |
| `opacity` | `boolean` | 为 true 时同时动画 `opacity`（仅 Vue 钩子路径） |

## Vue Transition 钩子

对应 `<transition>` 的 `@enter` / `@after-enter` / `@before-leave` / `@leave` / `@after-leave`。进入时从 `height: 0` 过渡到 `scrollHeight`；离开时从当前高度收到 `0`。结束后清掉临时 inline 样式。

```vue
<script setup lang="ts">
import { ExpandTransition } from '@veltra/utils'
import { ref } from 'vue'

const open = ref(true)
const expandTransition = new ExpandTransition({
  transition: 'height 0.24s cubic-bezier(0.4, 0, 0.2, 1)'
})
</script>

<template>
  <transition
    @enter="(el: Element) => expandTransition.enter(el as HTMLElement)"
    @after-enter="(el: Element) => expandTransition.afterEnter(el as HTMLElement)"
    @before-leave="(el: Element) => expandTransition.beforeLeave(el as HTMLElement)"
    @leave="(el: Element) => expandTransition.leave(el as HTMLElement)"
    @after-leave="(el: Element) => expandTransition.afterLeave(el as HTMLElement)"
  >
    <div v-show="open">内容</div>
  </transition>
</template>
```

## 命令式 API

| 方法 | 说明 |
| --- | --- |
| `expand(el, onEnd?)` | 展开到内容高度；`onEnd` 在动画落定后调用（无需动画则同步调用） |
| `collapse(el, onEnd?)` | 收到高度 0；`onEnd` 语义同上 |
| `setExpanded(el, expanded)` | 取消进行中的动画并立刻落到展开（`height: auto`）或收起（`height: 0`） |
| `cancel(el)` | 取消该元素上未完成的动画；被新动画打断时旧的 `onEnd` 不会再调用 |

```ts
import { ExpandTransition } from '@veltra/utils'

const panel = document.querySelector<HTMLElement>('.panel')!
const t = new ExpandTransition({ transition: 'height 0.25s ease' })

t.setExpanded(panel, false)
t.expand(panel)
t.collapse(panel, () => {
  // 收起落定后再卸载内容
})
t.cancel(panel)
```
