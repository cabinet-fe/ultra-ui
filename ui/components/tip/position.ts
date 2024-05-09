import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"
import {
  isTopInViewport,
  isBottomInViewport,
  isRightOrLeftInViewport,
  isRightOrLeftUpInViewport,
  firstShowInViewport,
  countPositionInt,
} from "./viewport"
import type {ScrollDirection, PositionResult} from "./type"

/**弹窗位置距离屏幕边缘的距离 */
let elementDistance = 16

/**每次初始化默认 */
let componentCss = {}

/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({})

/**
 * 计算弹窗显示位置
 * @param position 弹窗位置
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * @param tipRefDom 页面元素DOM信息
 * @param tipContentRefDom tip提示的DOM信息
 * @param scrollDirection 屏幕滚动方向
 * @param screenSize 当前所在滚动元素尺寸
 * @param scrollDom 滚动元素
 * @returns dynamicCss: 弹窗样式, arrowCss: 箭头样式
 */
function countPosition({
  position,
  elementWidth,
  elementHeight,
  tipRefDom,
  tipContentRefDom,
  scrollDirection,
  screenSize,
  scrollDom
}: {
  position: string
  elementWidth: number
  elementHeight: number
  tipRefDom: HTMLElement
  tipContentRefDom: HTMLElement
  scrollDirection: ScrollDirection
  screenSize: {width: number; height: number},
  scrollDom:HTMLElement
}): Promise<PositionResult> {
  componentCss = {
    left: undefined as string | undefined,
    top: undefined as string | undefined,
    right: undefined as string | undefined,
    bottom: undefined as string | undefined,
  }
  dynamicCss.value = {
    zIndex: zIndex(),
  }

  return new Promise((resolve) => {
    nextTick(() => {
      dynamicCss.value = {...dynamicCss.value, ...componentCss}

      // 弹窗显示的DOM信息
      let {clientWidth, clientHeight} = tipContentRefDom
      if (position) {
        position.indexOf("top") > -1 &&
          topCount(
            position,
            clientHeight,
            clientWidth,
            elementWidth,
            tipRefDom,
            tipContentRefDom,
            screenSize,
            scrollDom
          )
        position.indexOf("left") > -1 &&
          leftCount(
            position,
            clientHeight,
            clientWidth,
            elementHeight,
            tipContentRefDom,
            tipRefDom,
            scrollDirection,
            screenSize
          )
        position.indexOf("right") > -1 &&
          rightCount(
            position,
            clientHeight,
            elementWidth,
            elementHeight,
            tipContentRefDom,
            tipRefDom,
            scrollDirection,
            screenSize
          )
        position.indexOf("bottom") > -1 &&
          bottomCount(
            position,
            clientWidth,
            elementWidth,
            elementHeight,
            tipContentRefDom,
            tipRefDom,
            screenSize,
            scrollDom
          )
      }
      dynamicCss.value.opacity = 1
      resolve({dynamicCss})
    })
  })
}

// 重构后的样式设置函数
const setTransform = (transform: string): void => {
  dynamicCss.value.transform = transform
}
/**
 * tip靠上计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 * @param tipRefDom 页面DOM信息
 * @param tipContentRefDom tip元素DOM信息
 * @param screenSize 当前所在滚动元素尺寸
 * @param scrollDom 滚动元素
 */
function topCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number,
  tipRefDom: HTMLElement,
  tipContentRefDom: HTMLElement,
  screenSize: {width: number; height: number},
  scrollDom:HTMLElement
) {
  // 获取tip元素位置信息
  let {x, y} = tipRefDom.getBoundingClientRect()

  // 计算tip元素需要向上偏移的距离
  let translateY = y - clientHeight - elementDistance
  // 计算tip元素需要向下偏移的距离
  let topDown = y + tipRefDom.offsetHeight + elementDistance

  // 根据不同的位置属性设置transform样式
  if (position === "top-start") {
    // tip提示靠上开始位置
    setTransform(`translate(${x}px, ${translateY}px)`)
  } else if (position === "top") {
    // tip提示靠上居中位置
    if (clientWidth === screenSize.width - elementDistance * 2) {
      setTransform(`translate(${elementDistance}px, ${translateY}px)`)
    } else {
      setTransform(
        `translate(${x - (clientWidth - elementWidth) / 2}px, ${translateY}px)`
      )
    }
  } else if (position === "top-end") {
    // tip提示靠上结束位置
    setTransform(
      `translate(${x - clientWidth + elementWidth}px, ${translateY}px)`
    )
  }

  // 如果tip元素超出视窗上边界，则将tip元素定位到鼠标下方
  if (!isTopInViewport(tipRefDom,scrollDom)) {
    if (position === "top-start") {
      setTransform(`translate(${x}px, ${topDown}px)`)
    } else if (position === "top") {
      setTransform(
        `translate(${x - (clientWidth - elementWidth) / 2}px, ${topDown}px)`
      )
    } else if (position === "top-end") {
      setTransform(
        `translate(${x - clientWidth + elementWidth}px, ${topDown}px)`
      )
    }
  }
}

