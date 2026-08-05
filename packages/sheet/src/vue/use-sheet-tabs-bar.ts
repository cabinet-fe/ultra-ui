import {
  applyWheelHorizontalScroll,
  computeOverflowNavState,
  scrollElementIntoView,
  scrollViewportByStep
} from '@veltra/utils'
import { type Ref, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

/** 模板 ref（useTemplateRef / shallowRef 均可） */
type ElRef = { readonly value: HTMLElement | null | undefined }

interface UseSheetTabsBarOptions {
  viewportRef: ElRef
  listRef: ElRef
  /** sheet 列表（长度变化触发导航状态刷新） */
  sheetList: Ref<readonly unknown[]>
  /** 活动 tab 下标（number，非 string key） */
  activeIndex: Ref<number>
}

/**
 * Sheet 底部标签栏溢出滚动（滚动几何/滚轮转横滚/元素滚入视野共享
 * @veltra/utils overflow-nav，见 #17；此处保留事件绑定与 watch 差异）：
 * - showNav / canPrev / canNext
 * - 箭头按视口宽度 ~80% 步进
 * - 活动 tab 滚入视野
 * - 纵向滚轮转横滚；触控板横滑不拦截
 * - 原生 ResizeObserver（不引入 @veltra/compositions peer）
 */
export function useSheetTabsBar(options: UseSheetTabsBarOptions) {
  const { viewportRef, listRef, sheetList, activeIndex } = options

  const showNav = shallowRef(false)
  const canPrev = shallowRef(false)
  const canNext = shallowRef(false)

  let resizeObserver: ResizeObserver | undefined

  const updateNavState = () => {
    const vp = viewportRef.value
    if (!vp) return
    const state = computeOverflowNavState(vp)
    showNav.value = state.overflowing
    canPrev.value = state.canPrev
    canNext.value = state.canNext
  }

  const scrollByStep = (dir: 1 | -1) => {
    const vp = viewportRef.value
    if (!vp) return
    scrollViewportByStep(vp, dir)
  }

  const ensureActiveVisible = () => {
    const vp = viewportRef.value
    const list = listRef.value
    if (!vp || !list) return
    const index = activeIndex.value
    if (index < 0) return
    const el = list.children[index] as HTMLElement | undefined
    if (!el) return
    scrollElementIntoView(vp, el)
  }

  /** 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截 */
  const handleWheel = (e: WheelEvent) => {
    const vp = viewportRef.value
    if (!vp) return
    applyWheelHorizontalScroll(e, vp, showNav.value)
  }

  watch(activeIndex, async () => {
    await nextTick()
    ensureActiveVisible()
    updateNavState()
  })

  watch(
    sheetList,
    async () => {
      await nextTick()
      updateNavState()
      ensureActiveVisible()
    },
    { deep: false }
  )

  onMounted(() => {
    const vp = viewportRef.value
    const list = listRef.value
    if (vp) {
      vp.addEventListener('wheel', handleWheel, { passive: false })
      vp.addEventListener('scroll', updateNavState, { passive: true })
    }
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateNavState())
      if (vp) resizeObserver.observe(vp)
      if (list) resizeObserver.observe(list)
    }
    updateNavState()
    nextTick(ensureActiveVisible)
  })

  onBeforeUnmount(() => {
    const vp = viewportRef.value
    if (vp) {
      vp.removeEventListener('wheel', handleWheel)
      vp.removeEventListener('scroll', updateNavState)
    }
    resizeObserver?.disconnect()
    resizeObserver = undefined
  })

  return { showNav, canPrev, canNext, scrollByStep }
}
