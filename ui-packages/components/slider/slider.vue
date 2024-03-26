<template>
  <div :class="cls.b">
    <!-- 跑道 -->
    <div :class="cls.e('runway')">
      <!-- @mousedown="handleSliderDown"
      @touchstart="handleSliderDown" -->

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
import { provide, reactive, toRefs } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './_compositions'

defineOptions({
  name: 'Slider'
})

const props = defineProps<SliderProps>()

const emit = defineEmits<SliderEmits>()

const cls = bem('slider')

const initData = reactive<SliderInitData>({
  dragging: false,
  currentX: 0,
  currentY: 0
})

// const { handleSliderDown } = useSlide(props, initData, emit)

provide(sliderContextKey, {
  ...toRefs(props),
  cls,
  initData
})
</script>
