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
export function useDrag(options: DragOptions): {
  update: (options: { offsetX?: number; offsetY?: number }) => void
} {
  const { target, onDragStart, onDrag, onDragEnd, rangeX, rangeY, initial } =
    options

  // 鼠标拖拽前的坐标
  let originX = 0
  let originY = 0

  let offsetX = initial?.offsetX ?? 0
  let offsetY = initial?.offsetY ?? 0

  // 拖拽参数
  const dragParams: DragParams = {
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    e: null as any
  }

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

  // 统一的清理函数
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
