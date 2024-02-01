import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"

interface PositionResult {
  dynamicCss: Record<string, any>
  arrowCss: Record<string, any>
}

/**每次初始化默认 */
let componentCss = {}

/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({})

/**箭头位置/朝向 */
let arrowCss = shallowRef<Record<string, any>>({})

/**
 * 计算弹窗显示位置
 * @param position 弹窗位置
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * @param tipRefDom 页面元素DOM信息
 * @param tipContentRefDom tip提示的DOM信息
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
  arrowCss.value = {}
  dynamicCss.value = {
    zIndex: zIndex(),
  }

  return new Promise((resolve) => {
    nextTick(() => {
      arrowCss.value = componentCss
      dynamicCss.value = {...dynamicCss.value, ...componentCss}

      //页面元素的DOM信息
      let {offsetLeft} = tipRefDom

      // 弹窗显示的DOM信息
      let {clientWidth, clientHeight} = tipContentRefDom
      if (position) {
        if (position === "top" || position === "bottom") {
          dynamicCss.value.left = "50%"
          dynamicCss.value.transform = "translateX(-50%)"
          arrowCss.value.left = "50%"
          arrowCss.value.transform = "rotate(45deg) translateX(-50%)"
        }
        position.indexOf("top") > -1 &&
          topCount(position, clientHeight, clientWidth, elementWidth)
        position.indexOf("left") > -1 &&
          leftCount(position, clientHeight, elementWidth, offsetLeft)
        position.indexOf("right") > -1 &&
          rightCount(position, clientHeight, elementWidth, offsetLeft)
        position.indexOf("bottom") > -1 &&
          bottomCount(
            position,
            clientHeight,
            clientWidth,
            elementWidth,
            elementHeight
          )
      }
      resolve({dynamicCss, arrowCss})
    })
  })
}
/**
 * tip靠上计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 */
function topCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number
): void {
  dynamicCss.value.top = -(clientHeight + 16) + "px"

  // tip提示靠上 左
  if (position === "top-start") {
    // 箭头样式
    arrowCss.value.top = `calc(${clientHeight - 5}px)`
    if (clientWidth > elementWidth) {
      arrowCss.value.left = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.right = clientWidth / 2 - 7 + "px"
    }
  }
  // tip提示靠上 居中
  if (position === "top") {
    arrowCss.value.top = `calc(${clientHeight - 2}px + 0.5px)`
  }
  // tip提示靠上 右
  if (position === "top-end") {
    dynamicCss.value.right = 0
    arrowCss.value.top = `calc(${clientHeight - 6}px + 0.5px)`
    console.log("arrowCss:", arrowCss.value.top)

    if (clientWidth > elementWidth) {
      arrowCss.value.right = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.left = clientWidth / 2 - 7 + "px"
    }
  }
}

/**
 * tip靠右计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param elementWidth 页面元素宽度
 * @param offsetLeft 页面元素距离左边的距离
 */
function rightCount(
  position: string,
  clientHeight: number,
  elementWidth: number,
  offsetLeft: number
): void {
  dynamicCss.value.left = elementWidth + 14 + "px"
  arrowCss.value.left = `calc(-5px)`
  arrowCss.value.top = clientHeight / 2 - 5 + "px"

  if (position === "right-start") {
    dynamicCss.value.top = 0 + "px"
  }

  if (position === "right") {
    dynamicCss.value.top = "50%"
    dynamicCss.value.transform = "translateY(-50%)"
  }

  if (position === "right-end") {
    dynamicCss.value.bottom = 0 + "px"
  }

  dynamicCss.value.maxWidth = `calc(100vw - ${offsetLeft + 150}px)`
}

/**
 * tip靠左计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param elementWidth 页面元素宽度
 * @param offsetLeft 页面元素距离左边的距离
 *
 */
function leftCount(
  position: string,
  clientHeight: number,
  elementWidth: number,
  offsetLeft: number
): void {
  dynamicCss.value.right = elementWidth + 14 + "px"
  arrowCss.value.right = `calc(-5px)`
  arrowCss.value.top = clientHeight / 2 - 5 + "px"

  if (position === "left-start") {
    dynamicCss.value.top = 0 + "px"
  }

  if (position === "left") {
    dynamicCss.value.top = "50%"
    dynamicCss.value.transform = "translateY(-50%)"
  }

  if (position === "left-end") {
    dynamicCss.value.bottom = 0 + "px"
  }
  console.log(offsetLeft)

  dynamicCss.value.maxWidth = `calc(${offsetLeft - (elementWidth/2/2)}px)`
}

/**
 * tip靠下计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 * @param elementWidth 页面元素高度
 */
function bottomCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number,
  elementHeight: number
): void {
  dynamicCss.value.bottom = `calc(-${clientHeight + 14}px + 0.5px)`
  // tip提示靠下 左
  if (position === "bottom-start") {
    arrowCss.value.bottom = `calc(${clientHeight - 5}px + 0.5px)`
    // 箭头样式
    if (clientWidth > elementWidth) {
      arrowCss.value.left = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.right = clientWidth / 2 - 7 + "px"
    }
  }
  // tip提示靠下 居中
  if (position === "bottom") {
    arrowCss.value.bottom = `calc(${clientHeight - 9}px + 0.5px)`
  }
  // tip提示靠下 右
  if (position === "bottom-end") {
    arrowCss.value.bottom = `calc(${clientHeight - 5}px + 0.5px)`
    dynamicCss.value.right = 0
    if (clientWidth > elementWidth) {
      arrowCss.value.right = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.left = clientWidth / 2 - 7 + "px"
    }
  }
}

export default countPosition
