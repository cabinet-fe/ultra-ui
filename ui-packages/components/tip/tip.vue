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
      v-if="visible"
      :style="dynamicStyle"
      ref="tipContentRef"
      @mouseenter="handleContentMouseOver"
      @mouseleave="handleMouseOut"
      @click="
        (e) => {
          e.stopPropagation()
        }
      "
      v-click-outside="handleClickOutside"
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
      <!-- 箭头 -->
      <span :class="arrowClass" :style="arrowStyle"></span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import type {Undef} from "@ui/utils"
import {bem} from "@ui/utils"
import {ref, shallowRef, nextTick, computed} from "vue"
import countPosition from "./position"
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

/**箭头浅色样式 */
const arrowClass = computed(() => {
  return [
    cls.e("arrow"),
    bem.is("arrow-light", whetherLightTheme),
    bem.is(
      "arrow-bottom",
      whetherLightTheme && props.position.indexOf("top") > -1
    ),
    bem.is(
      "arrow-left",
      whetherLightTheme && props.position.indexOf("right") > -1
    ),
    bem.is(
      "arrow-top",
      whetherLightTheme && props.position.indexOf("bottom") > -1
    ),
    bem.is(
      "arrow-right",
      whetherLightTheme && props.position.indexOf("left") > -1
    ),
  ]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<HTMLElement>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = ref(false)

let timeClick: Undef<number> = undefined

let timeMouseOut: Undef<number> = undefined

let timeMouseOver: Undef<number> = undefined

/**弹窗style样式 */
let dynamicStyle = ref<Record<string, any>>({})

/**箭头style样式 */
let arrowStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseOver = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(() => {
    visible.value = true
    nextTick(() => {
      mouseEventDom()
    })
  }, 100)
}

/**鼠标离开元素 */
const handleMouseOut = () => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOut)
  timeMouseOut = setTimeout(() => {
    visible.value = false
    dynamicStyle.value = {
      opacity: 0,
    }
    arrowStyle.value = {}
  }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseOver = () => {
  if (!props.mouseEnterable) return
  clearTimeout(timeMouseOut)
}

const handleClick = () => {
  if (props.triggerPopUpMode !== "click") return

  clearTimeout(timeClick)
  timeClick = setTimeout(() => {
    visible.value = !visible.value
    if (visible.value) {
      nextTick(() => {
        mouseEventDom()
      })
    } else {
      dynamicStyle.value = {}
      arrowStyle.value = {}
    }
  }, 300)
}

const handleClickOutside = () => {
  if (props.triggerPopUpMode === "hover") return
  console.log("隐藏弹窗")
  visible.value = false
}

/**鼠标移入/点击元素的dom信息 */
const mouseEventDom = () => {
  /**页面元素的DOM信息 */
  const tipRefDom = tipRef.value
  if (!tipRefDom) return
  let {clientWidth, clientHeight, offsetLeft} = tipRefDom
  console.log(offsetLeft + 240,'---');
  
  /**赋值为了计算元素超出屏幕设置宽度后的真实高度 */
  if (
    props.position.indexOf("top") > -1 ||
    props.position.indexOf("bottom") > -1
  ) {
    dynamicStyle.value.maxWidth = `calc(100vw - ${offsetLeft + 256}px)`
  }

  /**tip提示的DOM信息 */
  const tipContentRefDom = tipContentRef.value
  if (!tipContentRefDom) return

  const positionParams = {
    position: props.position,
    elementWidth: clientWidth,
    elementHeight: clientHeight,
    tipRefDom,
    tipContentRefDom,
  }

  nextTick(async () => {
    const {dynamicCss, arrowCss} = await countPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...(whetherLightTheme ? {} : props.customStyle),
      ...{
        maxWidth:
          props.position.indexOf("top") > -1 ||
          props.position.indexOf("bottom") > -1
            ? `calc(100vw - ${offsetLeft + 256}px)`
            : dynamicCss.value.maxWidth,
      },
    }
    console.log(dynamicStyle.value);
    
    arrowStyle.value = {
      ...arrowCss.value,
      ...(whetherLightTheme ? {} : props.customStyle),
    }
  })
}
</script>
