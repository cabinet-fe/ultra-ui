---
title: useDrag 元素拖拽组合式函数
description: 鼠标拖拽组合式函数：给目标 DOM 元素绑定 mousedown 起的 document 级拖动监听，回调给出本次位移 x/y 与经范围钳制的累计偏移 offsetX/offsetY，拖动期间自动禁止文本选中，支持边界范围与初始偏移，适用于弹窗拖动、滑块、分栏缩放、滚动条。
aliases: [use-drag, 拖拽, 元素拖动, 鼠标拖动, drag hook]
keywords: [target, onDragStart, onDrag, onDragEnd, rangeX, rangeY, offsetX, offsetY, DragParams, initial, mousedown, mousemove, mouseup, 拖动, 拖动位移, 弹窗拖动, 滑块拖动, 分栏拖拽缩放, 边界钳制, 禁止选中]
---

# useDrag 元素拖拽组合式函数

`@veltra/compositions` 导出 `useDrag`：鼠标拖拽组合式函数。它在目标元素的 `mousedown`（仅左键）上启动 `document` 级 `mousemove` / `mouseup` 监听，回调参数包含本次拖动位移 `x` / `y` 与累计偏移 `offsetX` / `offsetY`（可被 `rangeX` / `rangeY` 钳制）；拖动期间自动禁止文本选中，组件卸载时自动移除全部监听。

## 快速上手

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const boxRef = shallowRef<HTMLElement>()
const pos = shallowRef({ x: 0, y: 0 })

useDrag({
  target: boxRef,
  onDragStart() {
    console.log('拖动开始')
  },
  onDrag({ x, y }) {
    // x / y 是本次拖动相对 mousedown 点的位移
    pos.value = { x, y }
  },
  onDragEnd({ offsetX, offsetY }) {
    // offsetX / offsetY 是含历次拖动的累计偏移
    console.log(offsetX, offsetY) // => 累计偏移
  }
})
</script>

<template>
  <div
    ref="boxRef"
    style="width: 100px; height: 100px; user-select: none; cursor: move"
  >
    拖我
  </div>
</template>
```

## API 签名

```ts
interface DragParams {
  /** 本次拖动水平位移（相对 mousedown 点） */
  x: number
  /** 本次拖动垂直位移（相对 mousedown 点） */
  y: number
  /** 拖拽目标累计水平偏移（含 initial，经 rangeX 钳制） */
  offsetX: number
  /** 拖拽目标累计垂直偏移（含 initial，经 rangeY 钳制） */
  offsetY: number
  /** 原始鼠标事件 */
  e: MouseEvent
}

interface DragOptions {
  /** 拖动目标元素；传 null / undefined 时解除绑定。必填 */
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  /** 拖动开始（左键按下时），参数为 mousedown 原始事件 */
  onDragStart?(e: MouseEvent): void
  /** 拖动中（document mousemove，passive 监听） */
  onDrag?(params: DragParams): void
  /** 拖动结束（document mouseup） */
  onDragEnd?(params: DragParams): void
  /** 水平拖动范围 [min, max]，钳制 offsetX；不传则不钳制 */
  rangeX?: [number, number]
  /** 垂直拖动范围 [min, max]，钳制 offsetY；不传则不钳制 */
  rangeY?: [number, number]
  /** 初始偏移量，两项默认 0 */
  initial?: { offsetX?: number; offsetY?: number }
}

