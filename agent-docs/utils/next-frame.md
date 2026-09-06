---
title: nextFrame 双重 requestAnimationFrame 渲染帧延迟回调
description: DOM 动画与渲染调度工具函数，连续等待两次 requestAnimationFrame 后执行回调，确保浏览器完成样式计算、Reflow 重排与首帧绘制，常用于动画启动初值设定与平滑过渡
---

`nextFrame(cb)` 连续调度两次 `requestAnimationFrame` 再调用 `cb`。用于等当前帧绘制完成后再读布局或改 DOM（例如展开后滚动到目标）。

```ts
import { nextFrame } from '@veltra/utils'

nextFrame(() => {
  el.scrollIntoView()
})
```
