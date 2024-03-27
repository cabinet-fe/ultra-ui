<template>
  <UNodeRender
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseEnter"
    @mouseleave.self="handleMouseLeave"
    @click.self="handleClick"
    :class="cls.b"
    ref="tipRef"
    :data-outSide="visible"
  />

  <teleport to="body">
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-if="visible"
      @mouseenter.stop="handleContentMouseEnter"
      @mouseleave.stop="handleMouseLeave"
      @click.stop
      v-click-outside:visible="handleClickOutside"
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
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
  onMounted,
} from "vue"
import calcPosition from "./position"
import vClickOutside from "@ui/directives/click-outside"
import {UNodeRender} from "../node-render"
import {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth,
} from "./calculate"
import type {ScrollDirection} from "./type"

defineOptions({
  name: "Tip",
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: "提示内容",
  trigger: "hover",
  position: "top",
  mouseEnterable: true,
})

const cls = bem("tip")

const slots = useSlots()

/**tip弹窗class */
const contentClass = computed(() => {
  return [cls.e("content"), bem.is(props.position)]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<HTMLElement>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = shallowRef(false)

let timerTip = 0

let timerMouseEnter = 0

let timerMouseLeave = 0

/**弹窗style样式 */
let dynamicStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseEnter = () => {
  if (props.trigger !== "hover") return
  clearTimeout(timerMouseEnter)
  timerMouseEnter = setTimeout(async () => {
    visible.value = true
    await nextTick()
    popup()
  }, 100)
}

/**鼠标离开元素 */
const handleMouseLeave = () => {
  if (props.trigger !== "hover") return
  clearTimeout(timerMouseLeave)
  timerMouseLeave = setTimeout(() => {
    tipContentRef.value!.style.opacity = "0"
    dynamicStyle.value = {}
    visible.value = false
  }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseEnter = () => {
  if (!props.mouseEnterable) return
  clearTimeout(timerMouseLeave)
  clearTimeout(timerMouseEnter)
}

const handleClick = () => {
  if (props.trigger !== "click") return
  clearTimeout(timerTip)
  timerTip = setTimeout(async () => {
    console.log("123123")

    visible.value = !visible.value
    if (visible.value) {
      await nextTick()
      popup()
    } else {
      tipContentRef.value!.style.opacity = "0"
      dynamicStyle.value = {}
    }
  }, 100)
}

const handleClickOutside = () => {
  if (timerTip) clearInterval(timerTip)
  if (props.trigger === "hover") return
  visible.value = false
}

/** 提示框到屏幕边缘的间距 */
const gap = 16

/**屏幕大小 */
const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const setPositionParams = (maxWidth) => {
  const tipContentRefDom = tipContentRef.value
  setStyles(tipContentRefDom!, {
    maxWidth,
  })
}
/**tip弹出 */
const popup = (scrollDirection?: ScrollDirection) => {
  // 获取页面元素的DOM信息
  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return

  // 获取元素的位置和大小信息
  const {clientWidth, clientHeight} = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  // 计算弹出层样式
  let maxWidth
  if (props.position.match(/^(top|bottom)/)) {
    maxWidth = calculateMaxWidth(rect, props.position, gap)
  } else if (props.position.match(/^right/)) {
    maxWidth = calculateRightMaxWidth(gap, screenSize.width, rect.width, rect.x)
  } else if (props.position.match(/^left/)) {
    maxWidth = calculateLeftMaxWidth(gap, screenSize.width, rect.width, rect.x)
  }

  if (maxWidth) {
    setPositionParams(maxWidth)
  }

  // 将计算出的样式作用于弹出内容元素上，并显示
  nextFrame(async () => {
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom,
      scrollDirection: scrollDirection!,
    }
    const {dynamicCss} = await calcPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...props.customStyle,
    }
    setStyles(tipContentRefDom, dynamicStyle.value)
  })
}

let scrollDom = shallowRef<HTMLElement | null>()

let lastScrollTop = 0

const onScroll = () => {
  const tipRefDom = tipRef.value?.$el as HTMLElement
  scrollDom.value = tipRefDom.closest("main")
  if (!scrollDom.value) return
  scrollDom.value.addEventListener("scroll", () => {
    const currentScrollTop = scrollDom.value ? scrollDom.value.scrollTop : 0
    const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up"
    popup(scrollDirection)
    lastScrollTop = currentScrollTop
  })
}
onMounted(() => {
  onScroll()
})

onBeforeUnmount(() => {
  if (scrollDom.value) {
    scrollDom.value.removeEventListener("scroll", () => {})
  }
})
</script>
