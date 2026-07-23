# useReactiveSize - 响应式尺寸

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref, ShallowRef } from 'vue'

type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ElementSize {
  width: number
  height: number
}

function useReactiveSize(target: RefElement): ElementSize
function useReactiveSize(targets: RefElement[]): ElementSize[]
```

## 说明

- 返回 **reactive** 对象（非 ref），模板中直接 `size.width`，无需 `.value`。
- 基于 `useResizeObserver`，读取 `borderBoxSize` 的 `inlineSize` / `blockSize`。
