<template>
  <div
    :class="[cls.b, cls.m(size), bem.is('vertical', vertical)]"
    ref="sliderRef"
    :style="vertical ? { height: `${height}px` } : undefined"
  >
    <!-- 跑道 -->
    <div ref="runwayRef" :class="runwayClass">
      <!-- 拖动覆盖条 -->
      <div :class="cls.e('bar')" :style="barStyles" />
      <!-- 手柄 -->
      <slider-button
        v-model="onePercentageValue"
        @dragPosition="handleSetOneToPxChange"
        @dragEnd="handleOneDown"
      />

      <slider-button
        v-model="twoPercentageValue"
        v-if="range"
        @dragPosition="handleSetTwoToPxChange"
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
import { computed, nextTick, provide, ref, shallowRef, watch } from 'vue'
import { sliderContextKey } from './di'
import SliderButton from './button.vue'
import { useSlide } from './use-slide'
import { useStops } from './use-stops'
import { isArray } from 'cat-kit/fe'
import { useFormComponent, useFormFallbackProps } from '@ui/compositions'

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

const { formProps } = useFormComponent()

const { size } = useFormFallbackProps([formProps ?? {}, props], {
  size: 'default'
})

/** slider大小 */
const sliderSize = shallowRef(0)

const sliderRef = shallowRef<HTMLElement>()

const {
  barStyles,
  onePosition,
  twoPosition,
  updateSliderBarSize,
  runwayRef,
  minValue,
  maxValue
} = useSlide(props, sliderSize)

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

const handleSetOneToPxChange = (value: number) => {
  onePosition.value = value
}

const handleSetTwoToPxChange = (value: number) => {
  twoPosition.value = value
}

watch(
  () => model.value,
  _ => {
    if (props.range && isArray(model.value)) {
      onePercentageValue.value = model.value[0]!
      twoPercentageValue.value = model.value[1]!
    } else {
      onePercentageValue.value = model.value as number
    }
  },
  {
    immediate: true
  }
)

watch(
  () => [sliderRef.value, props.min],
  _ => {
    if (!model.value) {
      model.value = props.range ? [props.min, props.min] : props.min ?? 0
    }
  }
)

/** 放下 */
const handleOneDown = async (value: number) => {
  await nextTick()

  if (props.range && isArray(model.value)) {
    /** 最小值 */
    minValue.value = Math.min(
      onePercentageValue?.value!,
      twoPercentageValue?.value!
    )

    /** 最大值*/
    maxValue.value = Math.max(
      onePercentageValue?.value!,
      twoPercentageValue?.value!
    )
    model.value = [minValue.value, maxValue.value]
  } else {
    model.value = onePercentageValue?.value
  }
}

provide(sliderContextKey, {
  sliderProps: props,
  runwayRef,
  sliderSize,
  model,
  cls,
  emit,
  setSliderBarSize: updateSliderBarSize
})
</script>