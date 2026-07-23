# usePop - 浮框定位

## 示例

见 `./examples.md`

## 类型

```ts
import type { ComputePositionReturn } from '@floating-ui/dom'
import type { ShallowRef } from 'vue'

type TipDirection = 'top' | 'bottom' | 'left' | 'right'
type TipAlign = 'center' | 'start' | 'end'

interface UsePopOptions {
  triggerRef: ShallowRef<HTMLElement | undefined>
  contentRef: ShallowRef<HTMLElement | undefined>
  arrowRef?: ShallowRef<HTMLElement | undefined>
  direction?: ShallowRef<TipDirection> | TipDirection
  alignment?: ShallowRef<TipAlign> | TipAlign
  /** @default 10 */
  arrowSize?: number
  /** 触发器滚动/resize 时回调；需在回调内自行调用 update */
  onTriggerPositionChange?: () => void
  onBeforeUpdate?: (triggerEl: HTMLElement, contentEl: HTMLElement) => void
  onAfterUpdate?: (position: ComputePositionReturn) => void
  onPop?: (position: ComputePositionReturn) => void
}

function usePop(options: UsePopOptions): {
  update: () => Promise<void>
  popperContainerId: string
}
```

## 说明

- 基于 `@floating-ui/dom`，内置 `offset` / `flip` / `shift` / `arrow`。
- 模块级单例 `<div id="pop-container">` 自动挂到 `document.body`；`popperContainerId` 恒为 `'pop-container'`。
- `contentRef` 有值时自动 `update` 并监听触发器祖先滚动与 window resize（需提供 `onTriggerPositionChange`）。
