/**
 * 水平溢出滚动导航的共享纯逻辑（tabs / toolbar 三处复制的收敛，见 #17）。
 * 只提供无 Vue 依赖的计算与副作用，事件绑定 / ResizeObserver / watch 由各
 * composable 按需组合（三处的监听源与生命周期有真实差异，不强行统一）。
 */

/** 视口滚动几何（scrollTo 兼容 HTMLElement 与 vue 模板 ref） */
export interface OverflowNavViewport {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
}

export interface OverflowNavState {
  overflowing: boolean
  canPrev: boolean
  canNext: boolean
}

export function computeOverflowNavState(vp: OverflowNavViewport): OverflowNavState {
  const overflowing = vp.scrollWidth - vp.clientWidth > 1
  return {
    overflowing,
    canPrev: overflowing && vp.scrollLeft > 0,
    canNext: overflowing && vp.scrollLeft + vp.clientWidth < vp.scrollWidth - 1
  }
}

type ScrollableElement = OverflowNavViewport & {
  scrollTo(options: { left: number; behavior: 'smooth' }): void
}

export function scrollViewportByStep(vp: ScrollableElement, dir: 1 | -1): void {
  vp.scrollTo({ left: vp.scrollLeft + dir * vp.clientWidth * 0.8, behavior: 'smooth' })
}

export function scrollElementIntoView(vp: HTMLElement, el: HTMLElement, offset = 8): void {
  const vpRect = vp.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  if (elRect.left < vpRect.left) {
    vp.scrollTo({ left: vp.scrollLeft + (elRect.left - vpRect.left) - offset, behavior: 'smooth' })
  } else if (elRect.right > vpRect.right) {
    vp.scrollTo({
      left: vp.scrollLeft + (elRect.right - vpRect.right) + offset,
      behavior: 'smooth'
    })
  }
}

/**
 * 鼠标滚轮（纵向）驱动水平滚动；触控板横滑（已有 deltaX）不拦截。
 * navActive = 导航按钮是否可见（内容未溢出时不消费滚轮）。
 */
export function applyWheelHorizontalScroll(
  e: WheelEvent,
  vp: HTMLElement,
  navActive: boolean
): void {
  if (!navActive) return
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  if (e.deltaY === 0) return
  e.preventDefault()
  vp.scrollLeft += e.deltaY
}
