import { calculateLeftMaxWidth, calculateMaxWidth } from "./calculate"


/**
 * 计算元素最大宽度
 * @param screenSize
 * @param position
 * @param gap
 * @param rectv
 * @returns maxWidth
 */
let maxWidth

export default function countMaxWidth(
  position: string,
  gap: number,
  rect: DOMRect
) {
  if (position.match(/^(top|bottom)/)) {
    maxWidth = calculateMaxWidth(rect, position, gap)
  } else {
    maxWidth = calculateLeftMaxWidth(window.innerWidth, rect.width, rect.x, gap)
  }
  return maxWidth
}
