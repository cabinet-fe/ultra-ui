<template>
  <div :class="className" :style="style" ref="scrollRef">
    <!-- 实际滚动的容器 -->
    <component
      ref="containerRef"
      :class="cls.e('container')"
      :is="tag"
      @scroll.passive="handleScroll"
    >
      <slot />
    </component>

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
import type { DefineEvent } from '@ui/utils'
import { useResizeObserver } from '@ui/compositions'
import { ScrollDIKey } from './di'

defineOptions({
  name: 'Scroll'
})

const props = withDefaults(defineProps<ScrollProps>(), {
  tag: 'div'
})

const emit = defineEmits<ScrollEmits>()

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
const scrollRef = shallowRef<HTMLElement>()
const containerRef = shallowRef<HTMLElement>()
const barX = shallowRef<InstanceType<typeof UScrollBar>>()
const barY = shallowRef<InstanceType<typeof UScrollBar>>()
const minSize = 20

// 更新滚动条
const updateBar = (target: HTMLElement) => {
  const {
    scrollHeight,
    offsetHeight,
    scrollTop,

    scrollWidth,
    offsetWidth,
    scrollLeft
  } = target

  emit('scroll', { x: scrollLeft, y: scrollTop })

  let barYHeight = 0
  let barYTop = 0
  if (scrollHeight !== offsetHeight) {
    barYHeight = Math.max((offsetHeight * offsetHeight) / scrollHeight, minSize)
    barYTop =
      (scrollTop / (scrollHeight - offsetHeight)) * (offsetHeight - barYHeight)
  }

  let barXWidth = 0
  let barXLeft = 0

  if (scrollWidth !== offsetWidth) {
    barXWidth = Math.max((offsetWidth * offsetWidth) / scrollWidth, minSize)

    barXLeft =
      (scrollLeft / (scrollWidth - offsetWidth)) * (offsetWidth - barXWidth)
  }

  barX.value?.update(barXWidth, barXLeft)
  barY.value?.update(barYHeight, barYTop)

  // return {
  //   barYHeight,
  //   barYTop,

  //   barXWidth,
  //   barXLeft
  // }
}

// 滚动条拖拽
const handleDragX = (offset: number, size: number) => {
  const container = containerRef.value!
  const { offsetWidth, scrollWidth } = container
  containerRef.value!.scrollLeft =
    (offset / (offsetWidth - size)) * (scrollWidth - offsetWidth)
}
const handleDragY = (offset: number, size: number) => {
  const container = containerRef.value!
  const { offsetHeight, scrollHeight } = container
  containerRef.value!.scrollTop =
    (offset / (offsetHeight - size)) * (scrollHeight - offsetHeight)
}

// 此处进行纯dom操作来防止重新渲染
useResizeObserver({
  target: containerRef,
  onResize(entries) {
    const target = entries[0]!.target as HTMLElement
    const { height, width } = target.getBoundingClientRect()

    barX.value?.setTrackSize(width)
    barY.value?.setTrackSize(height)
    updateBar(target)
  }
})

// 滚动事件
const handleScroll = (e: DefineEvent<HTMLElement>) => {
  updateBar(e.target)
}

// 滚动至------------------------------------------------
const scrollToLeft = (target: number) => {
  const container = containerRef.value
  if (!container) return

  container.scrollTo({
    left: target,
    behavior: 'smooth'
  })
}

const scrollToTop = (target: number) => {
  const container = containerRef.value
  if (!container) return
  container.scrollTo({
    top: target,
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
  scrollRef,
  containerRef,

  scrollTo,
  update() {
    containerRef.value && updateBar(containerRef.value)
  }
}

defineExpose(exposed)
</script>
