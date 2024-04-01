<template>
  <div :class="[cls.b, bem.is('vertical', vertical)]" ref="sliderRef">
    <!-- 跑道 -->
    <div
      :class="runwayClass"
      :style="vertical ? { height: `${height}px` } : undefined"
      @mousedown="handleSliderDown"
    >
      <!-- 拖动覆盖条 -->
      <div :class="cls.e('bar')" v-if="!range" :style="barStyles" />

      <!-- 手柄 -->
      <slider-button @update:modelValue="setFirstValue" />

      <slider-button v-if="range" @update:modelValue="setSecondValue" />

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
import type {
  SliderProps,
  SliderEmits,
  SliderInitData,
  SliderButtonTransform
} from '@ui/types/components/slider'
import { bem } from '@ui/utils'
import { computed, provide, reactive, shallowReactive } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide, useStops } from './_compositions'

// todo 优化
// 1. 使用useDrag完成
// 2. 优化依赖注入的使用
defineOptions({
  name: 'Slider'
})

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 0,
  vertical: false,
  height: 300
})

const model = defineModel()

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
  /** 跑道大小 */
  sliderSize: 1,
  /** 范围第一个值 **/
  firstValue: 0,
  /** 范围的第二个值 */
  secondValue: 0,
  transform,
  currentTransform
})

/** 获取第一个按钮的值 */
const setFirstValue = (
  transform: SliderButtonTransform,
  currentTransform: SliderButtonTransform
) => {
  initData.transform = transform
  initData.currentTransform = currentTransform

  initData.firstValue = transform.x
  console.log(initData.firstValue, 'initData.firstValue')
  // console.log(transform.x, currentTransform.x, 'first')
}

/** 获取第二个按钮的值 */
const setSecondValue = (
  transform: SliderButtonTransform,
  currentTransform: SliderButtonTransform
) => {
  initData.secondValue = transform.x

  console.log(initData.secondValue, 'secondValue')
}

const { resetSize, handleSliderDown, sliderRef, barStyles } = useSlide(
  props,
  initData,
  emit
)

const { stops, getStopStyle } = useStops(props, initData)

const runwayClass = computed(() => {
  return [cls.e('runway'), bem.is('vertical', props.vertical)]
})

provide(sliderContextKey, {
  sliderProps: props,
  cls,
  initData,
  emit,
  resetSize
})
</script>
