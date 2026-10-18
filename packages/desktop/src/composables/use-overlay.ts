import { nextTick, onScopeDispose, watch } from 'vue'

/** 遮罩层通用行为配置 */
export interface UseOverlayOptions {
  /** 当前是否处于打开状态 */
  visible: () => boolean
  /** 遮罩面板元素，用于初始聚焦与焦点圈 */
  panel: () => HTMLElement | undefined
  /** 关闭回调 */
  onClose: () => void
  /** 是否允许按 Esc 关闭，缺省允许 */
  closeOnEsc?: () => boolean
  /** 是否锁定 body 滚动，缺省锁定 */
  lockScroll?: () => boolean
  /** 是否把焦点限制在面板内，缺省限制 */
  trapFocus?: () => boolean
}

/** 面板内可聚焦元素选择器 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

/** 收集面板内可聚焦元素 */
function getFocusableElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    return el.getAttribute('aria-hidden') !== 'true' && el.tabIndex >= 0
  })
}

// body 滚动锁采用模块级计数，支持多个遮罩层嵌套打开
let lockCount = 0
let originalOverflow = ''
let originalPaddingRight = ''

/** 锁定 body 滚动 */
function lockBodyScroll(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  lockCount += 1
  if (lockCount > 1) return

  const { body, documentElement } = document
  originalOverflow = body.style.overflow
  originalPaddingRight = body.style.paddingRight

  // 滚动条消失会让页面右移，用等宽 padding 补偿
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth
  if (scrollbarWidth > 0) {
    const paddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${paddingRight + scrollbarWidth}px`
  }

  body.style.overflow = 'hidden'
}

/** 解除 body 滚动锁 */
function unlockBodyScroll(): void {
  if (typeof document === 'undefined' || lockCount === 0) return

  lockCount -= 1
  if (lockCount > 0) return

  document.body.style.overflow = originalOverflow
  document.body.style.paddingRight = originalPaddingRight
  originalOverflow = ''
  originalPaddingRight = ''
}

/** 已打开的遮罩层栈，按打开顺序排列 */
const overlayStack: symbol[] = []

/**
 * 遮罩层通用行为：Esc 关闭、body 滚动锁、焦点圈与焦点恢复。
 * 仅包内部使用，不对外导出。
 */
export function useOverlay(options: UseOverlayOptions): void {
  const stackToken = Symbol('overlay')

  let listening = false
  let stacked = false
  let scrollLocked = false
  let previousActive: HTMLElement | null = null
  let openToken = 0

  const isCloseOnEsc = () => options.closeOnEsc?.() ?? true
  const isLockScroll = () => options.lockScroll?.() ?? true
  const isTrapFocus = () => options.trapFocus?.() ?? true
  const isTopmost = () => overlayStack[overlayStack.length - 1] === stackToken

  function pushStack(): void {
    if (stacked) return
    overlayStack.push(stackToken)
    stacked = true
  }

  function popStack(): void {
    if (!stacked) return
    const index = overlayStack.indexOf(stackToken)
    if (index !== -1) overlayStack.splice(index, 1)
    stacked = false
  }

  function handleKeydown(event: KeyboardEvent): void {
    // 多层遮罩叠加时只由最上层响应，避免一次 Esc 连关多层
    if (!options.visible() || !isTopmost()) return

    if (event.key === 'Escape') {
      if (event.defaultPrevented || !isCloseOnEsc()) return
      options.onClose()
      return
    }

    if (event.key !== 'Tab' || !isTrapFocus()) return

    const panel = options.panel()
    if (!panel) return

    const focusables = getFocusableElements(panel)
    if (!focusables.length) {
      event.preventDefault()
      panel.focus()
      return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return

    const active = document.activeElement
    const inside = active ? panel.contains(active) : false

    // 焦点不在面板内或落在面板本身时，按 Tab 方向拉回两端
    if (!inside || active === panel) {
      event.preventDefault()
      const target = event.shiftKey ? last : first
      target.focus()
      return
    }

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function addKeydownListener(): void {
    if (listening || typeof document === 'undefined') return
    document.addEventListener('keydown', handleKeydown)
    listening = true
  }

  function removeKeydownListener(): void {
    if (!listening || typeof document === 'undefined') return
    document.removeEventListener('keydown', handleKeydown)
    listening = false
  }

  /** 把焦点移入面板：优先第一个可聚焦元素，否则面板自身 */
  function focusPanel(): void {
    const panel = options.panel()
    if (!panel) return
    const target = getFocusableElements(panel)[0] ?? panel
    target.focus()
  }

  /** 恢复打开前的焦点 */
  function restoreFocus(): void {
    if (!previousActive) return
    const target = previousActive
    previousActive = null
    if (target.isConnected) target.focus()
  }

  watch(
    options.visible,
    async (visible) => {
      if (!visible) {
        removeKeydownListener()
        popStack()
        restoreFocus()
        return
      }

      if (typeof document === 'undefined') return

      pushStack()
      addKeydownListener()

      // 非模态遮罩不做焦点圈：不抢焦点，也不在关闭时回焦
      if (!isTrapFocus()) return

      const active = document.activeElement
      previousActive = active instanceof HTMLElement && active !== document.body ? active : null

      const token = ++openToken
      await nextTick()

      // 打开后立即关闭（或再次打开）时不再抢焦点
      if (token !== openToken || !options.visible()) return
      focusPanel()
    },
    { immediate: true }
  )

  watch(
    () => options.visible() && isLockScroll(),
    (locked) => {
      if (locked === scrollLocked) return
      scrollLocked = locked
      if (locked) lockBodyScroll()
      else unlockBodyScroll()
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    removeKeydownListener()
    popStack()
    if (scrollLocked) {
      scrollLocked = false
      unlockBodyScroll()
    }
  })
}
