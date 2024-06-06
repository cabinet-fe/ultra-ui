/**保留整数 */
function countPositionInt(num: number | string): number {
  return Math.floor(Number(num))
}

/**
 * 靠上是否在视窗内
 * @param contentRefDom 内容dom信息
 * @param pageRefDom  页面dom信息
 * @returns  是否在视窗内
 */
function isTopInViewport(
  pageRefDom: HTMLElement,
  tipContentRefDom: HTMLElement
): boolean {
  let pageRect = pageRefDom.getBoundingClientRect()
  let contentRect = tipContentRefDom.getBoundingClientRect()

  // 获取父元素的边界位置
  return (
    countPositionInt(contentRect.top) <
    countPositionInt(pageRect.top - pageRect.height)
  )
}
function getWindowScrollTop() {
  let doc = document.documentElement
  return (window.scrollY || doc.scrollTop) - (doc.clientTop || 0)
}
/**
 * 靠下是否在视窗内
 * @param pageRefDom  页面dom信息
 * @param tipContentRefDom  滚动dom
 * @returns  是否在视窗内
 */
function isBottomInViewport(pageRefDom: HTMLElement,gap:number): boolean {
  let pageRect = pageRefDom.getBoundingClientRect()

  let top = pageRect.bottom + pageRefDom.offsetHeight + getWindowScrollTop() + gap

  if (top + pageRefDom.offsetHeight > window.innerHeight) {
    return true
  } else {
    return false
  }
}

/**
 * 靠左、靠右 左右是否在视窗内
 * @param tipContentRefDom 内容dom信息
 * @param tipRefDom 内容dom信息
 * @param position 位置
 * @returns  是否在视窗内
 */
function isRightOrLeftInViewport(
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement,
  position: string
): boolean {
  let contentRect = tipContentRefDom.getBoundingClientRect()
  let tipRect = tipRefDom.getBoundingClientRect()

  if (position.includes("left")) {
    return countPositionInt(contentRect.width) > countPositionInt(tipRect.left)
  } else {
    return (
      countPositionInt(contentRect.width) >
      countPositionInt(window.innerWidth - tipRect.right)
    )
  }
}

/**
 * 靠左、靠右   上下是否在视窗内
 * @param contentRefDom 内容dom信息
 * @param pageRefDom 页面dom信息
 * @param scrollDirection 滚动方向
 * @returns  是否在视窗内
 */
function isRightOrLeftUpInViewport(
  contentRefDom: HTMLElement,
  pageRefDom: HTMLElement,
  screenSize: { width: number; height: number },
  scrollDirection?: string
): boolean {
  let contentRect = contentRefDom.getBoundingClientRect()
  let pageRect = pageRefDom.getBoundingClientRect()

  if (!scrollDirection) {
    /**
     * 页面还没有开始滚动，判断此时rect2页面元素距离上下可视区域的距离是否够展示rect元素
     */
    if (firstShowInViewport(contentRefDom, pageRefDom, screenSize) === "top") {
      return scrollDirectionUpOrDown(contentRect, pageRect, "down", screenSize)
    } else {
      return scrollDirectionUpOrDown(contentRect, pageRect, "up", screenSize)
    }
  } else {
    /**
     * 判断元素此时距离上下的距离
     */
    return scrollDirectionUpOrDown(
      contentRect,
      pageRect,
      scrollDirection,
      screenSize
    )
  }
}
/**
 * 判断元素第一次显示时是否在可视区域
 * 可能靠中间  靠上 或者 靠下
 * @param contentRefDom 内容dom信息
 * @param pageRefDom 页面dom信息
 */
function firstShowInViewport(
  contentRefDom: HTMLElement,
  pageRefDom: HTMLElement,
  screenSize: { width: number; height: number }
) {
  let contentRect = contentRefDom.getBoundingClientRect()
  let pageRect = pageRefDom.getBoundingClientRect()
  if (pageRect.top < contentRect.height) {
    return "top"
  } else if (
    pageRect.top + pageRect.height >
    screenSize?.height - contentRect.height
  ) {
    return "bottom"
  }
}
/**
 * 根据屏幕滚动方向（上下）计算元素是否在屏幕内
 * @param contentRect 内容dom信息
 * @param pageRect 页面dom信息
 * @param scrollDirection 滚动方向
 * @returns  是否在视窗内
 */
function scrollDirectionUpOrDown(
  contentRect: Record<string, any>,
  pageRect: Record<string, any>,
  scrollDirection: string,
  screenSize: { width: number; height: number }
): boolean {
  if (scrollDirection === "down") {
    return (
      countPositionInt(pageRect.y + pageRect.height) >=
      countPositionInt(contentRect.height)
    )
  } else {
    return countPositionInt(screenSize.height - pageRect.y) > contentRect.height
  }
}
export {
  isTopInViewport,
  isBottomInViewport,
  isRightOrLeftInViewport,
  isRightOrLeftUpInViewport,
  firstShowInViewport,
  countPositionInt,
}
