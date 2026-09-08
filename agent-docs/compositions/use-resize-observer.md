---
title: "useResizeObserver / useObserverCallback - 容器尺寸变化观察"
description: "Vue 组合式函数，用于监听 DOM 容器尺寸与布局变化，自动挂载与销毁 ResizeObserver 实例，useObserverCallback 支持单观察器监听多个节点并按元素分发回调，适用于复杂仪表盘、分栏拖拽与视口缩放适配"
keywords:
  - useResizeObserver
  - useObserverCallback
  - @veltra/compositions
  - use-resize-observer
  - 容器尺寸变化观察
aliases: ["use-resize-observer", "useResizeObserver", "useObserverCallback", "容器尺寸变化观察"]
---

## 快速上手

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
