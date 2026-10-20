/** 与 chip-group 样式里左右遮罩宽度一致。贴边纸片要滚出这层渐变才算完全可见。 */
export const CHIP_EDGE_FADE = 30

export interface ChipRevealMetrics {
  chipLeft: number
  chipRight: number
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
  fade: number
}

export function chipOverflowState(scrollLeft: number, clientWidth: number, scrollWidth: number) {
  return {
    maxScroll: Math.max(0, scrollWidth - clientWidth),
    start: scrollLeft > 0,
    end: scrollLeft + clientWidth < scrollWidth - 1
  }
}

/**
 * 纵向滚轮转横滚。
 * 返回 null 表示不处理：没溢出，或横轴位移已经更大（触控板横滑 / Shift）。
 * 横轴判定与 applyWheelHorizontalScroll 相同。leftover 是这一档用不到的 deltaY，交给页面纵向滚动。
 */
export function chipWheelScroll(
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
  deltaX: number,
  deltaY: number
): { left: number; leftover: number } | null {
  const { maxScroll } = chipOverflowState(scrollLeft, clientWidth, scrollWidth)
  if (maxScroll <= 1) return null
  if (Math.abs(deltaX) > Math.abs(deltaY)) return null
  if (deltaY === 0) return null
  const left = Math.min(maxScroll, Math.max(0, scrollLeft + deltaY))
  return { left, leftover: deltaY - (left - scrollLeft) }
}

/** 纸片是否完整落在可视区，且不压在左右渐变遮罩上。滚到起点/终点的那一侧没有遮罩。 */
export function isChipClear(metrics: ChipRevealMetrics): boolean {
  const { chipLeft, chipRight, scrollLeft, clientWidth, fade } = metrics
  const overflow = chipOverflowState(scrollLeft, clientWidth, metrics.scrollWidth)
  const clearLeft = scrollLeft + (overflow.start ? fade : 0)
  const clearRight = scrollLeft + clientWidth - (overflow.end ? fade : 0)
  return chipLeft >= clearLeft - 0.5 && chipRight <= clearRight + 0.5
}

/** 把纸片滚出遮罩所需的 scrollLeft。已经完全可见时返回当前 scrollLeft。 */
export function chipRevealScroll(metrics: ChipRevealMetrics): number {
  if (isChipClear(metrics)) return metrics.scrollLeft

  const { chipLeft, chipRight, scrollLeft, clientWidth, scrollWidth, fade } = metrics
  const overflow = chipOverflowState(scrollLeft, clientWidth, scrollWidth)
  const clearLeft = scrollLeft + (overflow.start ? fade : 0)
  const clearRight = scrollLeft + clientWidth - (overflow.end ? fade : 0)

  let next = scrollLeft
  if (chipLeft < clearLeft) next = chipLeft - fade
  else if (chipRight > clearRight) next = chipRight - clientWidth + fade

  if (next < 0.5) next = 0
  if (next > overflow.maxScroll - 0.5) next = overflow.maxScroll
  return next
}

export function chipRevealMetrics(
  chip: HTMLElement,
  viewport: HTMLElement,
  fade: number
): ChipRevealMetrics {
  const chipRect = chip.getBoundingClientRect()
  const viewRect = viewport.getBoundingClientRect()
  return {
    chipLeft: chipRect.left - viewRect.left + viewport.scrollLeft,
    chipRight: chipRect.right - viewRect.left + viewport.scrollLeft,
    scrollLeft: viewport.scrollLeft,
    clientWidth: viewport.clientWidth,
    scrollWidth: viewport.scrollWidth,
    fade
  }
}

export function scrollViewportTo(
  viewport: HTMLElement,
  left: number,
  behavior: ScrollBehavior
): Promise<void> {
  if (Math.abs(viewport.scrollLeft - left) < 1) return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      viewport.removeEventListener('scrollend', finish)
      resolve()
    }

    viewport.addEventListener('scrollend', finish)
    viewport.scrollTo({ left, behavior })
    // auto（prefers-reduced-motion）会同步改 scrollLeft，不必再等 scrollend
    if (Math.abs(viewport.scrollLeft - left) < 1) finish()
  })
}
