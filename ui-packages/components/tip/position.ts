import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"

interface PositionResult {
  dynamicCss: Record<string, any>
}

/**每次初始化默认 */
let componentCss = {}

/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({})

/**统一间距 */
let spacing = 16

/**
 * 计算弹窗显示位置
 * @param position 弹窗位置
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * @param tipRefDom 页面元素DOM信息
 * @param tipContentRefDom tip提示的DOM信息
 * @returns dynamicCss: 弹窗样式
 */
function calcPosition({
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

      //页面元素的DOM信息
      let {offsetLeft} = tipRefDom

      // 弹窗显示的DOM信息
      let {clientHeight} = tipContentRefDom
      if (position) {
        if (position === "top" || position === "bottom") {
          dynamicCss.value.left = "50%"
          dynamicCss.value.transform = "translateX(-50%)"
        }
        position.includes("top") && topCount(position, clientHeight)
        position.includes("left") &&
          leftCount(position, elementWidth, offsetLeft)
        position.includes("right") &&
          rightCount(position, elementWidth, offsetLeft)
        position.includes("bottom") && bottomCount(position, clientHeight)
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
 */
function topCount(position: string, clientHeight: number): void {
  dynamicCss.value.top = -(clientHeight + spacing) + "px"

  // tip提示靠上 右
  if (position === "top-end") {
    dynamicCss.value.right = "0px"
  }
}

/**
 * tip靠右计算方法
 * @param position 位置
 * @param elementWidth 页面元素宽度
 * @param offsetLeft 页面元素距离左边的距离
 */
function rightCount(
  position: string,
  elementWidth: number,
  offsetLeft: number
): void {
  dynamicCss.value.left = elementWidth + spacing + "px"

  if (position === "right-start") {
    dynamicCss.value.top = "0px"
  }

  if (position === "right") {
    dynamicCss.value.top = "50%"
    dynamicCss.value.transform = "translateY(-50%)"
  }

  if (position === "right-end") {
    dynamicCss.value.bottom = "0px"
  }

  dynamicCss.value.maxWidth = `calc(100vw - ${offsetLeft + 140 + 240}px)`
}

/**
 * tip靠左计算方法
 * @param position 位置
 * @param elementWidth 页面元素宽度
 * @param offsetLeft 页面元素距离左边的距离
 *
 */
function leftCount(
  position: string,
  elementWidth: number,
  offsetLeft: number
): void {
  dynamicCss.value.right = elementWidth + spacing + "px"

  if (position === "left-start") {
    dynamicCss.value.top = "0px"
  }

  if (position === "left") {
    dynamicCss.value.top = "50%"
    dynamicCss.value.transform = "translateY(-50%)"
  }

  if (position === "left-end") {
    dynamicCss.value.bottom = "0px"
  }

  dynamicCss.value.maxWidth = `calc(${offsetLeft - elementWidth / 2 / 2}px)`
}

/**
 * tip靠下计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 */
function bottomCount(position: string, clientHeight: number): void {
  dynamicCss.value.bottom = `calc(-${clientHeight + 16}px)`
  // tip提示靠下 右
  if (position === "bottom-end") {
    dynamicCss.value.right = "0px"
  }
}

export default calcPosition
