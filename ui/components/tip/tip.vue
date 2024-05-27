<template>
  <UNodeRender
    v-bind="$attrs"
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseEnter"
    @mouseleave.self="handleMouseLeave"
    @click="handleClick"
    :class="[cls.b]"
    ref="tipRef"
  />
  <teleport to="body">
    <Transition :name="transitionName">
      <u-scroll
        tag="div"
        :class="contentClass"
        v-bind="$attrs"
        ref="tipContentRef"
        v-if="visible"
        @mouseenter.stop="handleContentMouseEnter"
        @mouseleave.stop="handleContentMouseLeave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
        <slot name="content">{{ content }}</slot>
      </u-scroll>
    </Transition>
  </teleport>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount,
  watch,
} from "vue"
import { bem, nextFrame, setStyles } from "@ui/utils"
import { vClickOutside } from "@ui/directives"
import { UNodeRender } from "../node-render"
import { UScroll } from "../scroll"
import { type TipProps } from "@ui/types/components/tip"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import calcPosition from "./position"
import {
  calculateMaxWidth,
  calculateRightMaxWidth,
  calculateLeftMaxWidth,
} from "./calculate"
defineOptions({ name: "Tip" })

const props = withDefaults(defineProps<TipProps>(), {
  content: "提示内容",
  trigger: "hover",
  position: "top",
  mouseEnterable: true,
  mouseLeaveClose: true,
})

/**当前展示的tipContent */
const contentDom = shallowRef<HTMLElement>()
const cls = bem("tip")
const slots = useSlots()
const { formProps } = useFormComponent()
const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: "default",
})

const transitionName = computed(() => `tip-${props.position.split("-")[0]}`)
const contentClass = computed(() => [
  cls.e("content"),
  bem.is(props.position),
  cls.m(size.value),
  transitionName.value,
])

const tipRef = shallowRef<InstanceType<typeof UNodeRender>>()
const tipContentRef = shallowRef<InstanceType<typeof UScroll>>()
const visible = shallowRef(false)
const isMouseInTip = shallowRef(false)
const timers = new Map<string, number>()
const dynamicStyle = shallowRef<Record<string, any>>({})
const gap = 8
const screenSize = { width: 0, height: 0 }
const isChildrenTip = shallowRef(false)
let scrollDom = shallowRef<HTMLElement | null>()

const handleMouseEnter = () => {
  isMouseInTip.value = true
  if (props.trigger !== "hover") return
  nextFrame(async () => {
    if (isMouseInTip.value) {
      visible.value = true
      await nextTick()
      addListener()
    }
  })
}

const handleMouseLeave = () => {
  if (!props.mouseLeaveClose) return
  isMouseInTip.value = false
  if (props.trigger !== "hover") return
  clearTimeout(timers.get("timerMouseLeave"))
  timers.set(
    "timerMouseLeave",
    setTimeout(() => {
      removeAllListeners()
    }, 200)
  )
}

const handleContentMouseEnter = () => {
  clearTimeout(timers.get("timerMouseLeave"))
  isMouseInTip.value = true
  if (!props.mouseEnterable) return
  timers.forEach(clearTimeout)
}

watch(tipContentRef, (val) => {
  if (val) {
    const tip = val.el as HTMLElement
    if (tip.querySelectorAll(".u-tip").length) {
      isChildrenTip.value = true
    }
  }
})

const handleContentMouseLeave = () => {
  if (isChildrenTip.value) return
  if (!props.mouseLeaveClose) return
  isMouseInTip.value = false
  clearTimeout(timers.get("timerContentMouseLeave"))
  timers.set(
    "timerContentMouseLeave",
    setTimeout(() => {
      if (props.trigger !== "hover") return
      removeAllListeners()
    }, 300)
  )
}

const handleClick = async () => {
  if (props.trigger !== "click") return
  visible.value = !visible.value
  await nextTick()
  if (visible.value) {
    addListener()
  } else {
    removeAllListeners()
  }
}

const handleClickOutside = () => {
  if (isChildrenTip.value) return
  if (props.trigger === "hover") return
  closeTipContent()
}
/**手动关闭弹窗 */
const closeTipContent = () => {
  clearTimeout(timers.get("outside"))
  timers.set(
    "outside",
    setTimeout(() => {
      visible.value = false
      removeAllListeners()
    }, 10)
  )
}

const setPositionParams = (maxWidth) =>
  setStyles(tipContentRef.value!.el!, { maxWidth })

const popup = () => {
  screenSize.width = scrollDom.value?.clientWidth!
  screenSize.height = scrollDom.value?.clientHeight!

  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value!.el
  if (!tipRefDom || !tipContentRefDom) return

  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()
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
  if (maxWidth) setPositionParams(maxWidth)

  nextFrame(async () => {
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom,
      screenSize,
      scrollDom: scrollDom.value!,
      gap,
    }
    const { dynamicCss } = await calcPosition(positionParams)
    dynamicStyle.value = { ...dynamicCss.value, ...props.customStyle }
    setStyles(tipContentRefDom, { ...dynamicStyle.value })
    const { top } = tipContentRef.value!.el!.getBoundingClientRect()
    nextTick(() => {
      setStyles(tipContentRef.value!.el!, {
        ...dynamicStyle.value,
        maxHeight: `${window.innerHeight - top - gap * 2}px`,
      })
    })
  })
}

const addListener = () => {
  const tipRefDom = tipRef.value?.$el as HTMLElement
  if (!tipRefDom) return
  scrollDom.value = tipRefDom.closest(".u-scroll__container") as HTMLElement
  if (!scrollDom.value) return
  scrollDom.value.addEventListener("scroll", closeTipContent)
  popup()
}

const removeAllListeners = () => {
  visible.value = false
  scrollDom.value?.removeEventListener("scroll", closeTipContent)
  dynamicStyle.value = {}
  timers.forEach(clearTimeout)
}

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  scrollDom.value?.removeEventListener("scroll", closeTipContent)
})

defineExpose({ closeTipContent, contentDom })

/**监听tip组件展示 */
watch(tipContentRef, (val) => {
  if (val) {
    contentDom.value = val.$el!
  }
})
</script>