/**
 * tip靠右计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素距离左边的距离
 * @param tipContentRefDom tip元素DOM信息
 * @param tipRefDom 页面DOM信息
 * @param scrollDirection  滚动方向
 * @param screenSize 当前所在滚动元素尺寸
 */
function rightCount(
  position: string,
  clientHeight: number,
  elementWidth: number,
  elementHeight: number,
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement,
  scrollDirection: ScrollDirection,
  screenSize: {width: number; height: number}
): void {
  //鼠标获取到的元素dom信息
  let {x, top} = tipRefDom.getBoundingClientRect()

  if (isRightOrLeftInViewport(tipRefDom,screenSize)) {
    let rightLeft = `${x - elementDistance - tipContentRefDom.offsetWidth}`
    /**再次判断上下是否溢出屏幕 */
    if (
      !isRightOrLeftUpInViewport(tipContentRefDom, tipRefDom,screenSize, scrollDirection)
    ) {
      let rightUp = 0
      scrollDirection =
        firstShowInViewport(tipContentRefDom, tipRefDom,screenSize) === "bottom"
          ? "up"
          : "down"
      if (scrollDirection === "down") {
        rightUp = countPositionInt(`${tipRefDom.getBoundingClientRect().y}`)
      } else {
        rightUp = countPositionInt(
          `${
            tipRefDom.getBoundingClientRect().y - clientHeight + elementHeight
          }`
        )
      }
      if (position === "right-start") {
        setTransform(`translate(${rightLeft}px, ${rightUp}px)`)
      }
      if (position === "right") {
        if (clientHeight > elementHeight) {
          setTransform(`translate(${rightLeft}px, ${rightUp}px)`)
        } else {
          setTransform(`translate(${rightLeft}px, ${rightUp}px)`)
        }
      }
      if (position === "right-end") {
        if (clientHeight > elementHeight) {
          setTransform(`translate(${rightLeft}px, ${rightUp}px)`)
        } else {
          setTransform(`translate(${rightLeft}px, ${rightUp}px)`)
        }
      }
    } else {
      if (position === "right-start") {
        setTransform(`translate(${rightLeft}px, ${top}px)`)
      }
      if (position === "right") {
        if (clientHeight > elementHeight) {
          setTransform(
            `translate(${rightLeft}px, ${
              top - (clientHeight - elementHeight) / 2
            }px)`
          )
        } else {
          setTransform(
            `translate(${rightLeft}px, ${
              top + (elementHeight - clientHeight) / 2
            }px)`
          )
        }
      }
      if (position === "right-end") {
        if (clientHeight > elementHeight) {
          setTransform(
            `translate(${rightLeft}px, ${
              top - (clientHeight - elementHeight)
            }px)`
          )
        } else {
          setTransform(
            `translate(${rightLeft}px, ${
              top + (elementHeight - clientHeight)
            }px)`
          )
        }
      }
    }
  } else {
    let rightX = countPositionInt(x + elementWidth + elementDistance)
    if (position === "right-start") {
      setTransform(`translate(${rightX}px, ${top}px)`)
    }

    if (position === "right") {
      if (clientHeight > elementHeight) {
        setTransform(
          `translate(${rightX}px, ${
            top - (clientHeight - elementHeight) / 2
          }px)`
        )
      } else {
        setTransform(
          `translate(${rightX}px, ${
            top + (elementHeight - clientHeight) / 2
          }px)`
        )
      }
    }

    if (position === "right-end") {
      if (clientHeight > elementHeight) {
        setTransform(
          `translate(${rightX}px, ${top - (clientHeight - elementHeight)}px)`
        )
      } else {
        setTransform(
          `translate(${rightX}px, ${top + (elementHeight - clientHeight)}px)`
        )
      }
    }
  }
}

/**
 * tip靠左计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementHeight 页面元素高度
 * @param tipContentRefDom  tip元素DOM信息
 * @param tipRefDom 页面DOM信息
 * @param scrollDirection  滚动方向
 * @param screenSize 当前所在滚动元素尺寸
 */
function leftCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementHeight: number,
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement,
  scrollDirection: ScrollDirection,
  screenSize:{ width: number; height: number; }
): void {
  //鼠标获取到的元素dom信息
  let {x, width, top} = tipRefDom.getBoundingClientRect()
  let rightLeft = countPositionInt(`${x + width + elementDistance}`)
  if (isRightOrLeftInViewport(tipContentRefDom,screenSize)) {
    /**再次判断上下是否溢出屏幕 */

    if (
      !isRightOrLeftUpInViewport(tipContentRefDom, tipRefDom, screenSize,scrollDirection)
    ) {
      let leftUp = 0
      scrollDirection =
        firstShowInViewport(tipContentRefDom, tipRefDom,screenSize) === "bottom"
          ? "up"
          : "down"
      if (scrollDirection === "down") {
        leftUp = countPositionInt(`${tipRefDom.getBoundingClientRect().y}`)
      } else {
        leftUp = countPositionInt(
          `${
            tipRefDom.getBoundingClientRect().y - clientHeight + elementHeight
          }`
        )
      }

      if (position === "left-start") {
        setTransform(`translate(${rightLeft}px, ${leftUp}px)`)
      }
      if (position === "left") {
        if (clientHeight > elementHeight) {
          setTransform(`translate(${rightLeft}px, ${leftUp}px)`)
        } else {
          setTransform(`translate(${rightLeft}px, ${leftUp}px)`)
        }
      }
      if (position === "left-end") {
        if (clientHeight > elementHeight) {
          setTransform(`translate(${rightLeft}px, ${leftUp}px)`)
        } else {
          setTransform(`translate(${rightLeft}px, ${leftUp}px)`)
        }
      }
    } else {
      if (position === "left-start") {
        setTransform(`translate(${rightLeft}px, ${top}px)`)
      }
      if (position === "left") {
        if (clientHeight > elementHeight) {
          setTransform(
            `translate(${rightLeft}px, ${
              top - (clientHeight - elementHeight) / 2
            }px)`
          )
        } else {
          setTransform(
            `translate(${rightLeft}px, ${
              top + (elementHeight - clientHeight) / 2
            }px)`
          )
        }
      }
      if (position === "left-end") {
        if (clientHeight > elementHeight) {
          setTransform(
            `translate(${rightLeft}px, ${
              top - (clientHeight - elementHeight) - 2
            }px)`
          )
        } else {
          setTransform(
            `translate(${rightLeft}px, ${
              top + (elementHeight - clientHeight) - 2
            }px)`
          )
        }
      }
    }
  } else {
    let leftX = countPositionInt(x - clientWidth - elementDistance)
    if (position === "left-start") {
      setTransform(`translate(${leftX}px, ${top}px)`)
    }
    if (position === "left") {
      if (clientHeight > elementHeight) {
        setTransform(
          `translate(${leftX}px, ${countPositionInt(
            top - (clientHeight - elementHeight) / 2
          )}px)`
        )
      } else {
        setTransform(
          `translate(${leftX}px, ${countPositionInt(
            top + (elementHeight - clientHeight) / 2
          )}px)`
        )
      }
    }
    if (position === "left-end") {
      if (clientHeight > elementHeight) {
        setTransform(
          `translate(${leftX}px, ${countPositionInt(
            top - (clientHeight - elementHeight)
          )}px)`
        )
      } else {
        setTransform(
          `translate(${leftX}px, ${countPositionInt(
            top + (elementHeight - clientHeight)
          )}px)`
        )
      }
    }
  }
}

/**
 * tip靠下计算方法
 * @param position 位置
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * @param tipContentRefDom tip元素DOM信息
 * @param tipRefDom 页面DOM信息
 * @param screenSize 当前所在滚动元素尺寸
 * @param scrollDom 滚动元素
 *
 */
function bottomCount(
  position: string,
  clientWidth: number,
  elementWidth: number,
  elementHeight: number,
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement,
  screenSize: { width: number; height: number; },
  scrollDom:HTMLElement
): void {
  // 预先计算DOM信息
  const {x, top} = tipRefDom.getBoundingClientRect()
  const contentRect = tipContentRefDom.getBoundingClientRect()
  const elementDistanceDefined =
    elementDistance !== undefined ? elementDistance : 0 // 假设elementDistance是未定义的

  // 根据位置计算底部Y坐标
  const bottomY = countPositionInt(top + elementHeight + elementDistanceDefined)
  const bottomTop = `${top - contentRect.height - elementDistanceDefined}`

  // 判断是否在视图底部
  if (isBottomInViewport(tipRefDom,scrollDom)) {
    if (position === "bottom-start") {
      setTransform(`translate(${x}px, ${bottomTop}px)`)
    } else if (position === "bottom") {
      if (clientWidth > elementWidth) {
        setTransform(
          `translate(${
            countPositionInt(
              screenSize.width - clientWidth - elementDistance
            ) /
              2 +
            elementWidth
          }px, ${countPositionInt(bottomTop)}px)`
        )
      } else {
        setTransform(
          `translate(${x + (elementWidth - clientWidth) / 2}px, ${bottomTop}px)`
        )
      }
    } else if (position === "bottom-end") {
      if (clientWidth > elementWidth) {
        setTransform(
          `translate(${x - (clientWidth - elementWidth)}px,${bottomTop}px)`
        )
      } else {
        setTransform(
          `translate(${x + (elementWidth - clientWidth)}px, ${bottomTop}px)`
        )
      }
    }
  } else {
    if (position === "bottom-start") {
      setTransform(`translate(${x}px, ${bottomY}px)`)
    } else if (position === "bottom") {
      if (clientWidth === screenSize.width - elementDistance * 2) {
        setTransform(`translate(${elementDistanceDefined}px, ${bottomY}px)`)
        return
      }
      setTransform(
        `translate(${x - (clientWidth - elementWidth) / 2}px, ${bottomY}px)`
      )
    } else if (position === "bottom-end") {
      if (clientWidth > elementWidth) {
        setTransform(
          `translate(${x - (clientWidth - elementWidth)}px,${bottomY}px)`
        )
      } else {
        setTransform(
          `translate(${x + (elementWidth - clientWidth)}px, ${bottomY}px)`
        )
      }
    }
    
  }
}

export default countPosition
