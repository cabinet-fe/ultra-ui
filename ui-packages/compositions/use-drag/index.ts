import { type Ref, type ShallowRef, watch, onBeforeUnmount } from 'vue'

interface DragOptions {
  /** 拖动目标 */
  target: ShallowRef<HTMLElement | undefined> | Ref<HTMLElement | undefined>
  /** 拖动开始 */
  onDragStart?(e: MouseEvent): void
  /** 拖动结束 */
  onDragEnd?(x: number, y: number, e: MouseEvent): void
  /** 拖动时 */
  onDrag?(x: number, y: number, e: MouseEvent): void
}

/**
 * 拖动组合式方法
 * @param options 拖动选项
 */
export function useDrag(options: DragOptions) {
  const { target, onDragStart, onDrag, onDragEnd } = options

  // 鼠标拖拽前的坐标
  let originX = 0
  let originY = 0

  let offsetX = 0
  let offsetY = 0

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

  const handleMousemove = (e: MouseEvent) => {
    offsetX = e.x - originX
    offsetY = e.y - originY

    onDrag?.(offsetX, offsetY, e)
  }

  const handleMouseup = (e: MouseEvent) => {
    document.removeEventListener('mousemove', handleMousemove)
    document.removeEventListener('mouseup', handleMouseup)
    onDragEnd?.(e.x - originX, e.y - originY, e)
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
}
