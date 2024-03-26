/**保留整数 */
function countPositionInt(num: number | string): number {
  return Math.floor(Number(num))
}

/**
 * tip靠上是否在视窗内
 * @param tipContentRefDom tip内容元素
 * @param tipRefDom  tip元素
 * @returns  tip是否在视窗内
 */
function isTopInViewport(
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement
): boolean {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()
  return countPositionInt(rect2.top - 16) > countPositionInt(rect.height)
}

/**
 * tip靠下是否在视窗内
 * @param tipContentRefDom tip内容元素
 * @param tipRefDom  tip元素
 * @returns  tip是否在视窗内
 */
function isBottomInViewport(
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement
): boolean {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()
  return (
    countPositionInt(window.innerHeight - rect2.y - rect2.height - 16) >
    countPositionInt(rect.height)
  )
}

/**
 * tip靠左、靠右 左右是否在视窗内
 * @param tipRefDom tip内容元素
 * @returns  tip是否在视窗内
 */
function isRightOrLeftInViewport(tipRefDom: HTMLElement): boolean {
  let rect = tipRefDom.getBoundingClientRect()
  /**
   * 鼠标移入元素的宽度  是否小于 可视窗口减去 元素的宽度 及 自身宽度
   */
  return (
    countPositionInt(rect.width) >
    countPositionInt(window.innerWidth - (rect.x + rect.width))
  )
}

/**
 * tip靠左、靠右   上下是否在视窗内
 * @param tipContentRefDom tip内容dom信息
 * @param tipRefDom 页面dom信息
 * @param scrollDirection 滚动方向
 * @returns  tip是否在视窗内
 */
function isRightOrLeftUpInViewport(
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement,
  scrollDirection?: string
): boolean {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()

  if (!scrollDirection) {
    /**
     * 页面还没有开始滚动，判断此时rect2页面元素距离上下可视区域的距离是否够展示rect元素
     */
    if (firstShowInViewport(tipContentRefDom, tipRefDom) === "top") {
      return scrollDirectionUpOrDown(rect, rect2, "down")
    } else {
      return scrollDirectionUpOrDown(rect, rect2, "up")
    }
  } else {
    /**
     * 判断元素此时距离上下的距离
     */
    return scrollDirectionUpOrDown(rect, rect2, scrollDirection)
  }
}
/**
 * 判断元素第一次显示时是否在可视区域
 * 可能靠中间  靠上 或者 靠下
 * @param tipContentRefDom tip内容dom信息
 * @param tipRefDom 页面dom信息
 */
function firstShowInViewport(
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement
) {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()
  if (rect2.top < rect.height) {
    return "top"
  } else if (rect2.top + rect2.height > window.innerHeight - rect.height) {
    return "bottom"
  }
}
/**
 * 根据屏幕滚动方向（上下）计算元素是否在屏幕内
 * @param rect tip内容dom信息
 * @param rect2 页面dom信息
 * @param scrollDirection 滚动方向
 * @returns  tip是否在视窗内
 */
function scrollDirectionUpOrDown(
  rect: Record<string, any>,
  rect2: Record<string, any>,
  scrollDirection: string
): boolean {
  if (scrollDirection === "down") {
    return (
      countPositionInt(rect2.y + rect2.height) >= countPositionInt(rect.height)
    )
  } else {
    return countPositionInt(window.innerHeight - rect2.y) > rect.height
  }
}
export {
  isTopInViewport,
  isBottomInViewport,
  isRightOrLeftInViewport,
  isRightOrLeftUpInViewport,
  firstShowInViewport,
  countPositionInt
}
