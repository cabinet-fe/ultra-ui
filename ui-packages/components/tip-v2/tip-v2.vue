<template>
  <newSlot
    :vnode="defaultSlot"
    @mouseenter.self="handleMouseOver"
    @mouseleave.self="handleMouseOut"
    @click="handleClick"
    :class="cls.b"
    ref="tipRef"
  />
  <!-- <div
    :class="cls.b"
    ref="tipRef"
    @mouseenter.self="handleMouseOver"
    @mouseleave.self="handleMouseOut"
    @click="handleClick"
  >
    <slot></slot>
  </div> -->

  <!-- 传送门 -->
  <teleport to="body">
    <div
      :class="contentClass"
      v-if="visible"
      :style="dynamicStyle"
      ref="tipContentRef"
      @mouseenter="handleContentMouseOver"
      @mouseleave="handleMouseOut"
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
      <!-- 箭头 -->
      <span :class="arrowClass" :style="arrowStyle"></span>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import type {Undef} from "@ui/utils"
import createSlot from "./createSlot"
import {bem} from "@ui/utils"
import {ref, shallowRef, nextTick, computed, useSlots, onMounted} from "vue"
import countPosition from "./position"

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

const cls = bem("tip-v2")

const slots = useSlots()

// 这里获取到的是默认插槽的vnode，但拿不到对应的dom实例
const defaultSlot = slots.default && slots.default()[0]
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
const handleMouseOver = (e) => {
  if (props.triggerPopUpMode !== "hover") return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(() => {
    visible.value = true
    nextTick(() => {
      mouseEventDom(e)
    })
  }, 100)
}

/**鼠标离开元素 */
const handleMouseOut = () => {
  // if (props.triggerPopUpMode !== "hover") return
  // clearTimeout(timeMouseOut)
  // timeMouseOut = setTimeout(() => {
  //   visible.value = false
  //   dynamicStyle.value = {
  //     opacity: 0,
  //   }
  //   arrowStyle.value = {}
  // }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseOver = () => {
  if (!props.mouseEnterable) return
  clearTimeout(timeMouseOut)
}

const handleClick = (e) => {
  if (props.triggerPopUpMode !== "click") return
  if (visible.value) return
  clearTimeout(timeClick)
  timeClick = setTimeout(() => {
    visible.value = true
    if (visible.value) {
      nextTick(() => {
        mouseEventDom(e)
      })
    } else {
      dynamicStyle.value = {}
      arrowStyle.value = {}
    }
  }, 300)
}

/**鼠标移入/点击元素的dom信息 */
const mouseEventDom = async(e) => {
  await nextTick()
  /**页面元素的DOM信息 */
  const tipRefDom = tipRef.value
  
  if (!tipRefDom) return
  console.log(tipRefDom.vnode);

  let {x} = tipRefDom?.getBoundingClientRect()

  let {clientWidth, clientHeight, offsetLeft} = tipRefDom
  console.log(clientWidth, clientHeight, offsetLeft);
  
  /**赋值为了计算元素超出屏幕设置宽度后的真实高度 */
  if (
    props.position.indexOf("top") > -1 ||
    props.position.indexOf("bottom") > -1
  ) {
    dynamicStyle.value.maxWidth = `calc(100vw - ${offsetLeft + 20 + 240}px)`
  } else {
    dynamicStyle.value.maxWidth = `calc(${x - 26}px)`
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
      // ...{
      //   maxWidth:
      //     props.position.indexOf("top") > -1 ||
      //     props.position.indexOf("bottom") > -1
      //       ? `calc(100vw - ${offsetLeft + 24 + 240}px)`
      //       : dynamicCss.value.maxWidth,
      // },
    }
    arrowStyle.value = {
      ...arrowCss.value,
      ...(whetherLightTheme ? {} : props.customStyle),
    }
    console.log(dynamicStyle.value, "dynamicStyledynamicStyle")
  })
}
const newSlot = createSlot({handleMouseOver, handleMouseOut, handleClick})

// 在组件挂载后调用
onMounted(() => {})
</script>
