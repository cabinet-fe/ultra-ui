import { onBeforeUnmount, shallowRef } from 'vue'

import type { TipAlign } from '../../types'

interface Options {
  /** 单元格选择器，事件委托用 */
  cellSelector: string
  /** 是否启用 */
  enabled: () => boolean
  /** 显示延迟（毫秒），避免鼠标快速掠过时闪烁 */
  delay?: number
}

/** 列对齐 → tip 横向对齐，让提示跟单元格文字对齐方式一致 */
const ALIGN_MAP: Record<string, TipAlign> = { left: 'start', center: 'center', right: 'end' }

/**
 * 单元格文本提示：整表只挂一个 tip，事件委托到根节点，不给每个单元格包 tip。
 * 不判断文本是否真的溢出——开了省略号就展示完整内容，省掉每次悬停的测量开销。
 */
export function useCellTip({ cellSelector, enabled, delay = 0 }: Options) {
  const visible = shallowRef(false)
  const trigger = shallowRef<HTMLElement>()
  const content = shallowRef('')
  const align = shallowRef<TipAlign>('center')

  /** 上次悬停的单元格：在单元格内部子元素间移动时早退，避免提示闪烁 */
  let hoverCell: HTMLElement | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  const hide = () => {
    clearTimeout(timer)
    visible.value = false
  }

  const handleMouseover = (e: MouseEvent) => {
    if (!enabled()) return

    const target = e.target
    if (!(target instanceof Element)) return

    const cell = target.closest<HTMLElement>(cellSelector)
    if (cell === hoverCell) return
    hoverCell = cell

    if (!cell) return hide()

    // 跨列单元格（展开行）装的是整块自定义内容，textContent 拼起来没有意义
    const spanning = cell instanceof HTMLTableCellElement && cell.colSpan > 1
    const text = spanning ? '' : cell.textContent?.trim()
    if (!text) return hide()

    // 列的 align 已反映在单元格的 is-left / is-center / is-right 类上
    const match = cell.className.match(/is-(left|center|right)/)
    align.value = ALIGN_MAP[match?.[1] ?? ''] ?? 'center'

    const show = () => {
      trigger.value = cell
      content.value = text
      visible.value = true
    }
    clearTimeout(timer)
    // 已经弹出或未配置延迟时直接跟随鼠标，不必等待
    if (delay <= 0 || visible.value) show()
    else timer = setTimeout(show, delay)
  }

  const handleMouseleave = () => {
    hoverCell = null
    hide()
  }

  onBeforeUnmount(() => clearTimeout(timer))

  return { visible, trigger, content, align, handleMouseover, handleMouseleave }
}
