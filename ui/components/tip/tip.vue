<template>
  <UNodeRender
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseEnter"
    @mouseleave.self="handleMouseLeave"
    @click="handleClick"
    :class="cls.b"
    ref="tipRef"
  />
  <teleport to="body">
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-if="visible"
      @mouseenter.stop="handleContentMouseEnter"
      @mouseleave.stop="handleContentMouseLeave"
      @click.stop
      v-click-outside="handleClickOutside"
    >
      <slot name="content">
        {{ content }}
      </slot>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import type { TipProps,_TipExposed} from "@ui/types/components/tip"
import { bem, nextFrame, setStyles } from "@ui/utils"
import {
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
  watch,
  ref,
} from "vue"
import calcPosition from "./position"
import { vClickOutside } from "@ui/directives"
import { UNodeRender } from "../node-render"
import {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth,
  isOverflown,
} from "./calculate"
import type { ScrollDirection } from "./type"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"

defineOptions({
  name: "Tip",
})

const props = withDefaults(defineProps<TipProps>(), {
  content: "提示内容",
  trigger: "hover",
  position: "top",
  mouseEnterable: true,
  mouseLeaveClose:true
})

let tipShowRef = ref<HTMLElement[]>([])

const cls = bem("tip")

const slots = useSlots()

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
})

/**tip弹窗class */
const contentClass = computed(() => {
  return [
    cls.e("content"),
    bem.is(props.position),
    cls.m(size.value),
    bem.is("hide", animation.value),
  ]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<InstanceType<typeof UNodeRender>>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = shallowRef(false)

/**执行动画之后 */
let animation = shallowRef(false)

/**鼠标是否在tip区域 */
let isMouseInTip = ref(false)

// 使用Map管理所有定时器，便于统一清理
const timers = new Map<string, number>()

/**弹窗style样式 */
let dynamicStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseEnter = () => {
  isMouseInTip.value = true
  animation.value = false
  if (props.trigger !== "hover") return
  clearTimeout(timers.get("timerMouseEnter"))
  timers.set(
    "timerMouseEnter",
    setTimeout(async () => {
      if (isMouseInTip.value) {
        visible.value = true
        await nextTick()
        addListener()
        popup()
      }
    }, 300)
  )
}

/**鼠标离开元素 */
const handleMouseLeave = () => {
  if(!props.mouseLeaveClose) return
  isMouseInTip.value = false
  if (props.trigger !== "hover") return
  clearTimeout(timers.get("timerMouseLeave"))
  timers.set(
    "timerMouseLeave",
    setTimeout(() => {
      if (!isMouseInTip.value) {
        animation.value = true
        removeAllListeners()
      }
    }, 500)
  )
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseEnter = () => {
  isMouseInTip.value = true
  animation.value = false
  if (!props.mouseEnterable) return
  timers.forEach(clearTimeout)
}

/**鼠标离开弹窗内容区域 */
const handleContentMouseLeave = () => {
  if(!props.mouseLeaveClose) return
  isMouseInTip.value = false
  if (props.trigger !== "hover") return
  clearTimeout(timers.get("timerMouseLeave"))
  timers.set(
    "timerMouseLeave",
    setTimeout(() => {
      if (!isMouseInTip.value) {
        animation.value = true
        removeAllListeners()
      }
    }, 500)
  )
}

/**点击触发 */
const handleClick = () => {
  if (props.trigger !== "click") return
  animation.value = visible.value
  clearTimeout(timers.get("timerTip"))
  timers.set(
    "timerTip",
    setTimeout(async () => {
      visible.value = !visible.value
      if (visible.value) {
        await nextTick()
        addListener()
        popup()
      } else {
        removeAllListeners()
      }
    }, 300)
  )
}

/**点击外部触发 */
const handleClickOutside = () => {
  if (props.trigger === "hover") return
  animation.value = true
  clearTimeout(timers.get("timerTip"))
  clearTimeout(timers.get("outside"))
  timers.set(
    "outside",
    setTimeout(async () => {
      visible.value = false
      removeAllListeners()
    }, 501)
  )
}

/** 提示框到屏幕边缘的间距 */
const gap = 8

/**页面滚动元素大小 */
const screenSize = {
  width: 0,
  height: 0,
}

const setPositionParams = (maxWidth) => {
  const tipContentRefDom = tipContentRef.value
  setStyles(tipContentRefDom!, {
    maxWidth,
  })
}

/**tip弹出 */
const popup = (scrollDirection?: ScrollDirection) => {
  screenSize.width = scrollDom.value?.clientWidth!
  screenSize.height = scrollDom.value?.clientHeight!

  // 获取页面元素的DOM信息
  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return
  // 获取元素的位置和大小信息
  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  // 计算弹出层样式
  let maxWidth
  if (props.position.match(/^(top|bottom)/)) {
    maxWidth = calculateMaxWidth(window.innerWidth, rect, props.position, gap)
  } else if (props.position.match(/^right/)) {
    maxWidth = calculateRightMaxWidth(
      gap,
      window.innerWidth,
      rect.width,
      rect.x
    )
  } else if (props.position.match(/^left/)) {
    maxWidth = calculateLeftMaxWidth(gap, window.innerWidth, rect.width, rect.x)
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
      screenSize,
      scrollDom: scrollDom.value!,
      gap,
    }
    const { dynamicCss } = await calcPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...props.customStyle,
    }
    // 判断元素超出父元素scrollDom隐藏弹窗
    if (isOverflown(tipRefDom, scrollDom.value!)) {
      setStyles(tipContentRefDom!, {
        ...dynamicStyle.value,
        opacity: 0,
      })
    } else {
      setStyles(tipContentRefDom, {
        ...dynamicStyle.value,
        opacity: 1,
      })
    }
  })
}

let scrollDom = shallowRef<HTMLElement | null>()

let lastScrollTop = 0

/**监听屏幕滚动 */
const addListener = () => {
  const tipRefDom = tipRef.value?.$el as HTMLElement
  if (!tipRefDom) return

  scrollDom.value = tipRefDom.closest(".u-scroll")!.childNodes[1] as HTMLElement
  if (!scrollDom.value) return
  scrollDom.value.addEventListener("scroll", scrollEvent)
}

/**移除所有监听器和定时器 */
const removeAllListeners = () => {
  visible.value = false
  animation.value = false
  tipShowRef.value.forEach((tipContent) => {
    setStyles(tipContent, { opacity: 0 })
  })
  scrollDom.value?.removeEventListener("scroll", scrollEvent)
  dynamicStyle.value = {}
  timers.forEach(clearTimeout)
  tipShowRef.value = []
}

/**滚动事件 */
const scrollEvent = () => {
  const currentScrollTop = scrollDom.value ? scrollDom.value?.scrollTop : 0
  const scrollDirection = currentScrollTop > lastScrollTop ? "down" : "up"
  popup(scrollDirection)
  lastScrollTop = currentScrollTop
}

/**监听tip组件展示 */
watch(tipContentRef, (val) => {
  if (val) {
    tipShowRef.value.push(val!)
  }
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  scrollDom.value?.removeEventListener("scroll", scrollEvent)
})

defineExpose<_TipExposed>({
  handleClickOutside
})
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
