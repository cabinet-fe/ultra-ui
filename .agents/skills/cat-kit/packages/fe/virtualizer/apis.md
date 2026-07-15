# 虚拟列表 — API

```ts
interface VirtualizerOptions {
  count?: number
  buffer?: number
  horizontal?: boolean
  paddingStart?: number
  paddingEnd?: number
  gap?: number
  initialOffset?: number
  initialViewport?: number
  estimateSize?: EstimateSize
  useMeasuredAverage?: boolean
  getItemKey?: GetItemKey
}

declare class Virtualizer {
  constructor(options?: VirtualizerOptions)
  setOptions(options: VirtualizerOptions): this
  setCount(count: number): this
  setViewport(size: number): this
  setOffset(offset: number): this
  connect(element: HTMLElement): this
  disconnect(): this
  measure(index: number, size: number): this
  measureMany(items: Array<{ index: number; size: number }>): this
  scrollToOffset(offset: number, options?: { behavior?: ScrollBehavior }): this
  scrollToIndex(
    index: number,
    options?: { align?: VirtualAlign; behavior?: ScrollBehavior }
  ): this
  reset(): this
  destroy(): void
  subscribe(listener: VirtualizerSubscriber): () => void
  getSnapshot(): VirtualSnapshot
  getItem(index: number): VirtualItem
}
```

`VirtualAlign`：`'auto' | 'start' | 'center' | 'end'`。完整字段见 generated。
