<template>
  <div :class="[cls.b, bem.is('vertical', props.vertical)]" ref="sliderRef">
    <!-- 跑道 -->
    <div
      :class="runwayClass"
      :style="vertical ? { height: `${height}px` } : undefined"
      @mousedown="handleSliderDown"
    >
      <!-- 拖动覆盖条 -->
      <div :class="cls.e('bar')" :style="barStyles" />

      <!-- 手柄 -->
      <slider-button />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  SliderProps,
  SliderEmits,
  SliderInitData
} from '@ui/types/components/slider'
import { bem } from '@ui/utils'
import { computed, provide, reactive, shallowReactive } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './_compositions'

// todo 优化
// 1. 使用useDrag完成
// 2. 优化依赖注入的使用
defineOptions({
  name: 'Slider'
})

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  vertical: false,
  height: 300
})

const emit = defineEmits<SliderEmits>()

const cls = bem('slider')

const transform = shallowReactive({
  x: 0,
  y: 0
})

const currentTransform = {
  x: 0,
  y: 0
}

const initData = reactive<SliderInitData>({
  dragging: false,
  newPosition: 0,
  oldValue: 0,
  sliderSize: 1,
  transform,
  currentTransform
})

const { resetSize, handleSliderDown, sliderRef, barStyles } = useSlide(
  props,
  initData,
  emit
)

provide(sliderContextKey, {
  sliderProps: props,
  cls,
  initData,
  emit,
  resetSize
})

const runwayClass = computed(() => {
  return [cls.e('runway'), bem.is('vertical', props.vertical)]
})
</script>
