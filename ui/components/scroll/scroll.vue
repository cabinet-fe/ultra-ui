<template>
  <div :class="className" :style="style" ref="scrollRef">
    <div
      ref="containerRef"
      :class="[cls.e('container'), containerClass]"
      @scroll.passive="handleScroll"
      :style="containerStyle"
    >
      <slot name="content" />

      <component
        ref="contentRef"
        :style="contentStyle"
        :class="[cls.e('content'), contentClass]"
        :is="tag"
      >
        <slot />
      </component>
    </div>

    <u-scroll-bar
      type="y"
      :class="cls.e('bar-y')"
      @drag="handleDragY"
      ref="barY"
    />
    <u-scroll-bar
      type="x"
      :class="cls.e('bar-x')"
      @drag="handleDragX"
      ref="barX"
    />
  </div>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@ui/utils'
import type {
  ScrollPosition,
  _ScrollExposed,
  ScrollProps,
  ScrollEmits
} from '@ui/types/components/scroll'
import { type CSSProperties, computed, provide, shallowRef } from 'vue'
import UScrollBar from './scroll-bar.vue'
import { useResizeObserver } from '@ui/compositions'
import { ScrollDIKey } from './di'

defineOptions({
  name: 'Scroll'
})

const props = withDefaults(defineProps<ScrollProps>(), {
  tag: 'div'
})

const emit = defineEmits<ScrollEmits>()

defineSlots<{
  /** 默认插槽 */
  default(): any
  /** 内容插槽 */
  content(): any
}>()

const cls = bem('scroll')
const className = computed(() => {
  return [cls.b, bem.is('always', props.always)]
})

// 样式-------------------------------------------------------------
const style = computed<CSSProperties>(() => {
  return {
    height: withUnit(props.height, 'px')
  }
})

// 模板引用------------------------------------------------
/** 内容引用 */
const contentRef = shallowRef<HTMLElement>()
/** 滚动根元素引用 */
const scrollRef = shallowRef<HTMLElement>()
/** 容器引用 */
const containerRef = shallowRef<HTMLElement>()
const barX = shallowRef<InstanceType<typeof UScrollBar>>()
const barY = shallowRef<InstanceType<typeof UScrollBar>>()
const minSize = 20

const trackSize = {
  width: 0,
  height: 0
}

useResizeObserver({
  targets: [contentRef, scrollRef],
  onResize(entries) {
    if (entries.length && scrollRef.value) {
      const { clientHeight, clientWidth } = scrollRef.value

      trackSize.width = clientWidth
      trackSize.height = clientHeight

      barX.value?.setTrackSize(trackSize.width)
      barY.value?.setTrackSize(trackSize.height)
      updateBar()

      emit(
        'resize',
        entries.map(entry => entry.target as HTMLElement)
      )
    }
  }
})

// 更新滚动条
const updateBar = () => {
  if (!containerRef.value) return

  const {
    scrollHeight,
    clientHeight,
    scrollTop,

    scrollWidth,
    clientWidth,
    scrollLeft
  } = containerRef.value

  emit('scroll', { x: scrollLeft, y: scrollTop })

  if (scrollHeight !== clientHeight) {
    const barYHeight = Math.max(
      (clientHeight / scrollHeight) * trackSize.height,
      minSize
    )

    const barYTop =
      (scrollTop / (scrollHeight - clientHeight)) *
      (trackSize.height - barYHeight)

    // console.log(clientHeight, trackSize.height, scrollHeight)

    barY.value?.update(barYHeight, barYTop)
  } else {
    barY.value?.update(0, 0)
  }

  if (scrollWidth !== clientWidth) {
    const barXWidth = Math.max(
      (clientWidth / scrollWidth) * trackSize.width,
      minSize
    )

    const barXLeft =
      (scrollLeft / (scrollWidth - clientWidth)) * (trackSize.width - barXWidth)

    barX.value?.update(barXWidth, barXLeft)
  } else {
    barX.value?.update(0, 0)
  }
}

// 滚动条拖拽
const handleDragX = (offset: number, size: number) => {
  const container = containerRef.value!
  const { clientWidth, scrollWidth } = container
  container.scrollLeft =
    (offset / (trackSize.width - size)) * (scrollWidth - clientWidth)
}
const handleDragY = (offset: number, size: number) => {
  const container = containerRef.value!
  const { clientHeight, scrollHeight } = container
  container.scrollTop =
    (offset / (trackSize.height - size)) * (scrollHeight - clientHeight)
}

// 滚动事件
const handleScroll = () => {
  updateBar()
}

// 滚动至------------------------------------------------
const scrollToLeft = (left: number) => {
  const container = containerRef.value
  if (!container) return

  container.scrollTo({
    left,
    behavior: 'smooth'
  })
}

const scrollToTop = (top: number) => {
  const container = containerRef.value
  if (!container) return
  container.scrollTo({
    top,
    behavior: 'smooth'
  })
}

const scrollTo = (position: ScrollPosition) => {
  if (position.x !== undefined) scrollToLeft(position.x)
  if (position.y !== undefined) scrollToTop(position.y)
}

provide(ScrollDIKey, {
  cls
})

const exposed: _ScrollExposed = {
  el: scrollRef,
  contentRef,
  containerRef,
  scrollTo,
  update: updateBar
}

defineExpose(exposed)
</script>
