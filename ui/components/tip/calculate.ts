// 辅助函数，用于计算最大宽度
function calculateMaxWidth(screenWidth,rect, position, gap) {
  if (position.includes("start")) {
    return `calc(100vw - ${rect.left + gap}px)`
  } else if (position.includes("end")) {
    return `${rect.right - gap}px`
  } else {
    return `${screenWidth - gap * 2}px`
  }
}

// 辅助函数，rectWidth > screenWidth - (rectX + rectWidth)用于计算最大宽度（用于右侧定位）
function calculateRightMaxWidth(gap, screenWidth, rectWidth, rectX) {
  return rectWidth > screenWidth - (rectX + rectWidth)
    ? `calc(${rectX - gap * 2}px)`
    : `${screenWidth - rectWidth - gap * 2}px`
}

// 辅助函数，用于计算最大宽度（用于左侧定位）
function calculateLeftMaxWidth(gap, screenWidth, rectWidth, rectX) {
  return rectWidth > screenWidth - (rectX + rectWidth)
    ? `calc(${rectX - gap * 2}px)`
    : `${screenWidth - rectWidth - gap * 2}px`
}

export {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth,
}
