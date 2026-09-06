---
title: nextFrame
description: 在连续两次 requestAnimationFrame 之后执行回调
---

`nextFrame(cb)` 连续调度两次 `requestAnimationFrame` 再调用 `cb`。用于等当前帧绘制完成后再读布局或改 DOM（例如展开后滚动到目标）。

```ts
import { nextFrame } from '@veltra/utils'

nextFrame(() => {
  el.scrollIntoView()
})
```
