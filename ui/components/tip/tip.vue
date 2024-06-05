<template>
  <UNodeRender
    v-bind="{ ...eventsHandlers, ...$attrs }"
    :content="slots.default?.()?.[0]"
    :class="[cls.b]"
    ref="tipRef"
  />
  <teleport to="body">
    <Transition :name="transitionName">
      <component
        :is="contentTag"
        v-if="visible"
        :class="contentClass"
        ref="tipContentRef"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        @click.stop
        v-click-outside="handleClickOutside"
      >
        <slot name="content">{{ content }}</slot>
      </component>
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
import { bem, getScrollParents, setStyles } from "@ui/utils"
import { vClickOutside } from "@ui/directives"
import { UNodeRender } from "../node-render"
import { type TipProps } from "@ui/types/components/tip"
import { useFormComponent, useFormFallbackProps } from "@ui/compositions"
import calcPosition from "./position"
import countMaxWidth from "./countMaxWidth"
defineOptions({ name: "Tip" })

const props = withDefaults(defineProps<TipProps>(), {
  content: "提示内容",
  trigger: "hover",
  position: "top",
  mouseEnterable: true,
  mouseLeaveClose: true,
  clickClose: false,
  contentTag: "div",
  disabled: false,
})

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
const tipContentRef = shallowRef<HTMLElement>()
const visible = shallowRef(false)
const dynamicStyle = shallowRef<Record<string, any>>({})
const gap = 8
const screenSize = { width: 0, height: 0 }
const isChildrenTip = shallowRef(false)
let scrollDom = shallowRef<HTMLElement | null>()
let closeTimer: number | undefined

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}
  if (disabled) return handlers

  if (trigger === "click") {
    handlers.onClick = open
  } else if (trigger === "hover") {
    handlers.onMouseenter = open

    if (isChildrenTip.value) {
      handlers.onMouseleave = open
    } else {
      handlers.onMouseleave = closeTipContent
    }
  }

  return handlers
})

watch(tipContentRef, (val) => {
  if (val) {
    const tip = val as HTMLElement
    if (tip.querySelectorAll(".u-tip").length) {
      isChildrenTip.value = true
    }
  }
})

const handleClickOutside = (e: MouseEvent) => {
  if (props.clickClose) return
  if (isChildrenTip.value) return
  if (props.trigger === "hover") return

  if (
    props.trigger === "click" &&
    tipRef.value?.$el?.contains(e.target as Node)
  ) {
    return
  }
  closeTipContent()
}

const open = () => {
  closeTimer !== undefined && clearTimeout(closeTimer)
  if (props.trigger === "hover") {
    visible.value = true
  } else if (props.trigger === "click") {
    visible.value = !visible.value
  }
}
/**手动关闭弹窗 */
const closeTipContent = () => {
  if (props.trigger === "hover") {
    closeTimer = setTimeout(() => {
      visible.value = false
    }, 200)
  } else if (props.trigger === "click") {
    visible.value = false
  }
  dynamicStyle.value = {}
}

watch(visible, async (v) => {
  if (v) {
    await nextTick()
    window.addEventListener("resize", closeTipContent)
    /** 添加滚动事件 */
    scrollParents = getScrollParents(tipRef.value?.$el!)
    scrollDom.value = scrollParents[0]
    addScrollEvent()
  } else {
    removeScrollEvent()
    window.removeEventListener("resize", closeTipContent)
  }
})

let scrollParents: HTMLElement[] = []

function addScrollEvent() {
  scrollParents.forEach((el) => {
    el.addEventListener("scroll", closeTipContent)
  })
  popup()
}

function removeScrollEvent() {
  scrollParents.forEach((el) => {
    el.removeEventListener("scroll", closeTipContent)
  })

  scrollParents = []
}

const popup = async () => {
  screenSize.width = scrollDom.value?.clientWidth!
  screenSize.height = scrollDom.value?.clientHeight!

  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return

  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  setStyles(tipContentRef.value!, {
    maxWidth: countMaxWidth(props.position, gap, rect),
  })

  const positionParams = {
    position: props.position,
    elementWidth: clientWidth,
    elementHeight: clientHeight,
    tipRefDom,
    tipContentRefDom,
    screenSize,
    gap,
  }
  const { dynamicCss } = await calcPosition(positionParams)
  dynamicStyle.value = { ...dynamicCss.value, ...props.customStyle }
  setStyles(tipContentRefDom, { ...dynamicStyle.value })
  const { top } = tipContentRef.value!.getBoundingClientRect()
  nextTick(() => {
    setStyles(tipContentRef.value!, {
      ...dynamicStyle.value,
      maxHeight: `${window.innerHeight - top - gap * 2}px`,
    })
  })
}

onBeforeUnmount(() => {
  clearTimeout(closeTimer)
})

defineExpose({ closeTipContent })
</script>
