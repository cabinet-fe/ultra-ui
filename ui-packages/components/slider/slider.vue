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
      />

      <slider-button
        v-model="twoPercentageValue"
        v-if="range"
        @two="handleSetTwoToPxChange"
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

// 声明一个标志位，用来控制回调的执行
const isChangingModelValue = ref(false)

watch(
  () => model.value,
  val => {
    if (!isChangingModelValue.value) {
      isChangingModelValue.value = true // 设置标志位为 true，表示回调正在执行

      if (props.range && isArray(model.value)) {
        onePercentageValue.value = model.value[0]!
        onePercentageValue.value = model.value[1]!
      } else {
        onePercentageValue.value = model.value as number
      }

      isChangingModelValue.value = false // 执行完毕后将标志位设为 false
    }
  },
  {
    deep: true,
    immediate: true
  }
)

watch(
  () => [onePercentageValue, twoPercentageValue],
  ([one, two]) => {
    if (!isChangingModelValue.value) {
      isChangingModelValue.value = true // 设置标志位为 true，表示回调正在执行

      if (props.range && isArray(model.value)) {
        /** 最小值 */
        minValue = Math.min(one?.value!, two?.value!)

        /** 最大值*/
        maxValue = Math.max(one?.value!, two?.value!)

        model.value = [minValue, maxValue]
      } else {
        model.value = one?.value
      }

      isChangingModelValue.value = false // 执行完毕后将标志位设为 false
    }
  },
  {
    deep: true
  }
)

const barStyles = shallowReactive({
  width: '0px',
  height: '0px',
  left: `0px`
})

provide(sliderContextKey, {
  sliderProps: props,
  runwayRef,
  sliderSize,
  model,
  cls,
  emit,
  setSliderSize({ x, y }) {
    if (props.range) {
      // console.log(onePx, 'onePx')
      let minPx = Math.min(onePx.value, twoPx.value)

      let maxPx = Math.max(onePx.value, twoPx.value)

      barStyles.left = `${minPx}px`

      barStyles.width = `${maxPx - minPx}px`
      // console.log(maxPx, minPx, 'x')
      barStyles.height = `${-y || 10}px`
    } else {
      barStyles.height = `${-y || 10}px`
      barStyles.width = `${x || 10}px`
    }
  }
})
</script>
