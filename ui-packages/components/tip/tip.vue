<template>
  <UNodeRender
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseEnter"
    @mouseleave.self="handleMouseLeave"
    @click.stop="handleClick"
    :class="cls.b"
    :data-outSide="visible"
    ref="tipRef"
  />

  <!-- v-click-outside="handleClickOutside" -->
  <teleport to="body">
    <div
      :class="contentClass"
      ref="tipContentRef"
      v-if="visible"
      @mouseenter.stop="handleContentMouseEnter"
      @mouseleave.stop="handleMouseLeave"
      @click.stop
    >
      <slot name="content">
        {{ modelValue }}
      </slot>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import type { TipProps } from '@ui/types/components/tip'
import { bem, nextFrame, setStyles } from '@ui/utils'
import { shallowRef, nextTick, computed, useSlots, onBeforeUnmount } from 'vue'
import calcPosition from './position'
import vClickOutside from '@ui/directives/click-outside'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Tip'
})

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: '提示内容',
  trigger: 'hover',
  position: 'top',
  mouseEnterable: true
})

const cls = bem('tip')

const slots = useSlots()

/**tip弹窗class */
const contentClass = computed(() => {
  return [cls.e('content'), bem.is(props.position)]
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
  if (props.trigger !== 'hover') return
  clearTimeout(timerMouseEnter)
  timerMouseEnter = setTimeout(async () => {
    visible.value = true
    await nextTick()
    popup()
  }, 100)
}

/**鼠标离开元素 */
const handleMouseLeave = () => {
  return
  if (props.trigger !== 'hover') return
  clearTimeout(timerMouseLeave)
  timerMouseLeave = setTimeout(() => {
    tipContentRef.value!.style.opacity = '0'
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
  if (props.trigger !== 'click') return
  clearTimeout(timerTip)
  timerTip = setTimeout(async () => {
    visible.value = !visible.value
    if (visible.value) {
      await nextTick()
      popup()
    } else {
      tipContentRef.value!.style.opacity = '0'
      dynamicStyle.value = {}
    }
  }, 300)
}

// const handleClickOutside = () => {
//   console.log("Clicked outside")
//   if (props.triggerPopUpMode === "hover") return
//   visible.value = false
// }

const setPositionParams = (maxWidth, maxHeight?) => {
  const tipContentRefDom = tipContentRef.value
  setStyles(tipContentRefDom!, {
    maxWidth,
    maxHeight
  })
}

/** 提示框到屏幕边缘的间距 */
const gap = 16

/**屏幕大小 */
const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**tip弹出 */
const popup = () => {
  // 获取页面元素的DOM信息
  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return

  // 获取元素的位置和大小信息
  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  // 计算弹出层样式
  if (props.position.match(/^(top|bottom)/)) {
    const maxWidth = props.position.includes('start')
      ? `calc(100vw - ${rect.left + gap}px)`
      : props.position.includes('end')
        ? `${rect.right - gap}px`
        : `${screenSize.width - gap * 2}px`
    setPositionParams(maxWidth, 'none')
  } else if (props.position.match(/^right/)) {
    const maxWidth =
      rect.width > screenSize.width - (rect.x + rect.width)
        ? `calc(${rect.x - gap * 2}px)`
        : `calc(100vw - ${rect.x + clientWidth + gap * 2}px)`
    setPositionParams(maxWidth, `calc(${screenSize.height - rect.y - gap}px)`)
  } else if (props.position.match(/^left/)) {
    const maxWidth =
      rect.width > screenSize.width - (rect.x + rect.width)
        ? `calc(100vw - ${rect.x - gap}px)`
        : `${screenSize.width - rect.x - rect.width - gap * 2}px`
    setPositionParams(maxWidth)
  }

  //将计算出的样式作用于弹出内容元素上， 并显示
  nextFrame(async () => {
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom
    }
    const { dynamicCss } = await calcPosition(positionParams)
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...props.customStyle
    }
    setStyles(tipContentRefDom, dynamicStyle.value)
    // 处理滚动事件
    onScroll(tipRefDom)
  })
}

let scrollDom = shallowRef<HTMLElement | null>()
// let lastScrollTop = 0
const onScroll = (content: HTMLElement) => {
  scrollDom.value = content.closest('main')
  if (!scrollDom.value) return
  scrollDom.value.addEventListener('scroll', popup)
}

onBeforeUnmount(() => {
  if (scrollDom.value) {
    scrollDom.value.removeEventListener('scroll', popup)
  }
})
</script>
