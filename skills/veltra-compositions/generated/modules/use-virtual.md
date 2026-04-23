# use-virtual

```typescript
import { Virtualizer, type VirtualItem } from '@cat-kit/fe'
import {
  computed,
  isRef,
  onScopeDispose,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
  type ShallowRef
} from 'vue'

interface Options {
  /** 指定启用虚拟列表的阈值 */
  virtualThreshold?: number | Ref<number | undefined>
  /** 数量 */
  count: Ref<number>
  /** 滚动容器 */
  scrollEl: ShallowRef<HTMLElement | null>
  /** 估算高度(宽度) */
  estimateSize?: (index: number) => number
  /** 列表项之间的间距，使用 @cat-kit/fe Virtualizer 的原生 gap */
  gap?: number
  /** 列表首项前的固定内边距 */
  paddingStart?: number
  /** 列表末项后的固定内边距 */
  paddingEnd?: number
  /** 可视区外额外保留的预渲染项数，默认 3 */
  overscan?: number
}

export type CustomVirtualItem = VirtualItem & { key: number | string }

export type VirtualReturned = {
  /** 虚拟列表 */
  virtualList: ShallowRef<CustomVirtualItem[]>
  /** 总高度 */
  totalHeight: ShallowRef<number>
  /** 首个渲染项前的占位尺寸（用于块状 spacer） */
  beforeSize: ShallowRef<number>
  /** 末个渲染项后的占位尺寸（用于块状 spacer） */
  afterSize: ShallowRef<number>
  /**
   * 测量元素高度。
   *
   * 必须传入该行对应的「虚拟项索引」（即 rows 数组中的绝对索引），
   * 这样在元素卸载（`el === null`）时才能正确通知底层 Virtualizer 解绑，
   * 否则被移除出 DOM 的行仍会被 ResizeObserver 观察，最终以 size=0 污染尺寸缓存，
   * 引发 totalSize / 滚动条抖动。
   */
  measureElement: (el: Element | null, index: number) => void
  /** 滚动到指定索引 */
  scrollTo: (index: number) => void
  /** 是否启用虚拟列表 */
  virtualEnabled: ComputedRef<boolean>
}

const defaultEstimateSize = () => 34

export function useVirtual(options: Options): VirtualReturned {
  const {
    count,
    scrollEl,
    estimateSize,
    virtualThreshold,
    gap,
    paddingStart,
    paddingEnd,
    overscan = 3
  } = options

  const enabled = computed(() => {
    const threshold = isRef(virtualThreshold) ? virtualThreshold.value : virtualThreshold
    return threshold ? count.value > threshold : true
  })

  const virtualList = shallowRef<CustomVirtualItem[]>([])
  const totalHeight = shallowRef(0)
  const beforeSize = shallowRef(0)
  const afterSize = shallowRef(0)

  const v = new Virtualizer({
    count: count.value,
    overscan,
    gap,
    paddingStart,
    paddingEnd,
    estimateSize: estimateSize ?? defaultEstimateSize
  })

  const unsubscribe = v.subscribe((snapshot) => {
    if (!enabled.value) return

    totalHeight.value = snapshot.totalSize
    beforeSize.value = snapshot.beforeSize
    afterSize.value = snapshot.afterSize
    virtualList.value = snapshot.items.map((item) => ({ ...item, key: item.index }))
  })

  watch(count, (c) => {
    v.setCount(c)
  })

  watch(
    [scrollEl, enabled],
    ([el, on]) => {
      if (!on) {
        virtualList.value = []
        totalHeight.value = 0
        beforeSize.value = 0
        afterSize.value = 0
        v.unmount()
        return
      }

      v.mount(el ?? null)
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    unsubscribe()
    v.destroy()
  })

  function scrollTo(index: number) {
    v.scrollToIndex(index, { align: 'center' })
  }

  /**
   * 是否已完成对 estimateSize 的首次校准。
   *
   * 背景：调用方传入的 `estimateSize` 往往与真实渲染尺寸存在偏差
   * （例如表格行高受主题变量 / 字体 / 边框影响，很难静态猜准）。
   * 若不校准，滚动时每一个新进入视口的项被测量后都会把 totalSize
   * 朝 `actual - estimate` 方向拉动若干像素，导致：
   *   1. 自定义滚动条基于 scrollHeight 重算 thumb 尺寸 → 滚动条抖动；
   *   2. before/after 占位与容器高度联动变化 → 页面视觉抖动。
   * 这里在首次获得真实尺寸后把 estimateSize 校准到真实值，让后续
   * 未渲染项的预估与真实尺寸一致，从源头消除抖动。
   *
   * 注意：`Virtualizer.setOptions({ estimateSize })` 只会使尚未缓存的项
   * 按新估值重算，不会覆盖已测量的真实尺寸，因此调用安全。
   *
   * 为什么优先用索引 0 做校准？
   *   - 表格的 expand 行、分组行等「异形行」高度远大于普通行，若首帧
   *     渲染顺序让它先被测量，estimateSize 会被锁定到一个不代表普通
   *     行的值，再次引起抖动。
   *   - 索引 0 在初次挂载（scrollTop=0）时几乎必然落在可视范围内，
   *     且通常是普通行，因此作为首选校准锚点。
   *   - 对于「初始 scrollTop>0」的边界场景，索引 0 可能从不被测量，
   *     引入 `MAX_CALIBRATION_ATTEMPTS` 次数阈值做降级：当累计跳过
   *     的非零索引测量达到阈值时，回退为「以当前测量值」完成校准，
   *     避免 estimateSize 永远停留在调用方的初值上。
   */
  let estimateCalibrated = false
  let calibrationSkipped = 0
  const MAX_CALIBRATION_ATTEMPTS = 5

  function measureElement(el: Element | null, index: number) {
    if (!enabled.value) return
    if (!Number.isInteger(index) || index < 0) return

    // 传递 null 给 Virtualizer，使其从 ResizeObserver 中解绑该元素，
    // 避免被卸载的 <tr> 在脱离 DOM 后继续触发 size=0 的测量回调，
    // 这是之前 totalSize 被逐步「清零」的根因。
    v.measureElement(index, el)

    if (!el || estimateCalibrated) return

    const isPreferredAnchor = index === 0
    if (!isPreferredAnchor && calibrationSkipped < MAX_CALIBRATION_ATTEMPTS) {
      calibrationSkipped++
      return
    }

    const measured = (el as HTMLElement).offsetHeight
    if (measured <= 0) return

    estimateCalibrated = true
    v.setOptions({ estimateSize: () => measured })
  }

  return {
    virtualEnabled: enabled,
    virtualList,
    totalHeight,
    beforeSize,
    afterSize,
    measureElement,
    scrollTo
  }
}
```
