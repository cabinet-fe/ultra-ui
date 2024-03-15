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
  <!-- {{ dynamicStyle }} -->
  <teleport to="body">
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-if="visible"
      @mouseenter.stop="handleContentMouseOver"
      @mouseleave.stop="handleMouseOut"
      @clic.stop
      v-click-outside="handleClickOutside"
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import type {TipProps} from "@ui/types/components/tip"
import {bem, nextFrame, setStyles} from "@ui/utils"
import {
  ref,
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
} from "vue"
import calcPosition from "./position"
import vClickOutside from "@ui/directives/click-outside"
import createSlot from "./createSlot"

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
  return

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
  const tipRefDom = tipRef.value?.$el
  if (!tipRefDom) return

  let tipContentRefDom = tipContentRef.value
  if (!tipContentRefDom) return

  let {clientWidth, clientHeight, offsetLeft} = tipRefDom
  console.log(offsetLeft);

  /**赋值为了计算元素超出屏幕设置宽度后的真实高度 */
  if (props.position.match(/top-start|bottom|/)) {
    tipContentRefDom.style.maxWidth = `calc(100vw - ${offsetLeft + 256}px)`
  }
  if (props.position.match(/top-end/)) {
    tipContentRefDom.style.maxWidth = `${offsetLeft + clientWidth + 240 - 16}px`
  }
  if (props.position.match(/right/)) {
    
    let rect = tipRefDom.getBoundingClientRect()
    if (rect.width > window.innerWidth - (rect.x + rect.width)) {
      tipContentRefDom.style.maxWidth = `calc(${offsetLeft + 240 - 32}px)`
    } else {
      tipContentRefDom.style.maxWidth = `calc(100vw - ${
        tipRefDom.getBoundingClientRect().x + clientWidth + 32
      }px)`
    }
    console.log(tipContentRefDom.style.maxWidth,'tipContentRefDom.style.maxWidthtipContentRefDom.style.maxWidth');
    
  }

  nextFrame(async () => {
    /**tip提示的DOM信息 */
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom,
    }
    const {dynamicCss} = await calcPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...(whetherLightTheme ? {} : props.customStyle),
    }
    setStyles(tipContentRefDom, dynamicStyle.value)
    onScroll(tipRefDom)
  })
}
const newSlot = createSlot({handleMouseOver, handleMouseOut, handleClick})

let scrollDom = shallowRef<HTMLElement | null>()

const onScroll = (content: HTMLElement) => {
  scrollDom.value = content.closest("main")
  if (!scrollDom.value) return
  scrollDom.value.addEventListener("scroll", mouseEventDom)
}

onBeforeUnmount(() => {
  if (scrollDom.value) {
    scrollDom.value.removeEventListener("scroll", mouseEventDom)
  }
})
</script>
