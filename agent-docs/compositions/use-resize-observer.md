---
title: useResizeObserver 尺寸观察
description: 观察元素尺寸变化；同文件还导出按元素注册回调的 useObserverCallback
---

`useResizeObserver` 对单个或一组元素 ref 创建 `ResizeObserver`，ref 变化时自动改观察目标，卸载或调用 `disconnect` 时停止。同文件的 `useObserverCallback` 按元素注册回调，适合一个观察器服务多个节点。

```ts
import { shallowRef } from 'vue'
import { useObserverCallback, useResizeObserver } from '@veltra/compositions'

const box = shallowRef<HTMLElement>()

const { disconnect } = useResizeObserver({
  targets: box,
  onResize(entries) {
    const entry = entries[0]
    if (!entry) return
    console.log(entry.borderBoxSize[0]?.inlineSize)
  }
})

const { observeEl, unobserveEl } = useObserverCallback()

function bind(el: HTMLElement) {
  observeEl(el, (entry) => {
    console.log(entry.contentRect)
  })
}
```

`targets` 类型是导出的 `RefElement`（`Ref` 或 `ShallowRef`，值可以是 `HTMLElement | null | undefined`）。`useResizeObserver` 返回 `{ disconnect }`。

`useObserverCallback` 会跳过每个元素的第一次观察回调，避免挂载瞬间的噪声。组件卸载时自动 `unobserve` 并 `disconnect`。
