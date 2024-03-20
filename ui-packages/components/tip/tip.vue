<template>
  <UNodeRender
    :content="slots.default?.()?.[0]"
    @mouseenter.self="handleMouseOver"
    @mouseleave.self="handleMouseOut"
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
      @mouseenter.stop="handleContentMouseOver"
      @mouseleave.stop="handleMouseOut"
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
import {
  ref,
  shallowRef,
  nextTick,
  computed,
  useSlots,
  onBeforeUnmount
} from 'vue'
import calcPosition from './position'
import vClickOutside from '@ui/directives/click-outside'
import { UNodeRender } from '../node-render'

defineOptions({
  name: 'Tip'
})

// 修改建议
// 去除dark
// 建议triggerPopupMode为trigger
// 一些命名的优化

const props = withDefaults(defineProps<TipProps>(), {
  modelValue: '提示内容',
  triggerPopUpMode: 'hover',
  position: 'top',
  theme: 'dark',
  mouseEnterable: true
})

const cls = bem('tip')

const slots = useSlots()

/**是否浅色主题 */
const whetherLightTheme = computed(() => {
  return props.theme === 'light'
})

/**tip弹窗class */
const contentClass = computed(() => {
  return [
    cls.e('content'),
    bem.is('content-light', whetherLightTheme.value),
    bem.is(props.position)
  ]
})

/**页面元素的DOM信息 */
let tipRef = shallowRef<HTMLElement>()

/**弹窗显示的DOM信息 */
let tipContentRef = shallowRef<HTMLElement>()

/**是否显示 */
let visible = ref(false)

let timeClick = 0

let timeMouseOut = 0

let timeMouseOver = 0

/**弹窗style样式 */
let dynamicStyle = shallowRef<Record<string, any>>({})

/**鼠标移入元素 */
const handleMouseOver = () => {
  if (props.triggerPopUpMode !== 'hover') return
  clearTimeout(timeMouseOver)
  timeMouseOver = setTimeout(async () => {
    visible.value = true
    await nextTick()
    mouseEventDom()
  }, 100)
}

/**鼠标离开元素 */
const handleMouseOut = () => {
  if (props.triggerPopUpMode !== 'hover') return
  clearTimeout(timeMouseOut)
  timeMouseOut = setTimeout(() => {
    tipContentRef.value!.style.opacity = '0'
    dynamicStyle.value = {}
    visible.value = false
  }, 300)
}

/**鼠标移入弹窗内容区域 */
const handleContentMouseOver = () => {
  if (!props.mouseEnterable) return
  clearTimeout(timeMouseOut)
  clearTimeout(timeMouseOver)
}

const handleClick = () => {
  console.log(1111)
  if (props.triggerPopUpMode !== 'click') return
  clearTimeout(timeClick)
  timeClick = setTimeout(async () => {
    visible.value = !visible.value
    if (visible.value) {
      await nextTick()
      mouseEventDom()
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

const setPositionParams = (maxWidth, maxHeight, overflow) => {
  const tipContentRefDom = tipContentRef.value
  setStyles(tipContentRefDom!, {
    maxWidth,
    maxHeight,
    overflow
  })
}

/** 提示框到屏幕边缘的间距 */
const gap = 10

/** 弹出 */
const popup = () => {
  // 计算弹出层样式

  // 将计算出的样式作用于弹出内容元素上， 并显示
}

/**鼠标移入/点击元素的dom信息 */
const mouseEventDom = async () => {
  // 获取页面元素的DOM信息
  const tipRefDom = tipRef.value?.$el as HTMLElement
  const tipContentRefDom = tipContentRef.value
  if (!tipRefDom || !tipContentRefDom) return

  // 获取元素的位置和大小信息
  const { clientWidth, clientHeight } = tipRefDom
  const rect = tipRefDom.getBoundingClientRect()

  // 设置元素位置和样式
  // 处理顶部和底部位置的样式
  if (props.position.match(/^(top|bottom)/)) {
    const maxWidth = props.position.includes('start')
      ? `calc(100vw - ${rect.left + gap}px)`
      : props.position.includes('end')
        ? `${rect.right - gap}px`
        : `${window.innerWidth - gap * 2}px`
    setPositionParams(maxWidth, 'none', 'visible')
  }

  // 处理右侧位置的样式
  if (props.position.match(/^right/)) {
    const maxWidth =
      rect.width > window.innerWidth - (rect.x + rect.width)
        ? `calc(${rect.x - 32}px)`
        : `calc(100vw - ${rect.x + clientWidth + 32}px)`
    setPositionParams(
      maxWidth,
      `calc(${window.innerHeight - rect.y - 16}px)`,
      'auto'
    )
  }
  // 处理左侧位置的样式
  if (props.position.match(/^left/)) {
    const maxWidth =
      rect.width > window.innerWidth - (rect.x + rect.width)
        ? `calc(100vw - ${rect.x - 16}px)`
        : `calc(${window.innerWidth - rect.x - rect.width - 32}px)`
    setPositionParams(
      maxWidth,
      `calc(${window.innerHeight - rect.y - 16}px)`,
      'visible'
    )
  }

  // 使用requestAnimationFrame以确保在下一帧进行更新
  nextFrame(async () => {
    // 计算位置参数
    const positionParams = {
      position: props.position,
      elementWidth: clientWidth,
      elementHeight: clientHeight,
      tipRefDom,
      tipContentRefDom
    }
    // 计算动态样式
    const { dynamicCss } = await calcPosition(positionParams)
    // 设置样式
    dynamicStyle.value = {
      ...dynamicCss.value,
      ...(whetherLightTheme ? {} : props.customStyle)
    }
    setStyles(tipContentRefDom, dynamicStyle.value)
    // 处理滚动事件
    onScroll(tipRefDom)
  })
}

let scrollDom = shallowRef<HTMLElement | null>()

const onScroll = (content: HTMLElement) => {
  scrollDom.value = content.closest('main')
  if (!scrollDom.value) return
  scrollDom.value.addEventListener('scroll', mouseEventDom)
}

onBeforeUnmount(() => {
  if (scrollDom.value) {
    scrollDom.value.removeEventListener('scroll', mouseEventDom)
  }
})
</script>
