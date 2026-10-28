import { useResizeObserver } from '@veltra/compositions'
import {
  applyWheelHorizontalScroll,
  computeOverflowNavState,
  scrollElementIntoView,
  scrollViewportByStep
} from '@veltra/utils'
import {
  type CSSProperties,
  type ModelRef,
  type Ref,
  type ShallowRef,
  computed,
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
    const el = list.querySelector<HTMLElement>('[role="tab"].is-active')
    if (!el) return
    scrollElementIntoView(vp, el)
  }

  const indicatorX = shallowRef(0)
  const indicatorY = shallowRef(0)
  const indicatorW = shallowRef(0)
  const indicatorH = shallowRef(0)
  const indicatorOn = shallowRef(false)

  const indicatorStyle = computed<CSSProperties>(() => ({
    width: `${indicatorW.value}px`,
    height: `${indicatorH.value}px`,
    transform: `translate(${indicatorX.value}px, ${indicatorY.value}px)`,
    opacity: indicatorOn.value ? '1' : '0'
  }))

  function measureIndicator() {
    const list = listRef.value
    if (!list) return
    const el = list.querySelector<HTMLElement>('[role="tab"].is-active')
    if (!el) {
      indicatorOn.value = false
      return
    }
    // offset 几何不含 transform：点击瞬间的 :active 按压缩放（scale 0.97）
    // 不会混进测量值；指示器不带过渡、测量后直接就位
    indicatorX.value = el.offsetLeft
    indicatorY.value = el.offsetTop
    indicatorW.value = el.offsetWidth
    indicatorH.value = el.offsetHeight
    indicatorOn.value = true
  }

  /** 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截 */
  const handleWheel = (e: WheelEvent) => {
    const vp = viewportRef.value
    if (!vp) return
    applyWheelHorizontalScroll(e, vp, showNav.value)
  }

  useResizeObserver({
    targets: [viewportRef, listRef],
    onResize: () => {
      updateNavState()
      measureIndicator()
    }
  })

  watch(model, async () => {
    await nextTick()
    ensureActiveVisible()
    measureIndicator()
  })

  watch(
    items,
    async () => {
      await nextTick()
      updateNavState()
      ensureActiveVisible()
      measureIndicator()
    },
    { deep: false }
  )

  onMounted(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.addEventListener('wheel', handleWheel, { passive: false })
    vp.addEventListener('scroll', updateNavState, { passive: true })
    updateNavState()
    nextTick(() => {
      ensureActiveVisible()
      measureIndicator()
    })
  })

  onBeforeUnmount(() => {
    const vp = viewportRef.value
    if (!vp) return
    vp.removeEventListener('wheel', handleWheel)
    vp.removeEventListener('scroll', updateNavState)
  })

  return {
    showNav,
    canPrev,
    canNext,
    updateNavState,
    scrollByStep,
    ensureActiveVisible,
    indicatorStyle
  }
}
