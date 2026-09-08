---
title: "vRipple - 交互水波纹扩散动效指令与 Ripple 辅助类"
description: "Vue 鼠标点击交互水波纹（Ripple）涟漪扩散动效指令与 Ripple 辅助类，常用于按钮、卡片、列表项、标签等可点击控件增强视觉反馈；支持修饰符/参数 :duration（如 v-ripple:300）指定动画毫秒数、传 false 动态禁用、传字符串绑定自定义波纹样式类"
keywords:
  - vRipple
  - @veltra/directives
  - v-ripple
  - Ripple
  - 水波纹
  - Ripple
  - 辅助类
aliases: ["v-ripple", "vRipple"]
---

## 快速上手

`vRipple` 在目标元素上监听左键 `mousedown`，显示水波纹，并在 `mouseup` / `mouseleave` 时移除。绑定值为 `false` 时不启用。值为字符串时作为额外的 ripple class；指令参数作为动画时长（毫秒）。使用前需要引入样式。

```vue
<script setup lang="ts">
import { vRipple } from '@veltra/directives'
import '@veltra/directives/ripple/style'
</script>

<template>
  <button v-ripple>默认</button>
  <button v-ripple="false">关闭</button>
  <button v-ripple="'my-ripple'">自定义 class</button>
  <button v-ripple:300>时长 300ms</button>
</template>
```

`app.use(UltraUI)` 会注册为 `v-ripple`。`@veltra/desktop` 的按钮等组件已通过自身 `style` 引入 ripple 样式，只在裸用指令时才需要单独 `import '@veltra/directives/ripple/style'`。

同模块还导出 `Ripple` 类，适合不用指令、直接按事件驱动的场景：

```ts
import { Ripple } from '@veltra/directives'
import '@veltra/directives/ripple/style'

const ripple = new Ripple(el, { rippleClass: 'my-ripple', duration: 300 })
el.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return
  ripple.showByEvent(e)
})
el.addEventListener('mouseup', () => ripple.remove())
```

`Ripple` 公开方法：`show({ x, y })`、`showByEvent(event)`、`remove()`、`getContainer()`、`resetContainerRect()`。
