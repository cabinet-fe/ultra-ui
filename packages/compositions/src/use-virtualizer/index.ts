import {
  Virtualizer,
  type VirtualItem,
  type VirtualSnapshot,
  type VirtualizerOptions
} from '@cat-kit/fe'
import {
  onScopeDispose,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef
} from 'vue'

type MaybeEl = HTMLElement | null | undefined

export interface UseVirtualizerOptions extends Omit<VirtualizerOptions, 'count'> {
  /** 响应式虚拟项总数；内部 `watch` 驱动 `virtualizer.setCount`。 */
  count: Ref<number>
  /**
   * 响应式滚动容器；变更时自动 `connect` / `disconnect`。
   * `immediate: true`，初始为 `null` 时等价于 `disconnect()`。
   */
  scrollEl: MaybeRefOrGetter<MaybeEl>
  /**
   * 可选：内容承接元素。hook 订阅到结构性更新时直接写入
   * `style.height = totalSize + 'px'`（水平模式为 `width`），
   * **不经过 Vue 响应式**——因此 `totalSize` 的变化不会触发模板重渲染。
   * 当引用切换为 `null` 时，会清空此前写入的内联尺寸，恢复 CSS 默认。
   */
  contentEl?: MaybeRefOrGetter<MaybeEl>
  /** 可选：首项前占位元素。语义同 `contentEl`，写 `beforeSize`。 */
  beforeEl?: MaybeRefOrGetter<MaybeEl>
  /** 可选：末项后占位元素。语义同 `contentEl`，写 `afterSize`。 */
  afterEl?: MaybeRefOrGetter<MaybeEl>
}

export interface UseVirtualizerReturned {
  /**
   * 底层 `Virtualizer` 实例。
   *
   * 未做包装；消费者可直接调用 `scrollToIndex` / `scrollToOffset` /
   * `reset` / `measureMany` / `setOptions` / `measureElement` 等方法。
   */
  virtualizer: Virtualizer
  /**
   * 完整快照 shallowRef。任一结构性变化（items/range/isScrolling/各种 size）都会更新。
   * 大多数消费者只需 `items` / `isScrolling`，此 ref 仅在需要 `range` / `totalSize` 等
   * 其它字段时使用。
   */
  snapshot: ShallowRef<VirtualSnapshot>
  /**
   * 仅在底层 `items` 引用变化时才更新的 shallowRef。
   *
   * 独立于 `snapshot`，用于模板 `v-for`；这样 `isScrolling` 等字段的切换不会
   * 连带触发 `items.map(...)` 的重新求值。
   */
  items: ShallowRef<VirtualItem[]>
  /** 仅在布尔值变化时更新的 `isScrolling` 状态。 */
  isScrolling: ShallowRef<boolean>
}

function writeSize(el: MaybeEl, size: number, horizontal: boolean): void {
  if (!el) return
  if (horizontal) el.style.width = `${size}px`
  else el.style.height = `${size}px`
}

function clearSize(el: MaybeEl, horizontal: boolean): void {
  if (!el) return
  if (horizontal) el.style.width = ''
  else el.style.height = ''
}

/**
 * Vue 适配层：把 `@cat-kit/fe` 的 `Virtualizer` 生命周期与响应式系统对接。
 *
 * 设计原则：
 * 1. **尺寸写入走 DOM**：`contentEl` / `beforeEl` / `afterEl` 一旦传入，
 *    hook 在 `subscribe` 回调中命令式写 `style.height`；消费者模板无需绑定
 *    `totalSize` / `beforeSize` / `afterSize`，滚动时 Vue 不会因尺寸变化重渲染。
 * 2. **`items` / `isScrolling` 独立拆分**：底层 subscribe 一次回调可能同时包含
 *    items 变化与 isScrolling 切换；拆成两个 shallowRef 后，消费者 `v-for`
 *    的 `computed(() => items.value.map(...))` 不会因 `isScrolling` 变化而重新执行。
 * 3. **业务语义外置**：阈值判定 / key 组装 / `scrollToIndex` 对齐方式由消费者组装。
 *
 * 约束：
 * - `initialOffset` / `initialViewport` 仅构造时生效，后续 `setOptions` 忽略（底层契约）。
 * - 消费者若需运行时切换 `estimateSize` / `getItemKey` 等字段，调用 `virtualizer.setOptions(...)`。
 */
export function useVirtualizer(options: UseVirtualizerOptions): UseVirtualizerReturned {
  const { count, scrollEl, contentEl, beforeEl, afterEl, ...initOptions } = options
  const horizontal = initOptions.horizontal === true

  const virtualizer = new Virtualizer({ ...initOptions, count: count.value })

  const initialSnapshot = virtualizer.getSnapshot()
  const snapshot = shallowRef<VirtualSnapshot>(initialSnapshot)
  const items = shallowRef<VirtualItem[]>(initialSnapshot.items)
  const isScrolling = shallowRef<boolean>(initialSnapshot.isScrolling)

  function flushSizes(s: VirtualSnapshot): void {
    writeSize(toValue(contentEl) ?? null, s.totalSize, horizontal)
    writeSize(toValue(beforeEl) ?? null, s.beforeSize, horizontal)
    writeSize(toValue(afterEl) ?? null, s.afterSize, horizontal)
  }

  // 初次同步，覆盖构造阶段 count > 0 场景（容器未 connect 时 totalSize 已有值）。
  flushSizes(initialSnapshot)

  const unsubscribe = virtualizer.subscribe((next) => {
    snapshot.value = next
    if (next.items !== items.value) items.value = next.items
    if (next.isScrolling !== isScrolling.value) isScrolling.value = next.isScrolling
    flushSizes(next)
  })

  watch(count, (c) => {
    virtualizer.setCount(c)
  })

  watch(
    () => toValue(scrollEl) ?? null,
    (el) => {
      if (el) virtualizer.connect(el)
      else virtualizer.disconnect()
    },
    { immediate: true }
  )

  // 元素引用切换时：清旧元素的内联尺寸 + 立即给新元素写入当前快照值。
  // 不向 hook 返回值暴露这些元素（消费者用 :ref 绑定自己的 ref 即可）。
  function bindSizeSlot(
    source: MaybeRefOrGetter<MaybeEl> | undefined,
    pick: (s: VirtualSnapshot) => number
  ): void {
    if (source === undefined) return
    watch(
      () => toValue(source) ?? null,
      (el, oldEl) => {
        if (oldEl && oldEl !== el) clearSize(oldEl, horizontal)
        if (el) writeSize(el, pick(snapshot.value), horizontal)
      }
    )
  }

  bindSizeSlot(contentEl, (s) => s.totalSize)
  bindSizeSlot(beforeEl, (s) => s.beforeSize)
  bindSizeSlot(afterEl, (s) => s.afterSize)

  onScopeDispose(() => {
    unsubscribe()
    virtualizer.destroy()
    clearSize(toValue(contentEl) ?? null, horizontal)
    clearSize(toValue(beforeEl) ?? null, horizontal)
    clearSize(toValue(afterEl) ?? null, horizontal)
  })

  return { virtualizer, snapshot, items, isScrolling }
}
