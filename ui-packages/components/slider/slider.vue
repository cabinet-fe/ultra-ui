<template>
  <div
    :class="[cls.b, bem.is('vertical', vertical)]"
    ref="sliderRef"
    :style="vertical ? { height: `${height}px` } : undefined"
  >
    <!-- 跑道 -->
    <div ref="runwayRef" :class="runwayClass" @mousedown="handleSliderDown">
      <!-- 拖动覆盖条 -->
      <div :class="cls.e('bar')" :style="barStyles" />

      <!-- 手柄 -->
      <slider-button />

      <slider-button v-if="range" />

      <!-- 断点 -->
      <template v-if="showStops">
        <div
          v-for="(item, key) in stops"
          :key="key"
          :class="cls.e('stop')"
          :style="getStopStyle(item)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SliderProps, SliderEmits } from '@ui/types/components/slider'
import { bem } from '@ui/utils'
import { computed, provide, shallowReactive, shallowRef } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './use-slide'
import { useStops } from './use-stops'
import { useResizeObserver } from '@ui/compositions'

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 0,
  vertical: false,
  height: 300,
  range: false
})

const emit = defineEmits<SliderEmits>()

const cls = bem('slider')

const runwayRef = shallowRef<HTMLElement>()

/** slider大小 */
const sliderSize = shallowRef(0)

/** 根据页面实时响应 */
useResizeObserver({
  target: runwayRef,
  onResize([entry]) {
    const rect = entry!.target.getBoundingClientRect()
    if (props.vertical) {
      sliderSize.value = rect.height
    } else {
      sliderSize.value = rect.width
    }
  }
})

const { handleSliderDown } = useSlide(props, emit, sliderSize)

const { stops, getStopStyle } = useStops({
  sliderProps: props,
  sliderSize
})

const runwayClass = computed(() => {
  return [cls.e('runway')]
})

const model = defineModel<number[] | number>()

const barStyles = shallowReactive({
  width: '0px',
  height: '0px'
})

provide(sliderContextKey, {
  sliderProps: props,
  runwayRef,
  sliderSize,
  model,
  cls,
  emit,
  setSliderSize({ x, y }) {
    barStyles.height = `${-y || 10}px`
    barStyles.width = `${x || 10}px`
  }
})
</script>
