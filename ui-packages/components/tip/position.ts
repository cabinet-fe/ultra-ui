import {zIndex} from "@ui/utils"
import {nextTick, shallowRef} from "vue"

/**每次初始化默认 */
let componentCss = {}
/**弹出样式 */
let dynamicCss = shallowRef<Record<string, any>>({
  zIndex: zIndex(),
  opactiy: 0,
})

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
}): Promise<{
  dynamicCss: Record<string, any>
  arrowCss: Record<string, any>
}> {
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

      if (position?.indexOf("top") > -1) {
        dynamicCss.value.top = -(clientHeight + 16) + "px"
        // 箭头样式
        arrowCss.value.top = clientHeight - 7 + "px"
        if (clientWidth > elementWidth) {
          arrowCss.value.right = elementWidth / 2 - 7 + "px"
        } else {
          arrowCss.value.right = clientWidth / 2 - 7 + "px"
        }
      }
      // tip提示靠上 左
      if (position === "top-start") {
      }
      // tip提示靠上 居中
      if (position === "top") {
        // 弹窗居中
      }
      // tip提示靠上 右
      if (position === "top-end") {
        // 弹窗靠左
        // 弹窗居中
      }
      if (position?.indexOf("right") > -1) {
        dynamicCss.value.right = -clientWidth + "px"
        dynamicCss.value.top = 0 + "px"

        // 箭头样式
        arrowCss.value.top = clientHeight / 2 - 5 + "px"
        arrowCss.value.left = -5 + "px"
      }

      if (position?.indexOf("left") > -1) {
        dynamicCss.value.left = -clientWidth + "px"
        dynamicCss.value.top = 0 + "px"

        // 箭头样式
        arrowCss.value.top = clientHeight / 2 - 5 + "px"
        arrowCss.value.right = -5 + "px"
      }

      dynamicCss.value.opactiy = 1
      console.log(arrowCss.value, dynamicCss.value)
      resolve({dynamicCss, arrowCss})
    })
  })
}

export default countPosition
