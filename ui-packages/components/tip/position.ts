import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"

interface PositionResult {
  dynamicCss: Record<string, any>
}

/**弹窗位置距离元素的距离 */
let elementDistance = 16

/**每次初始化默认 */
let componentCss = {}

/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({})

/**保留整数 */
function countPositionInt(num: number | string) {
  return Math.floor(Number(num))
}

/**
 * 计算弹窗显示位置
 * @param position 弹窗位置
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * @param tipRefDom 页面元素DOM信息
 * @param tipContentRefDom tip提示的DOM信息
 *
 * @returns dynamicCss: 弹窗样式, arrowCss: 箭头样式
 */
function countPosition({
  position,
  elementWidth,
  elementHeight,
  tipRefDom,
  tipContentRefDom,
}: {
  position: string
  elementWidth: number
  elementHeight: number
  tipRefDom: HTMLElement
  tipContentRefDom: HTMLElement
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
            tipContentRefDom
          )
        position.indexOf("left") > -1 &&
          leftCount(
            position,
            clientHeight,
            clientWidth,
            elementHeight,
            elementWidth,
            tipContentRefDom,
            tipRefDom
          )
        position.indexOf("right") > -1 &&
          rightCount(
            position,
            clientHeight,
            elementWidth,
            elementHeight,
            tipContentRefDom,
            tipRefDom
          )
        position.indexOf("bottom") > -1 &&
          bottomCount(
            position,
            clientWidth,
            elementWidth,
            elementHeight,
            tipContentRefDom,
            tipRefDom
          )
      }
      dynamicCss.value.opacity = 1
      resolve({dynamicCss})
    })
  })
}
/**
 * tip靠上计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 * @param tipRefDom 页面DOM信息
 * @param tipContentRefDom tip元素DOM信息
 */
function topCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number,
  tipRefDom: HTMLElement,
  tipContentRefDom: HTMLElement
): void {
  //鼠标获取到的元素dom信息
  let {x, y} = tipRefDom.getBoundingClientRect()
  let {offsetLeft} = tipRefDom
  let translateY = `${y - clientHeight - elementDistance}`

  if (position === "top-start") {
    dynamicCss.value.transform = `translate(${countPositionInt(
      x
    )}px,${countPositionInt(translateY)}px)`
  }
  // tip提示靠上 居中
  if (position === "top") {
    if (clientWidth === window.innerWidth - 32) {
      dynamicCss.value.transform = `translate(${elementDistance}px, ${translateY}px)`
      return
    }
    dynamicCss.value.transform = `translate(${countPositionInt(
      offsetLeft + 240 - (clientWidth - elementWidth) / 2
    )}px, ${countPositionInt(translateY)}px)`
  }
  // tip提示靠上 右
  if (position === "top-end") {
    dynamicCss.value.transform = `translate(${countPositionInt(
      tipRefDom.getBoundingClientRect().x - clientWidth + elementWidth
    )}px, ${countPositionInt(translateY)}px)`
  }

  /**tip是否在视窗内 */
  if (!ifTopViewport(tipContentRefDom, tipRefDom)) {
    let topDown = `${countPositionInt(
      tipRefDom.getBoundingClientRect().y +
        tipRefDom.offsetHeight +
        elementDistance
    )}`
    if (position === "top-start") {
      dynamicCss.value.transform = `translate(${countPositionInt(
        x
      )}px,${topDown}px)`
    }
    if (position === "top") {
      dynamicCss.value.transform = `translate(${countPositionInt(
        offsetLeft + 240 - (clientWidth - elementWidth) / 2
      )}px, ${topDown}px)`
    }
    if (position === "top-end") {
      dynamicCss.value.transform = `translate(${countPositionInt(
        tipRefDom.getBoundingClientRect().x - clientWidth + elementWidth
      )}px,${topDown}px)`
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
 */
function rightCount(
  position: string,
  clientHeight: number,
  elementWidth: number,
  elementHeight: number,
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement
): void {
  //鼠标获取到的元素dom信息
  let {x, top} = tipRefDom.getBoundingClientRect()

  if (ifRightOrLeftViewport(tipRefDom)) {
    let rightLeft = `${x - elementDistance - tipContentRefDom.offsetWidth}`

    if (position === "right-start") {
      dynamicCss.value.transform = `translate(${rightLeft}px, ${top}px)`
    }
    if (position === "right") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top - (clientHeight - elementHeight) / 2
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top + (elementHeight - clientHeight) / 2
        }px)`
      }
    }
    if (position === "right-end") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top - (clientHeight - elementHeight)
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top + (elementHeight - clientHeight)
        }px)`
      }
    }
  } else {
    let rightX = countPositionInt(x + elementWidth + elementDistance)
    if (position === "right-start") {
      dynamicCss.value.transform = `translate(${rightX}px, ${top}px)`
    }

    if (position === "right") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightX}px, ${
          top - (clientHeight - elementHeight) / 2
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightX}px, ${
          top + (elementHeight - clientHeight) / 2
        }px)`
      }
    }

    if (position === "right-end") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightX}px, ${
          top - (clientHeight - elementHeight)
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightX}px, ${
          top + (elementHeight - clientHeight)
        }px)`
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
 * @param elementWidth 页面元素宽度
 * @param offsetLeft 页面元素距离左边的距离
 * @param tipContentRefDom tip元素DOM信息
 * @param tipRefDom 页面DOM信息
 */
function leftCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementHeight: number,
  elementWidth: number,
  tipRefDom: HTMLElement,
  tipContentRefDom: HTMLElement
): void {
  //鼠标获取到的元素dom信息
  let {x, width, top} = tipContentRefDom.getBoundingClientRect()

  if (ifRightOrLeftViewport(tipRefDom)) {
    let rightLeft = countPositionInt(`${x + width + elementDistance}`)
    if (position === "left-start") {
      dynamicCss.value.transform = `translate(${rightLeft}px, ${top}px)`
    }
    if (position === "left") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top - (clientHeight - elementHeight) / 2
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top + (elementHeight - clientHeight) / 2
        }px)`
      }
    }
    if (position === "left-end") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top - (clientHeight - elementHeight) - 2
        }px)`
      } else {
        dynamicCss.value.transform = `translate(${rightLeft}px, ${
          top + (elementHeight - clientHeight) - 2
        }px)`
      }
    }
  } else {
    let leftX = countPositionInt(x - clientWidth - elementDistance)
    if (position === "left-start") {
      dynamicCss.value.transform = `translate(${leftX}px, ${top}px)`
    }
    if (position === "left") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${leftX}px, ${countPositionInt(
          top - (clientHeight - elementHeight) / 2
        )}px)`
      } else {
        dynamicCss.value.transform = `translate(${leftX}px, ${countPositionInt(
          top + (elementHeight - clientHeight) / 2
        )}px)`
      }
    }
    if (position === "left-end") {
      if (clientHeight > elementHeight) {
        dynamicCss.value.transform = `translate(${leftX}px, ${countPositionInt(
          top - (clientHeight - elementHeight)
        )}px)`
      } else {
        dynamicCss.value.transform = `translate(${leftX}px, ${countPositionInt(
          top + (elementHeight - clientHeight)
        )}px)`
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
 *
 */
function bottomCount(
  position: string,
  clientWidth: number,
  elementWidth: number,
  elementHeight: number,
  tipContentRefDom: HTMLElement,
  tipRefDom: HTMLElement
): void {
  //鼠标获取到的元素dom信息
  let {x, top} = tipRefDom.getBoundingClientRect()

  if (!ifBottomViewport(tipContentRefDom, tipRefDom)) {
    let bottomTop = `${
      top - tipContentRefDom.getBoundingClientRect().height - elementDistance
    }`
    if (position === "bottom-start") {
      dynamicCss.value.transform = `translate(${x}px, ${bottomTop}px)`
    }
    // tip提示靠下 居中
    if (position === "bottom") {
      if (clientWidth > elementWidth) {
        dynamicCss.value.transform = `translate(${
          countPositionInt(window.innerWidth - clientWidth - 16) / 2 +
          elementWidth
        }px, ${countPositionInt(bottomTop)}px)`
      } else {
        dynamicCss.value.transform = `translate(${
          x + (elementWidth - clientWidth) / 2
        }px, ${bottomTop}px)`
      }
    }
    // tip提示靠下 右
    if (position === "bottom-end") {
      if (clientWidth > elementWidth) {
        dynamicCss.value.transform = `translate(${
          x - (clientWidth - elementWidth)
        }px,${bottomTop}px)`
      } else {
        dynamicCss.value.transform = `translate(${
          x + (elementWidth - clientWidth)
        }px, ${bottomTop}px)`
      }
    }
  } else {
    let bottomY = countPositionInt(top + elementHeight + elementDistance)
    // tip提示靠下 左
    if (position === "bottom-start") {
      dynamicCss.value.transform = `translate(${x}px, ${bottomY}px)`
    }
    // tip提示靠下 居中
    if (position === "bottom") {
      if (clientWidth === window.innerWidth - 32) {
        dynamicCss.value.transform = `translate(${elementDistance}px, ${bottomY}px)`
        return
      }
      dynamicCss.value.transform = `translate(${
        x - (clientWidth - elementWidth) / 2
      }px, ${bottomY}px)`
    }
    // tip提示靠下 右
    if (position === "bottom-end") {
      if (clientWidth > elementWidth) {
        dynamicCss.value.transform = `translate(${
          x - (clientWidth - elementWidth)
        }px,${bottomY}px)`
      } else {
        dynamicCss.value.transform = `translate(${
          x + (elementWidth - clientWidth)
        }px, ${bottomY}px)`
      }
    }
  }
}
/**
 * tip靠上是否在视窗内
 * @param tipContentRefDom tip内容元素
 * @param tipRefDom  tip元素
 * @returns  tip是否在视窗内
 */
function ifTopViewport(tipContentRefDom, tipRefDom) {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()
  if (countPositionInt(rect2.top - 16) > countPositionInt(rect.height)) {
    return true
  } else {
    return false
  }
}

/**
 * tip靠下是否在视窗内
 * @param tipContentRefDom tip内容元素
 * @param tipRefDom  tip元素
 * @returns  tip是否在视窗内
 */
function ifBottomViewport(tipContentRefDom, tipRefDom) {
  let rect = tipContentRefDom.getBoundingClientRect()
  let rect2 = tipRefDom.getBoundingClientRect()
  if (
    countPositionInt(window.innerHeight - rect2.y - rect2.height - 16) >
    countPositionInt(rect.height)
  ) {
    return true
  } else {
    return false
  }
}

/**
 * tip靠左、靠右是否在视窗内
 * @param tipRefDom tip内容元素
 * @returns  tip是否在视窗内
 */
function ifRightOrLeftViewport(tipRefDom) {
  let rect = tipRefDom.getBoundingClientRect()
  /**
   * 鼠标移入元素的宽度  是否小于 可视窗口减去 元素的宽度 及 自身宽度
   */
  if (
    countPositionInt(rect.width) >
    countPositionInt(window.innerWidth - (rect.x + rect.width))
  ) {
    return true
  } else {
    return false
  }
}

export default countPosition
