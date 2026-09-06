---
title: zIndex
description: 从 1000 起每次调用返回下一个递增的弹层 z-index
---

`zIndex` 是 `() => number`。首次调用返回 `1000`，之后每次加一，保证新打开的弹层叠在更上层。模块级单例，全应用共享同一计数。

```ts
import { setStyles, zIndex } from '@veltra/utils'

setStyles(overlay, {
  position: 'fixed',
  zIndex: zIndex()
})
```
