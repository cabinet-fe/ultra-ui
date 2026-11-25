import { nextTick, ref } from 'vue'

export interface UseStickScrollOptions {
  /** 滚动控制器（UScroll 暴露实例等带 scrollTo 的对象） */
  getScroller: () => { scrollTo: (position: { y: number }) => void } | undefined
  /** 触底判定阈值（px）：距底小于该值视为已到底，恢复吸附 */
  bottomThreshold: number
  /**
   * 是否按滚动方向解除吸附。消息列表需要：流式内容增长引发的自动吸底 scroll 事件
   * 位置可能滞后（sh 已变大、y 仍是旧底部），只有「向上滚」才算用户离开底部的意图。
   * 区内滚动（思考块）内容不会在头部方向增长，可直接按位置判定，无需方向感知。
   */
  directionAware?: boolean
}

/**
 * 「吸底滚动」共享内核：流式内容增长时保持贴底展示最新输出，
 * 用户上翻立即取消吸附、回到底部后自动恢复。
 * 外壳（展示回底按钮、内容 watcher 触发滚动等）由使用方各自保留。
 */
export function useStickScroll(options: UseStickScrollOptions) {
  const { getScroller, bottomThreshold, directionAware = false } = options

  /** 是否吸附底部 */
  const stuck = ref(true)
  /** 上一次滚动位置：directionAware 模式下用于识别向上滚 */
  let lastY = 0

  /** scroll 事件处理：触底恢复吸附；directionAware 时仅向上滚解除吸附 */
  const handleScroll = (position: { y: number; sh: number; ch: number }) => {
    const { y, sh, ch } = position
    if (sh - ch - y < bottomThreshold) {
      stuck.value = true
    } else if (directionAware && y < lastY) {
      stuck.value = false
    }
    lastY = y
  }

  /**
   * 用户向上滚动轮 = 明确的离开底部意图，立即取消吸附。
   * 不能等 scroll 事件再按方向判断：流式期间每个 chunk 都会排一次吸底滚动，
   * 滞后的 scrollTo 会把用户拉回底部并触发触底重新吸附，导致「上滚动不了」。
   */
  const handleWheel = (e: WheelEvent) => {
    if (e.deltaY < 0) stuck.value = false
  }

  /**
   * 吸附时滚到底部。等待 DOM 更新期间用户可能已上滚，
   * 滚动前二次确认吸附状态，避免把用户拉回底部。
   * 返回是否执行了滚动。
   */
  const scrollToBottomIfStuck = async (): Promise<boolean> => {
    if (!stuck.value) return false
    await nextTick()
    if (!stuck.value) return false
    getScroller()?.scrollTo({ y: Number.MAX_SAFE_INTEGER })
    return true
  }

  return { stuck, handleScroll, handleWheel, scrollToBottomIfStuck }
}
