<template>
  <div
    :class="cls.b"
    ref="tipRef"
    @mouseenter.self="handleMouseOver"
    @mouseleave.self="handleMouseOut"
    @click="handleClick"
  >
    <!-- 点击元素 -->
    <slot />
    <!-- tip提示框 -->
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-show="visible"
      @mouseenter.stop="handleContentMouseOver"
      @mouseleave.stop="handleMouseOut"
      @clic.stop
      v-click-outside="handleClickOutside"
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import {bem, nextFrame, setStyles} from "@ui/utils"
import {ref, shallowRef, nextTick, computed} from "vue"
import calcPosition from "./position"
import vClickOutside from "@ui/directives/click-outside"

defineOptions({
  name: "Tip",
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: "提示内容",
  triggerPopUpMode: "hover",
  position: "top",
  theme: "dark",
  mouseEnterable: true,
})

const cls = bem("tip")

/**是否浅色主题 */
const whetherLightTheme = props.theme === "light"

/**tip弹窗class */
const contentClass = computed(() => {
  return [
    cls.e("content"),
    bem.is("content-light", whetherLightTheme),
    bem.is(props.position),
  ]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<HTMLElement>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = ref(false)

let timeClick = Number(0)

let timeMouseOut = Number(0)

let timeMouseOver = Number(0)

/**弹窗style样式 */
let dynamicStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseOver = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(async () => {
    visible.value = true
    await nextTick()
    mouseEventDom()
  }, 100)
}

/**鼠标离开元素 */
const handleMouseOut = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOut)
  timeMouseOut = setTimeout(() => {
    tipContentRef.value!.style.opacity = "0"
    visible.value = false
    dynamicStyle.value = {}
  }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseOver = () => {
  if (!props.mouseEnterable) return
  clearTimeout(timeMouseOut)
  clearTimeout(timeMouseOver)
}

const handleClick = () => {
  if (props.triggerPopUpMode !== "click") return
  clearTimeout(timeClick)
  timeClick = setTimeout(async () => {
    visible.value = !visible.value
    if (visible.value) {
      await nextTick()
      mouseEventDom()
    } else {
      tipContentRef.value!.style.opacity = "0"
      dynamicStyle.value = {}
    }
  }, 300)
}

const handleClickOutside = () => {
  if (props.triggerPopUpMode === "hover") return
  visible.value = false
}

/**鼠标移入/点击元素的dom信息 */
const mouseEventDom = async () => {
  /**页面元素的DOM信息 */
  const tipRefDom = tipRef.value
  if (!tipRefDom) return

  let tipContentRefDom = tipContentRef.value
  if (!tipContentRefDom) return

  let {offsetLeft} = tipRefDom
  /**赋值为了计算元素超出屏幕设置宽度后的真实高度 */
  if (props.position.match(/bottom|top/)) {
    tipContentRefDom.style.maxWidth = `calc(100vw - ${offsetLeft + 256}px)`
  }

  nextFrame(async () => {
    /**tip提示的DOM信息 */
    const positionParams = {
      position: props.position,
      tipRefDom,
      tipContentRefDom,
    }
    const {dynamicCss} = await calcPosition(positionParams)

    setStyles(tipContentRefDom, {
      ...dynamicCss.value,
      ...(whetherLightTheme ? {} : props.customStyle),
      maxWidth: props.position.match(/bottom|top/)
        ? `calc(100vw - ${offsetLeft + 256}px)`
        : dynamicCss.value.maxWidth,
    })
  })
}
</script>
