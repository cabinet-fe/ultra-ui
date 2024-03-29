<template>
  <div :class="cls.b">
    <UNodeRender
      :content="renderTrigger()"
      @mouseenter.self="handleMouseEnter"
      @mouseleave.self="handleMouseLeave"
      @click.self="toggleDropdown"
      ref="dropdownRef"
    />
    <div
      v-if="visible"
      :class="[cls.e('content'), bem.is('max-content', maxContent)]"
      ref="contentRef"
      @mouseenter.self="handleContentMouseEnter"
      v-click-outside:visible="handleClickOutside"
    >
      <slot name="content" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {DropdownProps} from "@ui/types/components/dropdown"
import {bem, nextFrame, setStyles, zIndex} from "@ui/utils"
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useSlots,
  Text,
} from "vue"
import vClickOutside from "@ui/directives/click-outside"
import {isBottomInViewport} from "../tip/viewport"
import {UNodeRender} from "../node-render"
defineOptions({
  name: "Dropdown",
})

const props = withDefaults(defineProps<DropdownProps>(), {
  trigger: "hover",
  mouseEnterable: true,
})

const cls = bem("dropdown")

const dropdownRef = shallowRef<HTMLElement>()

const contentRef = shallowRef<HTMLElement>()

const slots = useSlots()

const renderTrigger = () => {
  const trigger = slots.trigger?.()
  trigger?.forEach((node) => {
    console.log(node)
  })
  return trigger?.filter((node) => node.type !== Text)?.[0]
}

/**使用Map管理所有定时器，便于统一清理 */
const timers = new Map<string, number>()

/**显示隐藏 */
let visible = shallowRef(false)

/**弹窗距离元素的距离 */
let distance = 10

/**判断元素超出屏幕 */
let exceed = false

/**动画方向 */
let animationName = ""

/**鼠标移入元素 */
const handleMouseEnter = () => {
  if (props.trigger !== "hover") return
  displayPopups()
}
/**鼠标按下 */
const toggleDropdown = () => {
  if (props.trigger !== "click") return
  displayPopups()
}

/**鼠标离开元素 */
const handleMouseLeave = () => {
  if (props.trigger !== "hover") return
  // 先触发隐藏动画，再隐藏
  clearTimeout(timers.get("mouseLeave"))
  timers.set(
    "mouseLeave",
    setTimeout(() => {
      hideAnimation()
    }, 300)
  )

  clearTimeout(timers.get("hide"))
  timers.set(
    "hide",
    setTimeout(() => {
      visible.value = false
    }, 600)
  )
}

/**点击空白区域隐藏 */
const handleClickOutside = () => {
  clearTimeout(timers.get("mouseEnter"))
  hideAnimation()
  setTimeout(() => {
    visible.value = false
  }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseEnter = () => {
  if (!props.mouseEnterable) return
  timers.forEach(clearTimeout)
}

/**展示弹窗 */
const displayPopups = () => {
  clearTimeout(timers.get("mouseEnter"))
  timers.set(
    "mouseEnter",
    setTimeout(async () => {
      visible.value = true
      await nextTick()
      popup()
    }, 100)
  )
}

/**展示 */
const popup = () => {
  if (!dropdownRef.value || !contentRef.value) return
  // 页面元素
  const dropDom = dropdownRef.value.$el as HTMLElement
  // 展示元素
  const contentDom = contentRef.value as HTMLElement
  // 判断元素超出屏幕
  exceed = isBottomInViewport(contentDom, dropDom)
  setDistance(dropDom, contentDom)
}

/**
 * 设置展示元素距离页面元素的距离
 * @param dropDom 页面元素
 * @param contentDom 展示元素
 */
const setDistance = (dropDom: HTMLElement, contentDom: HTMLElement) => {
  // 页面元素Rect信息
  const dropDomRect = dropDom.getBoundingClientRect()
  const contentDomRect = contentDom.getBoundingClientRect()
  let top = ""

  if (exceed) {
    top = `-${contentDomRect.height + distance}px`
  } else {
    top = `${dropDomRect.height + distance}px`
  }
  animationName = exceed ? "up" : "down"
  nextFrame(() => {
    setStyles(contentRef.value!, {
      top,
      // 根据是否超出屏幕添加显示动画
      animation: `${animationName} 0.25s linear`,
      opacity: 1,
      zIndex: zIndex(),
    })
  })
}
/** 根据是否超出屏幕添加隐藏动画 */
const hideAnimation = () => {
  setStyles(contentRef.value!, {
    animation: `${animationName}-hide 0.25s linear`,
    opacity: 0,
  })
}

let scrollDom = shallowRef<ChildNode | null>()

const onScroll = () => {
  if (!dropdownRef.value) return
  const tipRefDom = dropdownRef.value.$el as HTMLElement
  if (!tipRefDom) return
  scrollDom.value = document.querySelector(".main")!.childNodes[1]
  if (!scrollDom.value) return
  scrollDom.value.addEventListener("scroll", popup)
}

onMounted(() => {
  onScroll()
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  if (scrollDom.value) {
    scrollDom.value.removeEventListener("scroll", popup)
  }
})
</script>
