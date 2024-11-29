import { type Ref, type ShallowRef, watch, onBeforeUnmount } from 'vue'

interface DragParams {
  /** 本次拖动水平距离 */
  x: number
  /** 本次拖动垂直距离 */
  y: number
  /** 拖拽目标水平偏移量 */
  offsetX: number
  /** 拖拽目标垂直偏移量 */
  offsetY: number
  /** 鼠标事件 */
  e: MouseEvent
}

interface DragOptions {
  /** 拖动目标 */
  target:
    | ShallowRef<HTMLElement | undefined | null>
    | Ref<HTMLElement | undefined | null>
  /** 拖动开始 */
  onDragStart?(e: MouseEvent): void
  /** 拖动结束 */
  onDragEnd?(params: DragParams): void
  /** 拖动时 */
  onDrag?(params: DragParams): void
  /** 水平拖动范围 */
  rangeX?: [number, number]
  /** 垂直拖动范围 */
  rangeY?: [number, number]
  /** 初始偏移量 */
  initial?: {
    offsetX?: number
    offsetY?: number
  }
}

/**
 * 拖动组合式方法
 * @param options 拖动选项
 */
export function useDrag(options: DragOptions) {
  const { target, onDragStart, onDrag, onDragEnd, rangeX, rangeY, initial } =
    options

  // 鼠标拖拽前的坐标
  let originX = 0
  let originY = 0

  let offsetX = initial?.offsetX ?? 0
  let offsetY = initial?.offsetY ?? 0

  // 先取
  const onselectstart = document.onselectstart

  const handleMousedown = (e: MouseEvent) => {
    // 阻止事件冒泡
    e.stopPropagation()
    // 鼠标左键按下有效
    if (e.button !== 0) return
    // 放置拖拽时选择内容
    window.getSelection()?.removeAllRanges()
    // 阻止后续的事件监听器被执行
    e.stopImmediatePropagation()

    originX = e.x
    originY = e.y

    onDragStart?.(e)

    // 禁止浏览器的选中事件, 直到mouseup事件触发时还原
    document.onselectstart = () => false
    document.addEventListener('mousemove', handleMousemove, {
      passive: true
    })
    document.addEventListener('mouseup', handleMouseup)
  }

  const getOffset = (e: MouseEvent) => {
    let _offsetX = offsetX + e.x - originX
    let _offsetY = offsetY + e.y - originY

    // 范围修正
    if (rangeX) {
      _offsetX = Math.max(rangeX[0], Math.min(rangeX[1], _offsetX))
    }
    if (rangeY) {
      _offsetY = Math.max(rangeY[0], Math.min(rangeY[1], _offsetY))
    }

    return {
      offsetX: _offsetX,
      offsetY: _offsetY
    }
  }

  const handleMousemove = (e: MouseEvent) => {
    onDrag?.({
      x: e.x - originX,
      y: e.y - originY,
      ...getOffset(e),
      e
    })
  }

  const handleMouseup = (e: MouseEvent) => {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
    const draggedX = e.x - originX
    const draggedY = e.y - originY

    const offset = getOffset(e)

    offsetX = offset.offsetX
    offsetY = offset.offsetY

    onDragEnd?.({
      x: draggedX,
      y: draggedY,
      offsetX,
      offsetY,
      e
    })
    document.onselectstart = onselectstart
  }

  watch(
    target,
    (dom, oldDom) => {
      oldDom?.removeEventListener('mousedown', handleMousedown)
      if (!dom) return
      dom.addEventListener('mousedown', handleMousedown)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    target.value?.removeEventListener('mousedown', handleMousedown)
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
  })

  return {
    update(options: { offsetX?: number; offsetY?: number }) {
      if (options.offsetX !== undefined) {
        offsetX = options.offsetX
      }
      if (options.offsetY !== undefined) {
        offsetY = options.offsetY
      }
    }
  }
}
