import { getCurrentScope, onScopeDispose } from 'vue'

/**
 * body 滚动锁定（Dialog / Drawer / BottomSheet 等弹层共用）
 *
 * - 锁定用 body `position: fixed` 定住页面（iOS Safari 下仅 `overflow: hidden`
 *   阻不住橡皮筋滚动），并记录原内联样式与滚动位置
 * - 计数嵌套：多个弹层叠加时各自 `lock()`/`unlock()`，只有最外层解锁
 *   （计数归零）才还原 body 样式并 `scrollTo` 回原滚动位置
 */

/** 锁定期间改写的 body 内联样式属性，解锁时逐项还原为锁定前的值 */
const LOCKED_PROPS = ['position', 'top', 'left', 'width', 'overflow'] as const

let lockCount = 0
let restoreBody: (() => void) | null = null

function lockBody(): void {
  lockCount++
  if (lockCount > 1) return

  const body = document.body
  const prev = LOCKED_PROPS.map((prop) => [prop, body.style.getPropertyValue(prop)] as const)
  const scrollY = window.scrollY

  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.left = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'

  restoreBody = () => {
    for (const [prop, value] of prev) body.style.setProperty(prop, value)
    restoreBody = null
    window.scrollTo(0, scrollY)
  }
}

function unlockBody(): void {
  if (lockCount === 0) return
  lockCount--
  if (lockCount === 0) restoreBody?.()
}

export interface ScrollLock {
  /** 锁定 body 滚动；可嵌套调用 */
  lock: () => void
  /** 解锁一层；未持有时为空操作 */
  unlock: () => void
}

export function useScrollLock(): ScrollLock {
  let held = false

  const lock = () => {
    lockBody()
    held = true
  }

  const unlock = () => {
    if (!held) return
    held = false
    unlockBody()
  }

  // 持锁期间组件被整体卸载（如外层 v-if 直接拔掉弹层）时兜底解锁
  if (getCurrentScope()) onScopeDispose(unlock)

  return { lock, unlock }
}
