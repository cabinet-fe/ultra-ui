//#region src/virtualizer/index.d.ts
/**
 * 未测项的尺寸估值函数。
 *
 * @param index - 项的索引。
 * @returns 该项的预估像素尺寸（水平模式下为宽度，垂直模式下为高度）。负数会被 clamp 到 0。
 *
 * @remarks
 * 函数应尽量**无副作用、可重入**：同一 index 在短时间内可能被调用多次。
 * 若启用 `useMeasuredAverage`（默认），估值一旦有至少一个真实样本就会被「已测平均值」接管，
 * `estimateSize` 仅作为冷启动兜底与关闭 `useMeasuredAverage` 时的唯一来源。
 */
type EstimateSize = (index: number) => number
/**
 * `scrollToIndex` 对齐方式。
 *
 * - `auto`：仅当目标项已在视口外才滚动，方向按最短路径（项在视口上方 → 对齐视口顶；下方 → 对齐视口底）
 * - `start`：项顶部（或左侧，水平模式）对齐视口起点
 * - `center`：项中线对齐视口中线
 * - `end`：项底部（或右侧）对齐视口终点
 */
type VirtualAlign = 'auto' | 'start' | 'center' | 'end'
/**
 * `subscribe` 回调签名：在**结构性**变化发生时收到当前快照。
 *
 * 「结构性」包含 `range` / `items` / `totalSize` / `viewportSize` / `horizontal` / `isScrolling`
 * / `beforeSize` / `afterSize` 的变化；纯 `offset` 位移不会触发回调，请直接读容器 `scrollTop`。
 */
type VirtualizerSubscriber = (snapshot: VirtualSnapshot) => void
/**
 * 基于 index 返回稳定 key 的函数，用于把测量缓存按数据项身份（而非位置索引）存储。
 *
 * @param index - 项的索引，范围 `[0, count)`。
 * @returns 该数据项的稳定 key。
 *
 * @remarks
 * **约束**：必须在整个 Virtualizer 生命周期内对同一数据项保持稳定；
 * 不要基于 `Math.random()`、当前时间或每次渲染新建的对象引用生成 key，
 * 否则测量缓存无法被正确识别并复用。
 */
type GetItemKey = (index: number) => number | string
/** Virtualizer 初始化参数。字段均可选，缺省时使用安全默认值。 */
interface VirtualizerOptions {
  /** 虚拟项总数，默认 0 */
  count?: number
  /** 可视区外额外保留的预渲染项数，默认 4 */
  buffer?: number
  /** 是否为水平滚动（否则为垂直），默认 false */
  horizontal?: boolean
  /** 列表首项前的固定内边距（px），默认 0 */
  paddingStart?: number
  /** 列表末项后的固定内边距（px），默认 0 */
  paddingEnd?: number
  /** 相邻两项之间的间距（px），语义与 CSS `gap` 对齐，默认 0 */
  gap?: number
  /** 初始滚动偏移（px），默认 0 */
  initialOffset?: number
  /** 未 connect 前使用的初始 viewport 尺寸（px），默认 0 */
  initialViewport?: number
  /** 项预估尺寸函数，默认返回 36 */
  estimateSize?: EstimateSize
  /**
   * 未测项是否使用「已测项平均尺寸」作为估值。开启后首个样本产生即全面替换估值，
   * 配合 scrollAdjustments 可显著缓解 estimateSize 与真实值偏差过大带来的滚动条抖动。
   *
   * @default true
   */
  useMeasuredAverage?: boolean
  /**
   * 基于 index 返回稳定 key，用于把测量缓存按数据项身份存储。
   * 提供后列表前插 / 乱序 / 中段删除时，未变动项的真实测量值仍可被复用；
   * 未提供时行为与旧版本一致（按 index 缓存）。
   */
  getItemKey?: GetItemKey
}
/** 单个虚拟项的位置与尺寸，所有数值都是 `px`，相对列表内容起点（不含 `paddingStart`）。 */
interface VirtualItem {
  /** 项在数据源中的索引。 */
  index: number
  /** 项起点到列表容器起点的距离。 */
  start: number
  /** 项终点到列表容器起点的距离，等于 `start + size`。 */
  end: number
  /** 项尺寸（高度 / 宽度）。 */
  size: number
}
/** 可视区命中的原始索引范围（不含 `buffer`）。当 `count === 0` 或 `viewportSize <= 0` 时为 `null`。 */
interface VirtualRange {
  /** 视口首次命中的项索引。 */
  startIndex: number
  /** 视口最后命中的项索引。 */
  endIndex: number
}
/**
 * 虚拟列表快照，即真正渲染的列表内容
 */
