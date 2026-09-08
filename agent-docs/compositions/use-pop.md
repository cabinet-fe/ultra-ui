---
title: "usePop - 浮层弹出定位与 Popper 容器挂载"
description: "基于 Floating UI 的弹出层定位组合式函数，精确计算触发按钮与浮动内容坐标，支持 12 种 placement 方位、flip 翻转、shift 边界防溢出与箭头定位，自动挂载 pop-container 容器，适用于 Tooltip、Dropdown、Popover 与级联弹层"
keywords:
  - usePop
  - @veltra/compositions
  - use-pop
  - 浮层定位
  - Popper
aliases: ["use-pop", "usePop"]
---

## 快速上手

`usePop` 基于 `@floating-ui/dom` 计算浮层坐标，内置 `offset`、`flip`、`shift`，有箭头时再加 `arrow`。模块会在 `document.body` 上创建单例容器，id 恒为 `pop-container`，通过返回的 `popperContainerId` 做 `Teleport`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { usePop } from '@veltra/compositions'

const triggerRef = shallowRef<HTMLElement>()
const contentRef = shallowRef<HTMLElement>()
const arrowRef = shallowRef<HTMLElement>()

const { update, popperContainerId } = usePop({
  triggerRef,
  contentRef,
  arrowRef,
  direction: 'bottom',
  alignment: 'start',
  arrowSize: 10,
  onTriggerPositionChange() {
    void update()
  }
})
</script>

<template>
  <button ref="triggerRef">打开</button>
  <Teleport :to="`#${popperContainerId}`">
    <div ref="contentRef" style="position: absolute">
      内容
      <span ref="arrowRef" />
    </div>
  </Teleport>
</template>
```

## 注意事项

`direction` 为 `'top' | 'bottom' | 'left' | 'right'`，`alignment` 为 `'center' | 'start' | 'end'`，都可以传静态值或 ref。内容元素出现时会自动 `update`；传入 `onTriggerPositionChange` 后才会监听触发器祖先滚动和 `window.resize`。`onBeforeUpdate` / `onAfterUpdate` / `onPop` 分别在计算前后与首次弹出时调用。
