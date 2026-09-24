import type { ListTable, SelectionSnapshot } from '@infinite-table/core'

import { Sheet } from '../../core/sheet'
import { SHEET_HEADER_HEIGHT, SHEET_ROW_HEADER_WIDTH } from '../grid-theme'
import { SheetGrid, type SheetGridOptions } from '../sheet-grid'

/** 测试视口尺寸（显式给定，绕开 happy-dom 无布局测量） */
export const VIEW_W = 800
export const VIEW_H = 600

/** 数据格 (col, row) 的层坐标（几何：行号列 46、列头 28、列宽 80、行高 28） */
export const cellX = (col: number) => SHEET_ROW_HEADER_WIDTH + col * 80 + 5
export const cellY = (row: number) => SHEET_HEADER_HEIGHT + row * 28 + 5

export interface CreatedGrid {
  grid: SheetGrid
  table: ListTable
  container: HTMLElement
  sheet: Sheet
}

/** 挂载 SheetGrid（容器入 DOM + 显式视口尺寸）；rows/cols 缺省 20×6 */
export function createGrid(options: Partial<SheetGridOptions> = {}): CreatedGrid {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const sheet = options.sheet ?? new Sheet()
  const grid = new SheetGrid({
    container,
    sheet,
    rows: options.rows ?? 20,
    cols: options.cols ?? 6,
    width: VIEW_W,
    height: VIEW_H,
    ...options
  })
  return { grid, table: grid.getTable(), container, sheet }
}

/** 向容器派发 DOM 指针类事件（引擎 EventSystem 归一化为场景事件） */
export function fire(
  container: HTMLElement,
  type: string,
  init: {
    clientX?: number
    clientY?: number
    button?: number
    bubbles?: boolean
    ctrlKey?: boolean
    shiftKey?: boolean
  } = {}
): void {
  const event = new MouseEvent(type, {
    bubbles: init.bubbles ?? true,
    cancelable: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    button: init.button ?? 0,
    ctrlKey: init.ctrlKey ?? false,
    shiftKey: init.shiftKey ?? false
  })
  container.dispatchEvent(event)
}

/** 等待微任务队列排空（适配层 resync / 浮动图同步走 queueMicrotask） */
export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

/** 读引擎当前选区快照（单段断言便捷形态） */
export function firstRange(snapshot: SelectionSnapshot): SelectionSnapshot['ranges'][number] {
  const range = snapshot.ranges[0]
  if (!range) throw new Error('选区为空')
  return range
}
