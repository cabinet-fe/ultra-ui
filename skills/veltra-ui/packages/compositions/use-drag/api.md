# useDrag - 元素拖拽

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref, ShallowRef } from 'vue'

interface DragParams {
  /** 本次拖动水平距离 */
  x: number
  /** 本次拖动垂直距离 */
  y: number
  /** range 钳制后的水平偏移 */
  offsetX: number
  /** range 钳制后的垂直偏移 */
  offsetY: number
  e: MouseEvent
}

interface DragOptions {
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  onDragStart?(e: MouseEvent): void
  onDrag?(params: DragParams): void
  onDragEnd?(params: DragParams): void
  rangeX?: [number, number]
  rangeY?: [number, number]
  initial?: { offsetX?: number; offsetY?: number }
}

function useDrag(options: DragOptions): {
  update: (options: { offsetX?: number; offsetY?: number }) => void
}
```

## 说明

- 仅响应左键（`button === 0`）。
- `x` / `y` 为本次拖动累计位移；`offsetX` / `offsetY` 为相对 `initial` 并经 `rangeX` / `rangeY` 钳制后的最终偏移。
- `update` 可在外部重置内部偏移（不触发回调）。
