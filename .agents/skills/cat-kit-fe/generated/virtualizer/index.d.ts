//#region src/virtualizer/index.d.ts
type EstimateSize = (index: number) => number
type VirtualAlign = 'auto' | 'start' | 'center' | 'end'
type VirtualizerSubscriber = (snapshot: VirtualSnapshot) => void
interface VirtualizerOptions {
  count?: number
  overscan?: number
  horizontal?: boolean
  paddingStart?: number
  paddingEnd?: number
  initialOffset?: number
  initialViewport?: number
  estimateSize?: EstimateSize
  onChange?: VirtualizerSubscriber
}
interface VirtualItem {
  index: number
  start: number
  end: number
  size: number
}
interface VirtualRange {
  startIndex: number
  endIndex: number
}
interface VirtualSnapshot {
  items: VirtualItem[]
  range: VirtualRange | null
  totalSize: number
  beforeSize: number
  afterSize: number
  offset: number
  viewportSize: number
  horizontal: boolean
  isScrolling: boolean
}
interface VirtualScrollOptions {
  align?: VirtualAlign
  behavior?: ScrollBehavior
}
declare class Virtualizer {
  private count
  private overscan
  private horizontal
  private paddingStart
  private paddingEnd
  private estimateSize
  private onChange?
  private offset
  private viewportSize
  private isScrolling
  private measuredSizes
  private starts
  private ends
  private sizes
  private dirtyIndex
  private snapshot
  private subscribers
  private scrollElement
  private elementIndexes
  private mountedItems
  private itemObserver
  private containerObserver
  private scrollEndTimer
  constructor(options?: VirtualizerOptions)
  setOptions(options: VirtualizerOptions): this
  setCount(count: number): this
  setViewport(size: number): this
  setOffset(offset: number): this
  mount(element: HTMLElement | null): this
  unmount(): this
  destroy(): void
  subscribe(listener: VirtualizerSubscriber): () => void
  measure(index: number, size: number): this
  resizeItem(index: number, size: number): this
  measureElement(index: number, element: Element | null): void
  scrollToOffset(offset: number, options?: VirtualScrollOptions): this
  scrollToIndex(index: number, options?: VirtualScrollOptions): this
  reset(): this
  getSnapshot(): VirtualSnapshot
  getItems(): VirtualItem[]
  getRange(): VirtualRange | null
  getTotalSize(): number
  getItem(index: number): VirtualItem
  private applyOptions
  private pruneCaches
  private invalidateFrom
  private ensureMeasurements
  private recompute
  private calculateRange
  private createItems
  private findStartIndex
  private clampOffset
  private observeContainer
  private ensureItemObserver
  private syncFromElement
  private handleScroll
  private stopScrollTracking
  private notify
}
//#endregion
export {
  EstimateSize,
  VirtualAlign,
  VirtualItem,
  VirtualRange,
  VirtualScrollOptions,
  VirtualSnapshot,
  Virtualizer,
  VirtualizerOptions,
  VirtualizerSubscriber
}
