import { useResizeObserver } from '@veltra/compositions'
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
 * 水平标签栏的溢出滚动逻辑：
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
    const { scrollLeft, scrollWidth, clientWidth } = vp
    const overflowing = scrollWidth - clientWidth > 1
    showNav.value = overflowing
    canPrev.value = overflowing && scrollLeft > 0
    canNext.value = overflowing && scrollLeft + clientWidth < scrollWidth - 1
  }

  /** 箭头按钮：按视口宽度 80% 的步长平滑滚动 */
  const scrollByStep = (dir: 1 | -1) => {
    const vp = viewportRef.value
    if (!vp) return
    vp.scrollTo({ left: vp.scrollLeft + dir * vp.clientWidth * 0.8, behavior: 'smooth' })
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

    const vpRect = vp.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    if (elRect.left < vpRect.left) {
      vp.scrollTo({ left: vp.scrollLeft + (elRect.left - vpRect.left) - 8, behavior: 'smooth' })
    } else if (elRect.right > vpRect.right) {
      vp.scrollTo({ left: vp.scrollLeft + (elRect.right - vpRect.right) + 8, behavior: 'smooth' })
    }
  }

  /** 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截 */
  const handleWheel = (e: WheelEvent) => {
    if (!showNav.value) return
    const vp = viewportRef.value
    if (!vp) return
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    if (e.deltaY === 0) return
    e.preventDefault()
    vp.scrollLeft += e.deltaY
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
