import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"

/**每次初始化默认 */
let componentCss = {}
/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({
  zIndex: zIndex(),
})

interface PositionResult {
  dynamicCss: Record<string, any>
  arrowCss: Record<string, any>
}

/**箭头位置/朝向 */
let arrowCss = shallowRef<Record<string, any>>({})

/**
 * 计算弹窗显示位置
 * @param position 弹窗位置
 * @param elementHeight 页面元素高度
 * @param elementWidth 页面元素宽度
 * @param tipContentRefDom tip提示的DOM信息
 * @returns dynamicCss: 弹窗样式, arrowCss: 箭头样式
 *
 */
function countPosition({
  position,
  elementHeight,
  elementWidth,
  tipContentRefDom,
}: {
  position: string
  elementHeight: number
  elementWidth: number
  tipContentRefDom: HTMLElement
}): Promise<PositionResult> {
  componentCss = {
    left: undefined as string | undefined,
    top: undefined as string | undefined,
    right: undefined as string | undefined,
    bottom: undefined as string | undefined,
    background: "#ddd",
  }
  arrowCss.value = {}
  dynamicCss.value = {}

  return new Promise((resolve) => {
    nextTick(() => {
      arrowCss.value = componentCss
      dynamicCss.value = {...dynamicCss.value, ...componentCss}

      // 弹窗显示的DOM信息
      let {clientWidth, clientHeight} = tipContentRefDom

      // tip提示靠上
      if (position?.indexOf("top") > -1) {
        dynamicCss.value.top = -(clientHeight + 16) + "px"
        topCount(position, clientHeight, clientWidth, elementWidth)
      }
      // tip提示靠右
      if (position?.indexOf("right") > -1) {
        rigntCount(position, clientHeight, clientWidth, elementWidth,elementHeight)
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
 * @returns dynamicCss: 弹窗样式, arrowCss: 箭头样式
 */
function topCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number
): PositionResult {
  // tip提示靠上 左
  if (position === "top-start") {
    // 箭头样式
    arrowCss.value.top = clientHeight - 7 + "px"
    if (clientWidth > elementWidth) {
      arrowCss.value.left = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.right = clientWidth / 2 - 7 + "px"
    }
  }
  // tip提示靠上 居中
  if (position === "top") {
    arrowCss.value.top = clientHeight - 4 + "px"
    dynamicCss.value.left = "50%"
    dynamicCss.value.transform = "translateX(-50%)"
    arrowCss.value.left = "50%"
    arrowCss.value.transform = "rotate(45deg) translateX(-50%)"
  }
  // tip提示靠上 右
  if (position === "top-end") {
    dynamicCss.value.right = 0
    arrowCss.value.top = clientHeight - 7 + "px"
    if (clientWidth > elementWidth) {
      arrowCss.value.right = elementWidth / 2 - 7 + "px"
    } else {
      arrowCss.value.left = clientWidth / 2 - 7 + "px"
    }
  }
  return {dynamicCss, arrowCss}
}

/**
 * tip靠右计算方法
 * @param position 位置
 * @param clientHeight tip元素高度
 * @param clientWidth tip元素宽度
 * @param elementWidth 页面元素宽度
 * @param elementHeight 页面元素高度
 * 
 * @returns dynamicCss: 弹窗样式, arrowCss: 箭头样式
 */
function rigntCount(
  position: string,
  clientHeight: number,
  clientWidth: number,
  elementWidth: number,
  elementHeight:number
): PositionResult {
  // tip提示靠右
  if (position?.indexOf("right") > -1) {
    dynamicCss.value.left = elementWidth + 14 + "px"
    // // 箭头样式
    arrowCss.value.left = -5 + "px"
    arrowCss.value.top = clientHeight / 2 - 5 + "px"
  }
  if(position === 'right-start'){
    dynamicCss.value.top = 0 + "px"
  }

  if(position === 'right'){
    dynamicCss.value.top = "50%"
    dynamicCss.value.transform = "translateY(-50%)"
  }

  if(position === 'right-end'){
    dynamicCss.value.bottom = 0 + "px"
  }

  return {dynamicCss, arrowCss}
}

export default countPosition



// if (position?.indexOf("left") > -1) {
//   dynamicCss.value.left = -clientWidth + "px"
//   dynamicCss.value.top = 0 + "px"

//   // 箭头样式
//   arrowCss.value.top = clientHeight / 2 - 5 + "px"
//   arrowCss.value.right = -5 + "px"
// }