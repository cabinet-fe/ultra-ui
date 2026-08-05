import { useResizeObserver } from '@veltra/compositions'
import {
  applyWheelHorizontalScroll,
  computeOverflowNavState,
  scrollElementIntoView,
  scrollViewportByStep
} from '@veltra/utils'
import {
  type ModelRef,
  type Ref,
  type ShallowRef,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch
} from 'vue'

import type { TabItem } from '../../types'

interface UseTabsBarOptions {
  viewportRef: ShallowRef<HTMLElement | undefined>
  listRef: ShallowRef<HTMLElement | undefined>
  items: Ref<TabItem[]>
  model: ModelRef<string | undefined>
}

/**
 * 水平标签栏的溢出滚动逻辑（滚动几何/滚轮转横滚/元素滚入视野共享
 * @veltra/utils overflow-nav，见 #17；此处保留 useResizeObserver 与 watch 差异）：
 * - 计算 nav 按钮显隐与可用状态
 * - 提供按步滚动与活动标签自动滚入视野的方法
 * - 绑定 wheel / scroll / resize 事件
 */
export function useTabsBar(options: UseTabsBarOptions) {
  const { viewportRef, listRef, items, model } = options

  const showNav = shallowRef(false)
  const canPrev = shallowRef(false)
  const canNext = shallowRef(false)

  /** 依据 viewport 与内容尺寸推导滚动按钮可用状态 */
  const updateNavState = () => {
    const vp = viewportRef.value
    if (!vp) return
    const state = computeOverflowNavState(vp)
    showNav.value = state.overflowing
    canPrev.value = state.canPrev
    canNext.value = state.canNext
  }

  /** 箭头按钮：按视口宽度 80% 的步长平滑滚动 */
  const scrollByStep = (dir: 1 | -1) => {
    const vp = viewportRef.value
    if (!vp) return
    scrollViewportByStep(vp, dir)
  }

  /** 活动标签自动滚入视野 */
  const ensureActiveVisible = () => {
    const vp = viewportRef.value
    const list = listRef.value
    if (!vp || !list) return
    const activeKey = model.value
    if (!activeKey) return
    const activeIndex = items.value.findIndex((i) => i.key === activeKey)
    if (activeIndex < 0) return
    const el = list.children[activeIndex] as HTMLElement | undefined
    if (!el) return
    scrollElementIntoView(vp, el)
  }

  /** 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截 */
  const handleWheel = (e: WheelEvent) => {
    const vp = viewportRef.value
    if (!vp) return
    applyWheelHorizontalScroll(e, vp, showNav.value)
  }

  useResizeObserver({ targets: [viewportRef, listRef], onResize: () => updateNavState() })

  watch(model, async () => {
    await nextTick()
    ensureActiveVisible()
  })

  watch(
    items,
    async () => {
      await nextTick()
      updateNavState()
      ensureActiveVisible()
    },
    { deep: false }
  )

  onMounted(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.addEventListener('wheel', handleWheel, { passive: false })
    vp.addEventListener('scroll', updateNavState, { passive: true })
    updateNavState()
    nextTick(ensureActiveVisible)
  })

  onBeforeUnmount(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.removeEventListener('wheel', handleWheel)
    vp.removeEventListener('scroll', updateNavState)
  })

  return { showNav, canPrev, canNext, updateNavState, scrollByStep, ensureActiveVisible }
}
