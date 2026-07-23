# useResizeObserver / useObserverCallback - 尺寸观察

## 示例

见 `./examples.md`

## 类型

```ts
import type { Ref, ShallowRef } from 'vue'

type RefElement =
  | ShallowRef<HTMLElement | undefined | null>
  | Ref<HTMLElement | undefined | null>

interface ResizeObserverOptions {
  targets: RefElement | RefElement[]
  onResize: ResizeObserverCallback
  when?: () => boolean
}

function useResizeObserver(options: ResizeObserverOptions): {
  disconnect: () => void
}

function useObserverCallback(): {
  observeEl: <El extends HTMLElement>(
    el: El,
    cb: (entry: Omit<ResizeObserverEntry, 'target'> & { target: El }) => void
  ) => void
  unobserveEl: (el: HTMLElement) => void
}
```

## 说明

- `useResizeObserver`：`targets` 可为单 ref 或 ref 数组；卸载或调用 `disconnect` 时停止观察。
- `useObserverCallback`：按元素维度注册回调；首次观察会跳过一次（内部 `dataset.ob` 标记），避免初始回调噪声。
