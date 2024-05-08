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
  contentRefDom: HTMLElement,
  pageRefDom: HTMLElement
): boolean {
  let contentRect = contentRefDom.getBoundingClientRect()
  let pageRect = pageRefDom.getBoundingClientRect()
  return (
    countPositionInt(pageRect.top - 16) > countPositionInt(contentRect.height)
  )
}

/**
 * 靠下是否在视窗内
 * @param contentRefDom 内容dom信息
 * @param pageRefDom  页面dom信息
 * @returns  是否在视窗内
 */
function isBottomInViewport(
  contentRefDom: HTMLElement,
  pageRefDom: HTMLElement,
  screenSize: {width: number; height: number}
): boolean {
  let contentRect = contentRefDom.getBoundingClientRect()
  let pageRect = pageRefDom.getBoundingClientRect()
  return (
    countPositionInt(contentRect.height) >
    countPositionInt(screenSize.height - pageRect.y - pageRect.height - 16)
  )
}

/**
 * 靠左、靠右 左右是否在视窗内
 * @param pageRefDom 内容dom信息
 * @returns  是否在视窗内
 */
function isRightOrLeftInViewport(pageRefDom: HTMLElement,screenSize: {width: number; height: number}): boolean {
  let contentRect = pageRefDom.getBoundingClientRect()
  /**
   * 鼠标移入元素的宽度  是否小于 可视窗口减去 元素的宽度 及 自身宽度
   */
  return (
    countPositionInt(contentRect.width) >
    countPositionInt(screenSize.width - (contentRect.x + contentRect.width))
  )
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
  screenSize: {width: number; height: number},
  scrollDirection?: string,
): boolean {
  let contentRect = contentRefDom.getBoundingClientRect()
  let pageRect = pageRefDom.getBoundingClientRect()

  if (!scrollDirection) {
    /**
     * 页面还没有开始滚动，判断此时rect2页面元素距离上下可视区域的距离是否够展示rect元素
     */
    if (firstShowInViewport(contentRefDom, pageRefDom,screenSize) === "top") {
      return scrollDirectionUpOrDown(contentRect, pageRect, "down",screenSize)
    } else {
      return scrollDirectionUpOrDown(contentRect, pageRect, "up",screenSize)
    }
  } else {
    /**
     * 判断元素此时距离上下的距离
     */
    return scrollDirectionUpOrDown(contentRect, pageRect, scrollDirection,screenSize)
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
  screenSize: {width: number; height: number}
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
  screenSize: {width: number; height: number}
): boolean {
  if (scrollDirection === "down") {
    return (
      countPositionInt(pageRect.y + pageRect.height) >=
      countPositionInt(contentRect.height)
    )
  } else {
    return (
      countPositionInt(screenSize.height - pageRect.y) > contentRect.height
    )
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
