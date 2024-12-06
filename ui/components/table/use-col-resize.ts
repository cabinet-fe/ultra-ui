import { nextTick, provide, shallowRef, type ShallowRef } from 'vue'
import { TableResizeKey } from './di'
import type { ScrollExposed } from '@ui/types/components/scroll'
import type { ColumnNode } from './use-columns'
import { useResizeObserver } from '@ui/compositions'

interface Options {
  scrollRef: ShallowRef<ScrollExposed | undefined>
  leafColumns: ShallowRef<ColumnNode[]>
}

export function useColResize(options: Options) {
  const { scrollRef, leafColumns } = options

  const showResizeLine = shallowRef(false)

  const resizeLineRef = shallowRef<HTMLElement>()
  const colgroupRef = shallowRef<HTMLElement>()
  const headerRef = shallowRef<HTMLElement>()

  /**
   * 修正列样式
   */
  function correctColumnStyle() {
    const cols = Array.from(colgroupRef.value?.children ?? []) as HTMLElement[]
    leafColumns.value.forEach((column, i, arr) => {
      column.width = cols[i]!.offsetWidth
    })

    const fixedLeft = leafColumns.value.filter(
      column => column.fixed === 'left'
    )
    const fixedRight = leafColumns.value.filter(
      column => column.fixed === 'right'
    )

    fixedLeft.reduce((acc, cur) => {
      cur.style.left = acc
      return acc + (cur.width ?? 0)
    }, 0)

    fixedRight.reduceRight((acc, cur) => {
      cur.style.right = acc
      return acc + (cur.width ?? 0)
    }, 0)
  }

  function updateResizeLine(transformX: number) {
    if (!resizeLineRef.value) return
    resizeLineRef.value.style.transform = `translateX(${transformX}px)`
  }

  // 表格相对于页面左边缘的偏移量，
  // 此处作为缓存以减少频繁地调用 getBoundingClientRect 方法
  let containerLeft = 0
  let originX = 0
  let originWidth = 0
  let currentResizeColumn: ColumnNode | null = null

  function handleResizeMousedown(e: MouseEvent, resizeColumn: ColumnNode) {
    const tableEl = scrollRef.value?.el
    if (!tableEl) return

    showResizeLine.value = true
    currentResizeColumn = resizeColumn
    originX = e.pageX
    originWidth = resizeColumn.width ?? 0

    const { left } = tableEl.getBoundingClientRect()
    containerLeft = left

    nextTick(() => {
      updateResizeLine(e.pageX - left)
    })

    document.addEventListener('mousemove', handleResizeMousemove)
    document.addEventListener('mouseup', handleResizeMouseup)
  }

  function handleResizeMousemove(e: MouseEvent) {
    updateResizeLine(e.pageX - containerLeft)
  }

  function handleResizeMouseup(e: MouseEvent) {
    currentResizeColumn!.width = Math.max(
      originWidth + e.pageX - originX,
      currentResizeColumn!.minWidth ?? 0
    )

    nextTick(() => {
      correctColumnStyle()
      showResizeLine.value = false
      currentResizeColumn = null
    })

    document.removeEventListener('mouseup', handleResizeMouseup)
    document.removeEventListener('mousemove', handleResizeMousemove)
  }

  // 重置列中的的宽度信息
  useResizeObserver({
    targets: headerRef,
    onResize() {
      if (showResizeLine.value) return
      correctColumnStyle()
    }
  })

  provide(TableResizeKey, {
    handleResizeMousedown,
    headerRef
  })

  return {
    resizeLineRef,
    colgroupRef,
    showResizeLine,
    handleResizeMousedown
  }
}
