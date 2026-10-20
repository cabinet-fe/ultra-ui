import { type BEM, removeStyles, setStyles } from '@veltra/utils'
import { shallowRef, type ShallowRef } from 'vue'

interface Options {
  cls: BEM<'dialog'>
  dialogRef: ShallowRef<HTMLDivElement | undefined>
}

interface Returned {
  /** 是否为最大状态 */
  maximized: ShallowRef<boolean>
  /** 切换最大状态 */
  toggleMaximize: (maxim: boolean) => void
  /** 关闭对话框时清掉 FLIP 内联 transform，避免与 fade-scale / spring 的 scale 叠乘 */
  cancelMaximizeMotion: () => void
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

const ENTER_TO = 'dialog-maximize-enter-to'
const FLIP_MS = 250
const FLIP_TRANSITION = 'transform 250ms cubic-bezier(0.23, 1, 0.32, 1)'

function readRect(dom: HTMLElement): Rect {
  const r = dom.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/**
 * transform-origin 为 0 0。CSS 变换从右往左应用：
 * 先 scale，再 translate，把最大化后的布局框映回开始时的视觉矩形。
 */
function invert(from: Rect, to: Rect): string {
  const sx = to.width === 0 ? 1 : from.width / to.width
  const sy = to.height === 0 ? 1 : from.height / to.height
  const dx = from.left - to.left
  const dy = from.top - to.top
  return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
}

export function useMaximum(options: Options): Returned {
  const { dialogRef } = options
  const maximized = shallowRef(false)
  let flipToken = 0
  let flipTimer: ReturnType<typeof setTimeout> | undefined

  function clearFlip(dom: HTMLElement) {
    removeStyles(dom, ['transform', 'transform-origin', 'transition'])
  }

  function cancelMaximizeMotion() {
    flipToken += 1
    if (flipTimer !== undefined) {
      clearTimeout(flipTimer)
      flipTimer = undefined
    }
    const dom = dialogRef.value
    if (dom) clearFlip(dom)
  }

  function playFlip(dom: HTMLElement, from: Rect, to: Rect) {
    const token = ++flipToken
    if (flipTimer !== undefined) clearTimeout(flipTimer)

    const same =
      from.left === to.left &&
      from.top === to.top &&
      from.width === to.width &&
      from.height === to.height

    if (same || to.width === 0 || to.height === 0) {
      clearFlip(dom)
      return
    }

    setStyles(dom, { transformOrigin: '0 0', transform: invert(from, to), transition: 'none' })
    void dom.offsetWidth
    setStyles(dom, { transition: FLIP_TRANSITION, transform: 'none' })

    const finish = () => {
      if (token !== flipToken) return
      flipToken += 1
      if (flipTimer !== undefined) {
        clearTimeout(flipTimer)
        flipTimer = undefined
      }
      dom.removeEventListener('transitionend', onEnd)
      clearFlip(dom)
    }

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== dom || event.propertyName !== 'transform') return
      finish()
    }

    dom.addEventListener('transitionend', onEnd)
    flipTimer = setTimeout(finish, FLIP_MS + 50)
  }

  const toggleMaximize = (maxim: boolean): void => {
    maximized.value = maxim
    const dom = dialogRef.value
    if (!dom) return

    const from = readRect(dom)
    clearFlip(dom)
    dom.classList.toggle(ENTER_TO, maxim)
    const to = readRect(dom)
    playFlip(dom, from, to)
  }

  return { maximized, toggleMaximize, cancelMaximizeMotion }
}
