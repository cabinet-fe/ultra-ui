---
title: "useDrag - 页面元素拖拽与坐标偏移量监听"
description: "Vue 鼠标拖拽组合式函数，监听目标 DOM 元素左键拖动位移并返回带边界范围（range）钳制的 x/y 偏移量，适用于弹窗对话框拖动、分栏侧栏拖拽缩放宽度、浮动球移动与滑块拖动，拖拽中自动禁止文本选中"
keywords: ["useDrag", "@veltra/compositions", "use-drag", "页面元素拖拽与坐标偏移量监听"]
aliases: ["use-drag", "useDrag", "页面元素拖拽与坐标偏移量监听"]
---
## 快速上手

`useDrag` 给一个 DOM ref 绑定鼠标拖动。只响应左键（`button === 0`）。拖动期间会暂时禁止文本选中，卸载时移除监听。

```ts
import { shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const target = shallowRef<HTMLElement>()
const offsetX = shallowRef(0)

const { update } = useDrag({
  target,
  rangeX: [0, 200],
  initial: { offsetX: 0, offsetY: 0 },
  onDragStart(e) {
    update({ offsetX: e.offsetX })
  },
  onDrag({ offsetX: x }) {
    offsetX.value = x
  },
  onDragEnd({ offsetX: x }) {
    offsetX.value = x
  }
})
```

选项：

| 字段 | 说明 |
| --- | --- |
| `target` | 拖动手柄元素的 `Ref` / `ShallowRef` |
| `onDragStart` | 按下左键时，参数为 `MouseEvent` |
| `onDrag` / `onDragEnd` | 回调参数含本次位移 `x` / `y`，以及经 `rangeX` / `rangeY` 钳制后的 `offsetX` / `offsetY`，还有原始事件 `e` |
| `rangeX` / `rangeY` | `[min, max]`，不传则不钳制 |
| `initial` | 初始 `offsetX` / `offsetY`，默认 `0` |

返回的 `update({ offsetX?, offsetY? })` 只改内部偏移，不触发回调。适合在 `onDragStart` 里按点击落点对齐。

