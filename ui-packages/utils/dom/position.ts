import { setStyles } from './style'

interface Options {
  /** 触发元素 */
  triggerEl: HTMLElement
  /** 弹出元素 */
  popupEl: HTMLElement
  /** 间距 */
  gap?: number
}

function getWindowScrollTop() {
  let doc = document.documentElement
  return (window.scrollY || doc.scrollTop) - (doc.clientTop || 0)
}

function getWindowScrollLeft() {
  let doc = document.documentElement
  return (window.scrollX || doc.scrollLeft) - (doc.clientLeft || 0)
}

function getViewport() {
  let win = window,
    d = document,
    e = d.documentElement,
    g = document.body,
    w = win.innerWidth || e.clientWidth || g.clientWidth,
    h = win.innerHeight || e.clientHeight || g.clientHeight

  return { width: w, height: h }
}

interface DropdownPosition {
  top: string
  left: string
  width: string
  transformOrigin: string
}

/**
 * 计算下拉框位置
 * @param options 选项
 * @returns
 */
export function computeDropdownPosition(options: Options): DropdownPosition {
  const { triggerEl, popupEl, gap = 6 } = options

  const triggerRect = triggerEl.getBoundingClientRect()

  const windowScrollLeft = getWindowScrollLeft()
  const windowScrollTop = getWindowScrollTop()
  const viewport = getViewport()
  let top = triggerRect.top + triggerEl.offsetHeight + windowScrollTop + gap
  let left = triggerRect.left + windowScrollLeft

  let transformOrigin: 'top' | 'bottom' = 'top'

  if (top + popupEl.offsetHeight > window.innerHeight) {
    top = triggerRect.top + windowScrollTop - popupEl.offsetHeight - gap
    transformOrigin = 'bottom'
  }

  if (triggerRect.left + popupEl.offsetWidth > viewport.width) {
    left = Math.max(
      0,
      triggerRect.left +
        windowScrollLeft +
        triggerEl.offsetWidth -
        popupEl.offsetWidth
    )
  }

  return {
    top: top + 'px',
    left: left + 'px',
    width: triggerEl.offsetWidth + 'px',
    transformOrigin
  }
}
