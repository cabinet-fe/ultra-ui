/**
 * 获取可滚动的父级（纵向或横向可滚动均计入：overflow-x 容器如横向滚动条
 * 也是滚动父级，弹层需监听其 scroll 事件）
 * @param el 元素
 * @returns
 */
export function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = []
  let parent = el.parentElement
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
      parents.push(parent)
    }

    parent = parent.parentElement
  }
  return parents
}

/**
 * 获取最近的可滚动父级（纵向或横向可滚动均计入）
 * @param el 元素
 * @returns 最近的可滚动父级
 */
export function getNearestScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement
  while (parent) {
    if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
      return parent
    }
    parent = parent.parentElement
  }
  return null
}

type ScrollViewPosition = 'center' | 'start' | 'end'

/**
 * 滚动元素到容器视图中
 * @description 用于替代 `el.scrollIntoView` 方法，因为 `el.scrollIntoView` 在某些情况下会导致外部元素滚动
 * @param el 元素
 * @param container 可滚动容器
 * @param options 滚动选项
 */
export function scrollIntoContainerView(
  el: HTMLElement,
  container: HTMLElement | null,
  options?: { block?: ScrollViewPosition; inline?: ScrollViewPosition }
): void {
  container = container || getNearestScrollParent(el)
  if (!container) return

  const { block = 'center', inline = 'center' } = options || {}

  const {
    offsetTop: eOffsetTop,
    offsetLeft: eOffsetLeft,
    offsetHeight: eOffsetHeight,
    offsetWidth: eOffsetWidth
  } = el

  const {
    clientHeight: cClientHeight,
    clientWidth: cClientWidth,
    scrollTop: cScrollTop,
    scrollLeft: cScrollLeft
  } = container

  const isVerticalInView =
    cScrollTop + cClientHeight > eOffsetTop + eOffsetHeight && cScrollTop < eOffsetTop

  const isHorizontalInView =
    cScrollLeft + cClientWidth > eOffsetLeft + eOffsetWidth && cScrollLeft < eOffsetLeft

  // 垂直方向和水平方向都已经在视图中，则不进行滚动
  if (isVerticalInView && isHorizontalInView) return

  if (!isVerticalInView) {
    if (block === 'center') {
      container.scrollTop = eOffsetTop - cClientHeight / 2 + eOffsetHeight / 2
    } else if (block === 'start') {
      container.scrollTop = eOffsetTop
    } else if (block === 'end') {
      container.scrollTop = eOffsetTop - cClientHeight + eOffsetHeight
    }
  }

  if (!isHorizontalInView) {
    if (inline === 'center') {
      container.scrollLeft = eOffsetLeft - cClientWidth / 2 + eOffsetWidth / 2
    } else if (inline === 'start') {
      container.scrollLeft = eOffsetLeft
    } else if (inline === 'end') {
      container.scrollLeft = eOffsetLeft - cClientWidth + eOffsetWidth
    }
  }
}
