<template>
  <!-- <div style="position: relative;width: auto;"> -->
  <div
    :class="cls.b"
    ref="tipRef"
    @mouseenter.stop="handleMouseOver"
    @mouseleave.stop="handleMouseOut"
    @click="handleClick"
  >
    <slot />
    <div
      :class="[cls.e('content'), cls.e(position)]"
      v-show="visible"
      :style="dynamicStyle"
      ref="tipContentRef"
    >
      {{ position }}
      <slot name="content">
        {{ modelValue }}
      </slot>
      <!-- 箭头 -->
      <span :class="[cls.e('arrow')]" :style="arrowStyle"></span>
    </div>
  </div>

  <!-- </div> -->
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import type {Undef} from "@ui/utils"
import {bem} from "@ui/utils"
import {ref, shallowRef, nextTick} from "vue"
import countPosition from "./position"

defineOptions({
  name: "Tip",
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: "提示内容",
  triggerPopUpMode: "hover",
  position: "top",
})

const cls = bem("tip")

/**页面元素的DOM信息 */
let tipRef = shallowRef<HTMLElement>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

let visible = ref(false)

let timeClick: Undef<number> = undefined

let timeMouseOut: Undef<number> = undefined
console.log(timeMouseOut)

let timeMouseOver: Undef<number> = undefined

let dynamicStyle = shallowRef<Record<string, any>>({})

let arrowStyle = shallowRef<Record<string, any>>({})

const handleMouseOver = () => {
  console.log(props.position)
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(() => {
    visible.value = true
    mouseEventDom()
  }, 300)
}

const handleMouseOut = () => {
  if (props.triggerPopUpMode !== "hover") return
  // clearTimeout(timeMouseOut)
  // timeMouseOut = setTimeout(() => {
  //   visible.value = false
  //   dynamicStyle.value = {}
  //   arrowStyle.value = {}
  // }, 300)
}

const handleClick = () => {
  if (props.triggerPopUpMode !== "click") return
  clearTimeout(timeClick)
  timeClick = setTimeout(() => {
    visible.value = !visible.value
    if (visible.value) mouseEventDom()
  }, 300)
}

/**鼠标移入/点击元素的dom信息 */
const mouseEventDom = () => {
  /**页面元素的DOM信息 */
  const tipRefDom = tipRef.value
  if (!tipRefDom) return

  let {clientHeight, clientWidth} = tipRefDom

  nextTick(async () => {
    /**tip提示的DOM信息 */
    const tipContentRefDom = tipContentRef.value
    if (!tipContentRefDom) return

    const positionParams = {
      position: props.position,
      elementHeight: clientHeight,
      elementWidth: clientWidth,
      tipContentRefDom,
    }

    const {dynamicCss, arrowCss} = await countPosition(positionParams)
    dynamicStyle.value = {...dynamicCss.value, ...props.customStyle}
    arrowStyle.value = {...arrowCss.value, ...props.customStyle}
  })
}
</script>
