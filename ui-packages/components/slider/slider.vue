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
      <slider-button
        v-model="onePercentageValue"
        @one="handleSetOneToPxChange"
        @dragEnd="handleOneDown"
      />

      <slider-button
        v-model="twoPercentageValue"
        v-if="range"
        @two="handleSetTwoToPxChange"
        @dragEnd="handleOneDown"
      />

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
import { computed, provide, ref, shallowReactive, shallowRef, watch } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './use-slide'
import { useStops } from './use-stops'
import { useResizeObserver } from '@ui/compositions'
import { isArray } from 'cat-kit/fe'

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

/** 第一个百分比的值 */
let onePercentageValue = ref(0)
/** 第二个百分比的值 */
let twoPercentageValue = ref(0)

/** 范围最小值 */
let minValue = 0
/** 范围最大值 */
let maxValue = 0

/** 第一个像素值 */
let onePx = ref(0)

let twoPx = ref(0)

const handleSetOneToPxChange = (value: number) => {
  onePx.value = value
}

const handleSetTwoToPxChange = (value: number) => {
  twoPx.value = value
}

watch(
  () => model.value,
  val => {
    if (props.range && isArray(model.value)) {
      onePercentageValue.value = model.value[0]!
      onePercentageValue.value = model.value[1]!
    } else {
      onePercentageValue.value = model.value as number
    }
  },
  {
    deep: true,
    immediate: true,
    once: true
  }
)

/** 放下 */
const handleOneDown = (value: number) => {
  if (props.range && isArray(model.value)) {
    if (props.range && isArray(model.value)) {
      /** 最小值 */
      minValue = Math.min(
        onePercentageValue?.value!,
        twoPercentageValue?.value!
      )

      /** 最大值*/
      maxValue = Math.max(
        onePercentageValue?.value!,
        twoPercentageValue?.value!
      )

      model.value = [minValue, maxValue]
    } else {
      model.value = onePercentageValue?.value
    }
  } else {
    model.value = value
  }
}

const barStyles = shallowReactive({
  width: '0px',
  height: '0px',
  left: `0px`,
  bottom: `0px`
})

const updateSliderSize = ({ x, y }) => {
  if (props.range) {
    let minPx = Math.min(onePx.value, twoPx.value)

    let maxPx = Math.max(onePx.value, twoPx.value)

    if (props.vertical) {

      barStyles.bottom = `${-maxPx}px`

      barStyles.width = `10px`
      barStyles.height = `${maxPx - minPx}px`
    } else {
      barStyles.left = `${minPx}px`
      barStyles.width = `${maxPx - minPx}px`
    }
  } else {
    barStyles.height = `${-y || 10}px`
    barStyles.width = `${x || 10}px`
  }
}

provide(sliderContextKey, {
  sliderProps: props,
  runwayRef,
  sliderSize,
  model,
  cls,
  emit,
  setSliderSize: updateSliderSize
})
</script>
