import { createScrollLock } from '../../shared/use-scroll-lock'
import type { ScrollLock } from '../../shared/use-scroll-lock'

/**
 * 弹层宿主容器（内部机制，不进公开导出）
 *
 * 设备外壳等嵌入场景把承载元素注册进来，底部弹层 / 对话框 / 抽屉 / 函数式消息
 * 改挂到该元素内，随容器一起定位与缩放；未注册时行为不变（挂 body）。
 *
 * `scrollLockEl` 是背景滚动锁定的目标：挂载层自身通常不滚动（弹层不随内容
 * 滚动），真正滚动的是与其并列的内容视口，注册时需一并传入；缺省回落到
 * 挂载元素（未注册时即 body）。
 */
let container: HTMLElement | undefined
let scrollLockEl: HTMLElement | undefined

export function setOverlayContainer(el: HTMLElement | undefined, scrollEl?: HTMLElement): void {
  container = el
  scrollLockEl = scrollEl
}

export function getOverlayContainer(): HTMLElement {
  return container ?? document.body
}

/**
 * 弹层背景滚动锁（Dialog / Drawer / BottomSheet 共用）
 *
 * 打开期间锁定（未注册宿主时锁 body，注册设备外壳时锁其内容视口），
 * 完全关闭后由组件调用 `unlock()` 还原滚动位置；嵌套弹层计数叠加。
 */
export function useOverlayScrollLock(): ScrollLock {
  return createScrollLock(() => scrollLockEl ?? getOverlayContainer())
}
