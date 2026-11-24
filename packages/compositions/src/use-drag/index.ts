import { type Ref, type ShallowRef, watch, onBeforeUnmount } from 'vue'

interface DragParams {
  /** 本次拖动水平距离 */
  x: number
  /** 本次拖动垂直距离 */
  y: number
  offsetX: number
  offsetY: number
  e: MouseEvent
}

interface DragOptions {
  target: ShallowRef<HTMLElement | undefined | null> | Ref<HTMLElement | undefined | null>
  onDragStart?(e: MouseEvent): void
  onDragEnd?(params: DragParams): void
  onDrag?(params: DragParams): void
  rangeX?: [number, number]
  rangeY?: [number, number]
  initial?: { offsetX?: number; offsetY?: number }
}

export function useDrag(options: DragOptions): {
  update: (options: { offsetX?: number; offsetY?: number }) => void
} {
  const { target, onDragStart, onDrag, onDragEnd, rangeX, rangeY, initial } = options

  let originX = 0
  let originY = 0

  let offsetX = initial?.offsetX ?? 0
  let offsetY = initial?.offsetY ?? 0

  const dragParams: DragParams = { x: 0, y: 0, offsetX: 0, offsetY: 0, e: null as any }

  const onselectstart = document.onselectstart

  const handleMousedown = (e: MouseEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return
    window.getSelection()?.removeAllRanges()
    e.stopImmediatePropagation()

    originX = e.x
    originY = e.y

    onDragStart?.(e)

    // 禁止浏览器的选中事件, 直到mouseup事件触发时还原
    document.onselectstart = () => false
    document.addEventListener('mousemove', handleMousemove, { passive: true })
    document.addEventListener('mouseup', handleMouseup)
  }

  const getOffsetXWithRange = (deltaX: number) => {
    return Math.max(rangeX![0], Math.min(rangeX![1], offsetX + deltaX))
  }

  const getOffsetXWithoutRange = (deltaX: number) => {
    return offsetX + deltaX
  }

  const getOffsetYWithRange = (deltaY: number) => {
    return Math.max(rangeY![0], Math.min(rangeY![1], offsetY + deltaY))
  }

  const getOffsetYWithoutRange = (deltaY: number) => {
    return offsetY + deltaY
  }

  const getOffsetX = rangeX ? getOffsetXWithRange : getOffsetXWithoutRange
  const getOffsetY = rangeY ? getOffsetYWithRange : getOffsetYWithoutRange

  // 避免重复创建对象影响内存占用
  const setDragParam = (e: MouseEvent) => {
    dragParams.x = e.x - originX
    dragParams.y = e.y - originY
    dragParams.offsetX = getOffsetX(dragParams.x)
    dragParams.offsetY = getOffsetY(dragParams.y)
    dragParams.e = e
  }

  const handleMousemove = (e: MouseEvent) => {
    setDragParam(e)
    onDrag?.(dragParams)
  }

  const handleMouseup = (e: MouseEvent) => {
    setDragParam(e)
    offsetX = dragParams.offsetX
    offsetY = dragParams.offsetY

    onDragEnd?.(dragParams)
    document.onselectstart = onselectstart

    cleanup()
  }

  const cleanup = () => {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
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
    cleanup()
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
