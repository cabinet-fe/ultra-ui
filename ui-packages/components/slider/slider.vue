<template>
  <div :class="cls.b" ref="sliderRef">
    <!-- 跑道 -->
    <div :class="cls.e('runway')" ref="sliderRef">
      <!-- 拖动覆盖条 -->
      <div :class="cls.e('bar')"></div>

      <!-- 手柄 -->
      <slider-button></slider-button>
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
import { computed, provide, reactive, shallowRef, toRefs } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './_compositions'
import { useDrag } from '@ui/compositions'

// todo 优化
// 1. 使用useDrag完成
// 2. 优化依赖注入的使用
defineOptions({
  name: 'Slider'
})

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1
})

const emit = defineEmits<SliderEmits>()

const cls = bem('slider')

const initData = reactive<SliderInitData>({
  dragging: false,
  newPosition: 0,
  oldValue: 0,
  sliderSize: 1,
  startPosition: 0,
  startX: 0
})

const { resetSize, handleSliderDown, sliderRef } = useSlide(
  props,
  initData,
  emit
)

provide(sliderContextKey, {
  ...toRefs(props),
  cls,
  initData,
  emit,
  resetSize
})
</script>
