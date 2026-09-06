---
title: vRipple 水波纹
description: 在按下左键时于元素内展示水波纹；同包还导出 Ripple 类
---

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
