import { nextTick, provide, shallowRef, watchEffect, type ShallowRef } from 'vue'

import type { ScrollExposed } from '../../types'
import { allocateLeafColumnWidths } from './allocate-column-widths'
import { TableResizeKey } from './di'
import type { ColumnNode } from './node/col'

interface Options {
  scrollRef: ShallowRef<ScrollExposed | undefined>
  leafColumns: ShallowRef<ColumnNode[]>
}

interface UseColResizeReturned {
  resizeLineRef: ShallowRef<HTMLElement | undefined>
  colgroupRef: ShallowRef<HTMLElement | undefined>
  showResizeLine: ShallowRef<boolean>
  handleResizeMousedown: (e: MouseEvent, resizeColumn: ColumnNode) => void
}

export function useColResize(options: Options): UseColResizeReturned {
  const { scrollRef, leafColumns } = options

  const showResizeLine = shallowRef(false)

  const resizeLineRef = shallowRef<HTMLElement>()
  const colgroupRef = shallowRef<HTMLElement>()
  const headerRef = shallowRef<HTMLElement>()

  /**
   * 修正列样式
   */
  function correctColumnStyle() {
    // 获取表格容器宽度
    const containerWidth = scrollRef.value?.containerRef?.clientWidth

    if (!containerWidth || !leafColumns.value.length) return

    allocateLeafColumnWidths(leafColumns.value, containerWidth)

    const fixedLeft = leafColumns.value.filter((column) => column.fixed === 'left')
    const fixedRight = leafColumns.value.filter((column) => column.fixed === 'right')

    fixedLeft.reduce((acc, cur) => {
      cur.style.left = acc
      return acc + (cur.width ?? cur.minWidth!)
    }, 0)

    fixedRight.reduceRight((acc, cur) => {
      cur.style.right = acc
      return acc + (cur.width ?? cur.minWidth!)
    }, 0)
  }

  watchEffect(correctColumnStyle)

  function updateResizeLine(transformX: number): void {
    if (!resizeLineRef.value) return
    resizeLineRef.value.style.transform = `translateX(${transformX}px)`
  }

  // 表格相对于页面左边缘的偏移量，
  // 此处作为缓存以减少频繁地调用 getBoundingClientRect 方法
  let containerLeft = 0
  let originX = 0
  let originWidth = 0
  let currentResizeColumn: ColumnNode | null = null

  function handleResizeMousedown(e: MouseEvent, resizeColumn: ColumnNode): void {
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

  function handleResizeMousemove(e: MouseEvent): void {
    updateResizeLine(e.pageX - containerLeft)
  }

  function handleResizeMouseup(e: MouseEvent): void {
    currentResizeColumn!.width = Math.max(
      originWidth + e.pageX - originX,
      currentResizeColumn!.minWidth!
    )
    currentResizeColumn!.explicitWidth = true

    showResizeLine.value = false
    currentResizeColumn = null
    correctColumnStyle()

    document.removeEventListener('mouseup', handleResizeMouseup)
    document.removeEventListener('mousemove', handleResizeMousemove)
  }

  provide(TableResizeKey, { handleResizeMousedown, headerRef })

  return { resizeLineRef, colgroupRef, showResizeLine, handleResizeMousedown }
}
