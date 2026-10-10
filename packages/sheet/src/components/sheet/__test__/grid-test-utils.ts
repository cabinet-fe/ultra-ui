/**
 * SheetGrid 测试几何与事件工具。几何口径与官方 `infinitable/sheet` 的
 * grid-theme 取值一致：行号列宽 46、列头高 28、列宽 80、行高 28。
 */

const ROW_HEADER_WIDTH = 46
const HEADER_HEIGHT = 28
const DEFAULT_COL_WIDTH = 80
const DEFAULT_ROW_HEIGHT = 28

/** 数据格 (col, row) 的层坐标（+5 落在格内而非边线上） */
export const cellX = (col: number) => ROW_HEADER_WIDTH + col * DEFAULT_COL_WIDTH + 5
export const cellY = (row: number) => HEADER_HEIGHT + row * DEFAULT_ROW_HEIGHT + 5

/**
 * 引擎指针事件派发目标：body 层画布。引擎事件源在 canvas 档是挂载容器、
 * 原生档（scrollbar.mode: 'native'）是滚动容器内的 sticky 视口——body 画布
 * 在两档下都是其后代，从它派发（冒泡）对两种形态都到达引擎监听。
 */
export function gridEventTarget(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>(".u-sheet__grid-instance canvas[data-layer-kind='body']")!
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