interface VirtualSnapshot {
  /** 当前应渲染的项列表（已包含 `buffer` 扩张）。 */
  items: VirtualItem[]
  /** 不含 `buffer` 的原始可视区命中范围。 */
  range: VirtualRange | null
  /** 列表内容总尺寸（含 `paddingStart` / `paddingEnd`）。 */
  totalSize: number
  /** `items[0]` 前需预留的占位空间（含 `paddingStart`），用于 spacer 布局。 */
  beforeSize: number
  /** `items[items.length - 1]` 后需预留的占位空间（含 `paddingEnd`）。 */
  afterSize: number
  /** 当前滚动偏移（像素）。 */
  offset: number
  /** 当前容器视口尺寸。 */
  viewportSize: number
  /** 是否水平滚动。 */
  horizontal: boolean
  /** 是否处于滚动中（由 `scroll` / `scrollend` 事件与 120ms 兜底计时驱动）。 */
  isScrolling: boolean
}
interface VirtualScrollOptions {
  /** 对齐方式，默认 `auto`。仅对 `scrollToIndex` 生效；`scrollToOffset` 始终按 `start` 语义。 */
  align?: VirtualAlign
  /** 滚动行为，传 `'smooth'` 走浏览器原生平滑动画 + rAF 校准循环；默认 `'auto'`（同步跳转）。 */
  behavior?: ScrollBehavior
}
interface VirtualMeasurement {
  /** 项的索引，范围 `[0, count)`；越界的测量会被静默忽略。 */
  index: number
  /** 项的真实像素尺寸。 */
  size: number
}
declare class Virtualizer {
  /** 虚拟项总数 */
  private count
  private buffer
  private horizontal
  private paddingStart
  private paddingEnd
  private gap
  private estimateSize
  private useMeasuredAverage
  private getItemKey
  private offset
  private viewportSize
  private isScrolling
  /**
   * 测量缓存，键为数据项的稳定 key，值为像素尺寸。
   */
  private measuredByKey
  private measuredSum
  private averageEstimate
  private firstUnmeasured
  private starts
  private sizes
  private dirtyIndex
  private snapshot
  private subscribers
  private scrollElement
  private containerObserver
  private scrollEndTimer
  private scrollEndNative
  /** 已测量的元素集合 */
  private mounted
  /** 尺寸测量器 */
  private tracker
  /** 滚动矫正器 */
  private reconciler
  /** 视口前方项尺寸变化的累积 delta，recompute 开头统一 flush 一次 DOM 写入。 */
  private pendingScrollAdjust
  /**
   * 创建一个 Virtualizer 实例。
   *
   * @example
   * ```ts
   * import { Virtualizer } from '@cat-kit/fe'
   *
   * const v = new Virtualizer({
   *   count: 10_000,
   *   buffer: 6,
   *   estimateSize: () => 44,
   *   getItemKey: (i) => rows[i].id
   * })
   * ```
   */
  constructor(options?: VirtualizerOptions)
  /**
   * 批量更新选项。只传需要变更的字段，未传字段保持当前值。
   *
   * @param options - 需要更新的字段集合。
   *
   * @remarks
   * - `initialOffset` / `initialViewport` 仅在构造时生效，这里传入会被忽略。
   * - **同轮更新顺序**：`getItemKey` 始终先于 `count` 应用，保证 `count` 剪裁使用的是新 key 空间，
   *   避免 `setOptions({ count, getItemKey })` 把数据重排后仍存活的测量误删。
   * - **`getItemKey` 切换语义**：
   *   - `function → function`（keyed → keyed）：保留 `measuredByKey`，旧 key 的真实测量值仍被复用（前插 / 乱序场景）。
   *   - `undefined ↔ function`（key 空间切换）：清空 `measuredByKey` / `measuredSum` / `averageEstimate`，避免跨空间污染。
   * - 任何触发「全量失效」的字段（`paddingStart` / `gap` / `estimateSize` / `useMeasuredAverage` / `getItemKey`）都会调用 `invalidate(0)` 重排所有项。
   *
   * @example
   * ```ts
   * v.setOptions({ count: 500, buffer: 8 })
   * v.setOptions({ count: newRows.length, getItemKey: (i) => newRows[i].id })
   * ```
   */
  setOptions(options: VirtualizerOptions): this
  /**
   * 更新虚拟项总数。
   *
   * @param count - 新的项数，负数会被 clamp 到 0，小数会被截断。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * - **收缩时**（`count < prevCount`）：`[count, prevCount)` 范围的测量缓存会被剪裁
   *   （keyed 模式按新 key 空间构造 alive 集合）；`mounted` 中同范围的元素会被 `unobserve`。
   * - **扩张时**（`count > prevCount`）：从 `prevCount` 起标记为待重算，后续渲染按 `estimateSize` / 已测平均值给出估值。
   * - 数值未变化时为 no-op，不触发快照更新。
   */
  setCount(count: number): this
  /**
   * 设置可视区尺寸（px）。一般由 `connect` 后的 `ResizeObserver` 自动同步；
   * 仅在手动布局（SSR、无 ResizeObserver 环境、测试）时直接调用。
   *
   * @param size - 新的视口尺寸，负数会被 clamp 到 0，小数会被四舍五入。
   * @returns 自身，支持链式调用。
   *
   * @remarks `offset` 会按新视口重新 clamp，避免越界到 `totalSize - newViewport` 之外。
   */
  setViewport(size: number): this
  /**
   * 直接设置逻辑 offset（px），不会写 DOM。
   *
   * @param offset - 目标偏移量，会被 clamp 到 `[0, totalSize - viewportSize]`，小数会被四舍五入。
   *
   * @remarks
   * 这是「只更新内部状态」的低阶入口，常用于 SSR 水合前恢复滚动位置；
   * 要让 DOM 真正跳转请用 {@link Virtualizer.scrollToOffset}。
   */
  setOffset(offset: number): this
  /**
   * 绑定滚动容器。传入相同元素会触发一次 `syncFromElement` 但不重建事件监听；
   * 传入不同元素会先 `disconnect` 旧容器再挂载新容器；传入 `null` 等价于 `disconnect()`。
   *
   * @param element - 滚动容器，需是可滚动元素（`overflow: auto/scroll`）。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * connect 会：
   * 1. 订阅容器的 `scroll` 事件（passive）驱动 `offset` / `isScrolling`；支持原生 `scrollend` 时优先使用，否则 120ms 计时器兜底；
   * 2. 订阅容器的 `ResizeObserver`（若可用）驱动 `viewportSize`；
   * 3. 同步首帧：读取当前 `scrollTop` / `clientHeight` 写回到 `offset` / `viewportSize`。
   *
   * @example
   * ```ts
   * onMounted(() => virtualizer.connect(scrollRef.value))
   * onBeforeUnmount(() => virtualizer.destroy())
   * ```
   */
  connect(element: HTMLElement | null): this
  /**
   * 解绑当前滚动容器：取消 rAF 校准循环、卸下 `scroll` / `scrollend` / `ResizeObserver`、
   * 清空 `mounted` 映射与 `ResizeTracker`。实例仍可被复用（再次 `connect` 到新容器）。
   *
   * @returns 自身，支持链式调用。
   *
   * @remarks 不清空测量缓存与订阅者。
   */
  disconnect(): this
  /**
   * 彻底销毁实例：`disconnect` + 释放 `ResizeTracker` 内部引用 + 清空订阅者。
   * 销毁后不应再调用任何实例方法。
   *
   * @remarks 组件卸载时（Vue `onBeforeUnmount` / React `useEffect` cleanup）应调用此方法。
   */
  destroy(): void
  /**
   * 订阅虚拟化快照内容。
   *
   * @param listener - 回调函数，入参为当前虚拟化快照内容。
   * @returns 取消订阅函数；多次调用幂等。
   */
  subscribe(listener: VirtualizerSubscriber): () => void
  /**
   * 上报单条真实测量。等价于 `measureMany([{ index, size }])`。
   *
   * @param index - 项的索引，范围 `[0, count)`；越界静默忽略。
   * @param size - 真实像素尺寸，负数会被 clamp 到 0。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * 当数据层能直接提供真实行高 / 列宽（例如后端分页返回尺寸元信息）时使用；
   * 若尺寸需由 DOM 推断，优先用 {@link Virtualizer.measureElement}。
   */
  measure(index: number, size: number): this
  /**
   * 批量上报真实测量。同批次内多条视口前方项的尺寸变化会被合并成**一次** `scrollTop` DOM 写入，
   * 避免抖动。
   *
   * @param measurements - 可迭代的测量记录，每条包含 `{ index, size }`。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * 大数据量首屏优先路径：
   * ```ts
   * virtualizer.measureMany(rows.map((r, i) => ({ index: i, size: r.height })))
   * ```
   * 一次 `measureMany` 后全部项均被精确测量，后续远距离 `scrollToIndex` 不会再遇到 `totalSize` 跳变。
   */
  measureMany(measurements: Iterable<VirtualMeasurement>): this
  /**
   * 测量元素尺寸
   *
   * @param index - 项的索引，范围 `[0, count)`。
   * @param element - 对应的 DOM 元素；传 `null` 表示卸载该 index（同步 `unobserve`）。
   *
   * @remarks
   * - 支持 `ResizeObserver` 的浏览器走异步路径，避免滚动中新挂载项触发同步布局读取；
   *   不支持时回退到 `getBoundingClientRect()` 并立即调用 `measure`。
   * - 幂等：`measureElement(i, sameEl)` 不会重复 observe。
   *
   * @example
   * ```html
   * <div v-for="item in items" :ref="(el) => v.measureElement(item.index, el as Element)">
   *   ...
   * </div>
   * ```
   */
  measureElement(index: number, element: Element | null): void
  /**
   * 滚动到指定像素偏移。
   *
   * @param offset - 目标 offset（px），会被 clamp 到 `[0, totalSize - viewportSize]`。
   * @param options - 可选 `behavior`（`'auto'` 默认 / `'smooth'`）；`align` 字段对本方法无效。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * - `behavior: 'auto'`（默认）：同步写 `scrollTop` + 同步 `recompute()`，`snapshot.offset` 立即等于目标值。
   * - `behavior: 'smooth'`：浏览器原生平滑滚动 + rAF 校准；`snapshot.offset` 由 scroll 事件逐帧驱动，**不**预写为目标值。
   *   用户在动画中手动滚动 / 再次调用 `scrollTo*` / `disconnect` 会立即终止校准，另有 5 秒硬性安全阀兜底。
   * - 未绑定滚动容器时仍会更新逻辑 offset（`behavior: 'auto'`），但无 DOM 侧副作用。
   */
  scrollToOffset(offset: number, options?: VirtualScrollOptions): this
  /**
   * 滚动到指定项。
   *
   * @param index - 目标项索引，会被 clamp 到 `[0, count - 1]`，小数截断。
   * @param options - 可选参数：`align` 对齐方式（默认 `'auto'`），`behavior` 滚动行为（默认 `'auto'`）。
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * - `count === 0` 时为 no-op。
   * - `behavior: 'smooth'` 走浏览器原生平滑滚动 + rAF 校准循环：动画中若测量更新导致目标漂移（例如 `buffer` 外的未测项在滚入视口时才拿到真实尺寸），
   *   自动以 `behavior: 'auto'` 跳到修正后的目标位置。
   * - smooth 期间**不要**在调用后立即同步读 `snapshot.offset`，该值由 scroll 事件驱动。
   */
  scrollToIndex(index: number, options?: VirtualScrollOptions): this
  /**
   * 清空所有测量缓存与位置缓存、取消 rAF 校准、把 `offset` 归零后重算快照。
   *
   * @returns 自身，支持链式调用。
   *
   * @remarks
   * 常用于「数据源整体替换」（新的 `count` 与全新的数据项）；
   * 如果数据仅部分变化且能提供稳定 key，优先用 `getItemKey` 保留历史测量，而不是 `reset()` 全量清空。
   * 不会解绑滚动容器，也不会清除订阅者。
   */
  reset(): this
  /**
   * 读取当前快照。同一对象引用在纯 `offset` 位移帧里会保留不变（仅就地改 `offset` / `isScrolling`），
   * 因此**不要**用 `===` 判断是否需要重渲染；请对比结构字段（`range` / `totalSize` 等）或走 {@link Virtualizer.subscribe}。
   *
   * @returns 当前 {@link VirtualSnapshot}。
   */
  getSnapshot(): VirtualSnapshot
  /**
   * 读取某个 index 对应的虚拟项位置信息。会确保内部位置缓存已重算（懒计算）。
   *
   * @param index - 项的索引，必须落在 `[0, count)`。
   * @returns 该项的 {@link VirtualItem}（包含 `start` / `end` / `size`）。
   * @throws `RangeError` 当 `index` 超出 `[0, count)` 范围。
   *
   * @remarks 常用于业务侧计算「第 N 项是否可见」「第 N 项在视口内的相对位置」等；内部滚动对齐由 `scrollToIndex` 自动处理，无需手动调用此方法。
   */
  getItem(index: number): VirtualItem
  private applyOptions
  /** 更新 count 并同步测量 / mounted 剪裁与 dirty 指针。返回是否发生变化。 */
  private updateCount
  private keyOf
  /** 未测项估值：优先已测平均值（若启用），否则 estimateSize。 */
  private estimate
  private pruneMeasured
  private pruneMounted
  /** 标记从指定索引开始的测量缓存已失效 */
  private invalidate
  /**
   * 应用测量：更新缓存、触发 invalidate、并在必要时做 scrollAdjustments 抑制抖动。
   * 返回 true 表示发生了有效变化，调用方需 recompute。
   */
  private applyMeasurement
  private syncAverageEstimate
  private shouldInvalidateAverage
  private advanceFirstUnmeasured
  private findNextUnmeasured
  private ensureMeasurements
  private recompute
  /** 只比较会影响视觉结构的字段；offset 变化不算"结构性差异"。 */
  private isStructuralEqual
  private computeTotalSize
  private calculateRange
  private createItems
  /** 查找在指定偏移量下，第一个包含在可视区内的项的索引 */
  private findStartIndex
  private findEndIndex
  private clampOffset
  private clampOffsetWithViewport
  /** align 换算：纯函数，不写 DOM；供 scrollToIndex 与 Reconciler 共用。 */
  private getOffsetForIndex
  /**
   * scroll 入口：non-smooth 同步写 + recompute；smooth 委托 Reconciler 的 rAF 校准循环
   * 并不预写 this.offset（由 scroll 事件驱动）。
   */
  private performScroll
  private syncFromElement
  private handleScroll
  private handleScrollEnd
  private kickScrollEndTimer
  private markScrollEnd
}
//#endregion
export {
  EstimateSize,
  GetItemKey,
  VirtualAlign,
  VirtualItem,
  VirtualMeasurement,
  VirtualRange,
  VirtualScrollOptions,
  VirtualSnapshot,
  Virtualizer,
  VirtualizerOptions,
  VirtualizerSubscriber
}
