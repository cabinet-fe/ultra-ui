<template>
  <div :class="className" :style="style" ref="scrollRef">
    <div
      ref="containerRef"
      :class="[cls.e('container'), containerClass]"
      @scroll.passive="handleScroll"
      :style="containerStyle"
    >
      <component
        ref="contentRef"
        :style="contentStyle"
        :class="[cls.e('content'), contentClass]"
        :is="tag"
      >
        <slot />
      </component>
    </div>

    <u-scroll-bar type="y" :class="cls.e('bar-y')" @drag="handleDragY" ref="barY" />
    <u-scroll-bar type="x" :class="cls.e('bar-x')" @drag="handleDragX" ref="barX" />
  </div>
</template>

<script lang="ts" setup>
import { debounce } from '@cat-kit/core'
import { useResizeObserver } from '@veltra/compositions'
import { bem, withUnit } from '@veltra/utils'
import { type CSSProperties, computed, provide, shallowRef } from 'vue'

import type { ScrollPosition, _ScrollExposed, ScrollProps, ScrollEmits } from '../../types'
import { ScrollDIKey } from './di'
import UScrollBar from './scroll-bar.vue'

defineOptions({ name: 'UScroll' })

const props = withDefaults(defineProps<ScrollProps>(), { tag: 'div' })

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

const style = computed<CSSProperties>(() => {
  return { height: withUnit(props.height, 'px') }
})

const contentRef = shallowRef<HTMLElement>()
const scrollRef = shallowRef<HTMLElement>()
const containerRef = shallowRef<HTMLElement>()
const barX = shallowRef<InstanceType<typeof UScrollBar>>()
const barY = shallowRef<InstanceType<typeof UScrollBar>>()
const minSize = 20

const trackSize = { width: 0, height: 0 }

const updateBar = () => {
  const container = containerRef.value
  if (!container) return

  const { scrollHeight, clientHeight, scrollTop, scrollWidth, clientWidth, scrollLeft } = container

  emit('scroll', {
    x: scrollLeft,
    y: scrollTop,
    sw: scrollWidth,
    sh: scrollHeight,
    cw: clientWidth,
    ch: clientHeight
  })

  if (scrollHeight !== clientHeight) {
    const barYHeight = Math.max((clientHeight / scrollHeight) * trackSize.height, minSize)
    const barYTop = (scrollTop / (scrollHeight - clientHeight)) * (trackSize.height - barYHeight)
    barY.value?.update(barYHeight, barYTop)
  } else {
    barY.value?.update(0, 0)
  }

  if (scrollWidth !== clientWidth) {
    const barXWidth = Math.max((clientWidth / scrollWidth) * trackSize.width, minSize)
    const barXLeft = (scrollLeft / (scrollWidth - clientWidth)) * (trackSize.width - barXWidth)
    barX.value?.update(barXWidth, barXLeft)
  } else {
    barX.value?.update(0, 0)
  }
}

const handleDragX = debounce(
  (offset: number, size: number) => {
    const container = containerRef.value
    if (!container) return
    const { clientWidth, scrollWidth } = container
    container.scrollLeft = (offset / (trackSize.width - size)) * (scrollWidth - clientWidth)
  },
  props.dragDebounce ?? 0,
  false
)

const handleDragY = debounce(
  (offset: number, size: number) => {
    const container = containerRef.value
    if (!container) return
    const { clientHeight, scrollHeight } = container
    container.scrollTop = (offset / (trackSize.height - size)) * (scrollHeight - clientHeight)
  },
  props.dragDebounce ?? 0,
  false
)

const handleScroll = () => {
  updateBar()
}

useResizeObserver({
  targets: [contentRef, scrollRef],
  onResize: (entries) => {
    const trackEl = scrollRef.value
    if (trackEl) {
      trackSize.width = trackEl.clientWidth
      trackSize.height = trackEl.clientHeight
      barX.value?.setTrackSize(trackSize.width)
      barY.value?.setTrackSize(trackSize.height)
    }
    updateBar()
    if (entries.length) {
      emit(
        'resize',
        entries.map((entry) => entry.target as HTMLElement)
      )
    }
  }
})

const scrollToLeft = (left: number) => {
  const container = containerRef.value
  if (!container) return
  container.scrollTo({ left })
}

const scrollToTop = (top: number) => {
  const container = containerRef.value
  if (!container) return
  container.scrollTo({ top })
}

const scrollTo = (position: ScrollPosition) => {
  if (position.x !== undefined) scrollToLeft(position.x)
  if (position.y !== undefined) scrollToTop(position.y)
}

provide(ScrollDIKey, { cls })

const exposed: _ScrollExposed = {
  el: scrollRef,
  contentRef,
  containerRef,
  scrollTo,
  update: updateBar
}

defineExpose(exposed)
</script>