export function useDrag(options: DragOptions): {
  /** 更新内部累计偏移，不触发任何回调。同步 */
  update: (options: { offsetX?: number; offsetY?: number }) => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `target` | `Ref<HTMLElement \| undefined \| null>` | — | 是 | 变化时自动换绑 `mousedown`；传 `null` 可用于禁用态（如滑块 disabled） |
| `onDragStart` | `(e: MouseEvent) => void` | — | 否 | 仅 `e.button === 0` 时触发；触发前已清空文本选区 |
| `onDrag` | `(params: DragParams) => void` | — | 否 | 每次 mousemove 触发；`x` / `y` 不受范围钳制 |
| `onDragEnd` | `(params: DragParams) => void` | — | 否 | mouseup 时触发；此后内部偏移记为本次 `offsetX` / `offsetY` |
| `rangeX` / `rangeY` | `[number, number]` | — | 否 | 只钳制 `offsetX` / `offsetY`；`rangeX[0]` 必须不大于 `rangeX[1]` |
| `initial.offsetX` / `initial.offsetY` | `number` | `0` | 否 | 起始累计偏移 |

## 方法与事件

`update({ offsetX?, offsetY? })`：同步方法，直接改写内部累计偏移，不触发 `onDrag` / `onDragEnd`。用于外部状态与拖拽内部偏移的同步——组件库滑块在 `modelValue` 外部变化时用它把新位置写入拖拽状态。传入 `undefined` 的轴保持不变。

回调触发顺序：`mousedown`（左键）→ `onDragStart` → 每次 `mousemove` → `onDrag` → `mouseup` → `onDragEnd`。三个回调内 `DragParams` 是同一个复用对象，需要留存时必须自行拷贝字段。

行为细节：

- 仅响应鼠标左键（`e.button === 0`）；右键/中键按下直接忽略
- `mousedown` 时调用 `stopPropagation()` 与 `stopImmediatePropagation()`，并清空当前文本选区
- 拖动期间 `document.onselectstart` 被临时替换为 `() => false`，`mouseup` 后还原为原函数
- `mouseup` 后 `offsetX` / `offsetY` 保留本次终值，下一次拖动在此基础上累计；不希望累计时在 `onDragStart` 里调用 `update({ offsetX: 0, offsetY: 0 })` 归零
- 清理：`target` ref 变化时自动从旧元素移除 `mousedown`；组件 `onBeforeUnmount` 时自动移除全部监听，无需手动 `onUnmounted`

## 典型示例

### 弹窗标题栏拖动

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const headerRef = shallowRef<HTMLElement>()
const dialogRef = shallowRef<HTMLElement>()
const translated = { x: 0, y: 0 }

function apply(x: number, y: number) {
  if (!dialogRef.value) return
  dialogRef.value.style.translate = `${x}px ${y}px`
}

useDrag({
  target: headerRef,
  onDrag({ x, y }) {
    apply(translated.x + x, translated.y + y)
  },
  onDragEnd({ x, y }) {
    // 记录最终位置，供下一次拖动继续叠加
    translated.x += x
    translated.y += y
  }
})
</script>

<template>
  <div ref="dialogRef" style="position: fixed; width: 320px">
    <div ref="headerRef" style="cursor: move">标题栏（按住拖动）</div>
    <div>内容</div>
  </div>
</template>
```

### 范围钳制 + update 同步外部状态（滑块模式）

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const thumbRef = shallowRef<HTMLElement>()
const disabled = shallowRef(false)
const value = shallowRef(0)

const dragger = useDrag({
  // disabled 时传 null 解除绑定
  target: computed(() => (disabled.value ? null : thumbRef.value)),
  rangeX: [0, 200],
  rangeY: [0, 0],
  onDrag({ offsetX }) {
    value.value = offsetX
  },
  onDragEnd({ offsetX }) {
    value.value = offsetX
  }
})

// 外部把 value 改回去（如 reset）时，同步拖拽内部偏移，不触发回调
function reset() {
  value.value = 100
  dragger.update({ offsetX: 100 }) // => 下一次拖动从 100 起步
}
defineExpose({ reset })
</script>

<template>
  <div style="position: relative; width: 200px; height: 20px">
    <div
      ref="thumbRef"
      style="position: absolute; width: 12px; height: 12px; cursor: grab"
    />
  </div>
</template>
```

### 分栏缩放条

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { useDrag } from '@veltra/compositions'

const resizerRef = shallowRef<HTMLElement>()
let offset = 200
let startOffset = 0

useDrag({
  target: resizerRef,
  onDragStart() {
    startOffset = offset
  },
  onDrag({ x }) {
    offset = startOffset + x
    console.log(`当前宽度偏移 ${offset}px`) // => 边拖边输出
  },
  onDragEnd() {
    console.log('缩放结束')
  }
})
</script>

<template>
  <div style="display: flex; width: 400px">
    <div style="flex: 1">面板</div>
    <div
      ref="resizerRef"
      style="width: 4px; cursor: col-resize; background: #ccc"
    />
  </div>
</template>
```

## 注意事项

> [!WARNING]
> - 本库是 `useDrag`（自由拖动单个元素、只给位移与偏移，不改数据顺序），不是列表排序；需要列表项排序、跨容器拖放时用 `useDnD`。
> - 仅支持鼠标左键，不支持触屏 pointer 事件；触屏场景需要自行补 pointer 处理。
> - `onDrag` 的监听是 `{ passive: true }`，回调内调用 `e.preventDefault()` 无效。
> - `x` / `y` 是「本次拖动」的位移，`offsetX` / `offsetY` 才是含历次拖动的累计偏移；两者混用会导致位移加倍。
> - 回调参数 `DragParams` 是复用对象，异步留存必须拷贝字段。
> - 调用时立即读取 `document.onselectstart`，必须在浏览器环境调用；不支持 SSR。
> - 必须在组件 `setup` 中调用（内部使用 `watch` 与 `onBeforeUnmount`）。

## 常见问题

### 拖不动

按序检查：`target.value` 在 `useDrag` 调用后是否已挂载（`watch` 为 `immediate`，元素后出现也会自动绑上，但传 `null` 时始终不绑）；按下的是否为左键；元素或祖先是否有 `user-select` 之外的拦截导致 `mousedown` 未到达。
