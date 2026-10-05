import { getCurrentScope, onScopeDispose } from 'vue'

/**
 * body / 任意容器滚动锁定（Dialog / Drawer / BottomSheet 等弹层共用）
 *
 * - body 用 `position: fixed` 定住页面（iOS Safari 下仅 `overflow: hidden`
 *   阻不住橡皮筋滚动），其余容器（设备外壳视口等）用 `overflow: hidden`
 *   并记录 `scrollTop`，解锁时还原滚动位置
 * - 计数嵌套：多个弹层叠加（或对不同元素）各自 `lock()`/`unlock()`，
 *   同一元素只有最外层解锁（计数归零）才还原样式与滚动位置
 */

/** body 锁定期间改写的内联样式属性，解锁时逐项还原为锁定前的值 */
const BODY_PROPS = ['position', 'top', 'left', 'width', 'overflow'] as const

interface ElementLock {
  count: number
  restore: () => void
}

/** 逐元素持有状态；不同元素互不影响（body 与自定义容器可同时被锁） */
const locks = new WeakMap<HTMLElement, ElementLock>()

function lockElement(el: HTMLElement): void {
  const held = locks.get(el)
  if (held) {
    held.count++
    return
  }

  if (el === document.body) {
    const prev = BODY_PROPS.map((prop) => [prop, el.style.getPropertyValue(prop)] as const)
    const scrollY = window.scrollY

    el.style.position = 'fixed'
    el.style.top = `-${scrollY}px`
    el.style.left = '0'
    el.style.width = '100%'
    el.style.overflow = 'hidden'

    locks.set(el, {
      count: 1,
      restore: () => {
        for (const [prop, value] of prev) el.style.setProperty(prop, value)
        window.scrollTo(0, scrollY)
      }
    })
    return
  }

  const prevOverflow = el.style.overflow
  const scrollTop = el.scrollTop
  el.style.overflow = 'hidden'

  locks.set(el, {
    count: 1,
    restore: () => {
      el.style.overflow = prevOverflow
      el.scrollTop = scrollTop
    }
  })
}

function unlockElement(el: HTMLElement): void {
  const held = locks.get(el)
  if (!held) return

  held.count--
  if (held.count === 0) {
    locks.delete(el)
    held.restore()
  }
}

export interface ScrollLock {
  /** 锁定目标元素滚动；可嵌套调用 */
  lock: () => void
  /** 解锁一层；未持有时为空操作 */
  unlock: () => void
}

/**
 * 按需解析锁定目标：元素可能在锁定的瞬间才注册/切换（设备外壳重挂载）。
 * 内部工厂，供弹层宿主（overlay-container）按各自目标派生锁，不进公开导出。
 */
export function createScrollLock(resolve: () => HTMLElement): ScrollLock {
  let target: HTMLElement | undefined

  const lock = () => {
    // 锁定期间目标变化（罕见）时先还原旧目标，避免永久锁死
    if (target) unlockElement(target)
    target = resolve()
    lockElement(target)
  }

  const unlock = () => {
    if (!target) return
    unlockElement(target)
    target = undefined
  }

  // 持锁期间组件被整体卸载（如外层 v-if 直接拔掉弹层）时兜底解锁
  if (getCurrentScope()) onScopeDispose(unlock)

  return { lock, unlock }
}

/** 锁定 body 滚动（公开 API），关闭后恢复原滚动位置 */
export function useScrollLock(): ScrollLock {
  return createScrollLock(() => document.body)
}
