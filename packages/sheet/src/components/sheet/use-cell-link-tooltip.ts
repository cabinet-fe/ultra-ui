import type { CellLinkHoverEvent } from 'infinitable'
import { shallowRef } from 'vue'

/**
 * tooltip 相对悬停落点的偏移：右下错开，浮层不遮指针与命中的链接文本。
 */
const TOOLTIP_OFFSET_X = 8
const TOOLTIP_OFFSET_Y = 20

/** 悬停链接格 tooltip 的视图状态（url + 相对 grid 区的绝对定位坐标） */
export interface CellLinkTooltipState {
  /** 展示的链接 URL */
  url: string
  /** 浮层左边（层坐标 + 偏移，单位 px；grid 区内绝对定位） */
  left: number
  /** 浮层顶边（层坐标 + 偏移，单位 px） */
  top: number
}

/**
 * 单元格超链接悬停 tooltip（引擎 hover/leave 事件驱动）：
 * hover 时记录命中的层坐标 + URL（层坐标相对 grid 实例容器 = grid 区原点，
 * 渲染层直接在 grid 区内绝对定位挂载浮层）；leave 时卸载（置 null）。
 * 事件源接线在 use-sheet-grid（与 cell-link-hover/leave 组件 emit 同源）。
 */
export function useCellLinkTooltip() {
  const tooltip = shallowRef<CellLinkTooltipState | null>(null)

  function onCellLinkHover(event: CellLinkHoverEvent): void {
    tooltip.value = {
      url: event.url,
      left: event.x + TOOLTIP_OFFSET_X,
      top: event.y + TOOLTIP_OFFSET_Y
    }
  }

  function onCellLinkLeave(): void {
    tooltip.value = null
  }

  return { tooltip, onCellLinkHover, onCellLinkLeave }
}
