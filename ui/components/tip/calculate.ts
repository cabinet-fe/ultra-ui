// 辅助函数，用于计算最大宽度
function calculateMaxWidth(screenWidth, rect, position, gap) {
  if (position.includes("start")) {
    return `calc(100vw - ${rect.left + gap}px)`
  } else if (position.includes("end")) {
    return `${rect.right - gap}px`
  } else {
    return `${window.innerWidth - gap * 2}px`
  }
}

// 辅助函数，rectWidth > screenWidth - (rectX + rectWidth)用于计算最大宽度（用于右侧定位）
function calculateRightMaxWidth(gap, screenWidth, rectWidth, rectX) {
  return rectWidth > screenWidth - (rectX + rectWidth)
    ? `calc(${rectX - gap * 2}px)`
    : `${screenWidth - rectWidth - gap}px`
}

// 辅助函数，用于计算最大宽度（用于左侧定位）
function calculateLeftMaxWidth(gap, screenWidth, rectWidth, rectX) {
  return rectWidth > screenWidth - (rectX + rectWidth)
    ? `calc(${rectX - gap * 2}px)`
    : `${screenWidth - (rectX + rectWidth) - gap * 2}px`
}

/**
 * 判断元素自身是否超出父级元素
 *
 * @param tipRefDom 元素自身
 * @param parentDom 父级元素
 * @returns 如果元素超出父级元素，则返回true；否则返回false
 */
function isOverflown(tipRefDom: HTMLElement, parentDom: HTMLElement) {
  if(!parentDom) return false
  // 获取元素的边界位置
  const tipRect = tipRefDom.getBoundingClientRect()
  // 获取父元素的边界位置
  const parentRect = parentDom.getBoundingClientRect()

  // 检查元素是否在父元素的左边、右边、上边或下边之外
  if (
    tipRect.bottom - tipRect.height / 2 > parentRect.bottom || // 下边超出
    tipRect.top + tipRect.height < parentRect.top // 上边超出
  ) {
    return true // 至少有一个边超出，则返回true
  }

  return false // 没有边超出，则返回false
}

export {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth,
  isOverflown,
}