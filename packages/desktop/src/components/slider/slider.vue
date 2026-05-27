<template>
  <div v-if="!readonly" :class="className">
    <div :class="cls.e('track')" ref="sliderRef" @click="handleClickSlider">
      <div :class="cls.e('bar')" :style="barStyles" />

      <slider-thumb v-model="offset1" @click.stop />
      <slider-thumb v-if="range" v-model="offset2" @click.stop />

      <div
        v-for="tick in ticks"
        :style="{ [vertical ? 'bottom' : 'left']: `${tick}%` }"
        :class="cls.e('tick')"
      />
    </div>
  </div>

  <div v-else>
    {{ props.modelValue }}
  </div>
</template>

<script lang="ts" setup generic="T extends number | [number, number]">
import { useFormFallbackProps, useUserAction } from '@veltra/compositions'
import { bem } from '@veltra/utils'
import { injectFormContext } from '@veltra/utils'
import { computed, provide, watch } from 'vue'

import type { SliderProps, SliderEmits } from '../../types'
import { sliderContextKey } from './di'
import SliderThumb from './slider-thumb.vue'
import { useSlider } from './use-slider'

defineOptions({
  name: 'Slider'
})

const props = withDefaults(defineProps<SliderProps<T>>(), {
  min: 0,
  max: 100,
  disabled: undefined,
  readonly: undefined
})

const emit = defineEmits<SliderEmits<T>>()

const cls = bem('slider')

const { formProps } = injectFormContext()

const { size, disabled, readonly } = useFormFallbackProps([formProps ?? {}, props])

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('range', props.range),
    bem.is('horizontal', !props.vertical),
    bem.is('vertical', props.vertical)
  ]
})

const {
  offset1,
  offset2,
  sliderRef,
  slideRange,
  sliderSize,
  sliderOffset2Value,
  value2SliderOffset,
  getOffsetByStep
} = useSlider(props)

const barStyles = computed(() => {
  const { vertical } = props
  const offsetProp = vertical ? 'bottom' : 'left'
  const sizeProp = vertical ? 'height' : 'width'

  if (!props.range) {
    return {
      [offsetProp]: 0,
      [sizeProp]: `${Math.abs(offset1.value)}px`
    }
  }
  return {
    [offsetProp]: `${Math.min(Math.abs(offset1.value), Math.abs(offset2.value))}px`,
    [sizeProp]: `${Math.abs(offset1.value - offset2.value)}px`
  }
})

const { userAction, isUserActive } = useUserAction()

watch(
  [sliderSize, ...['modelValue', 'range', 'max', 'min', 'vertical'].map((k) => () => props[k])],
  ([size, value, range]) => {
    if (isUserActive()) return
    if (value === undefined || size === 0) return

    if (range) {
      offset1.value = value2SliderOffset((value as [number, number])[0])
      offset2.value = value2SliderOffset((value as [number, number])[1])
    } else {
      offset1.value = value2SliderOffset(value as number)
    }
  },
  { immediate: true }
)

const ticks = computed(() => {
  const { step, min, max } = props
  if (!step) return []
  const tickLength = Math.ceil((max! - min!) / step)
  const offsetPercent = (step / (max! - min!)) * 100

  return [...Array.from({ length: tickLength }, (_, i) => i * offsetPercent), 100]
})

watch(
  [offset1, offset2],
  userAction((v) => {
    if (props.range) {
      emit('update:modelValue', v.map(sliderOffset2Value).toSorted() as T)
    } else {
      emit('update:modelValue', sliderOffset2Value(v[0]) as T)
    }
  })
)

function handleClickSlider(e: MouseEvent) {
  if (disabled.value || props.range) return

  // 获取点击位置相对于滑块的偏移量
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()

  offset1.value = getOffsetByStep(e.clientX - rect.left)
}

provide(sliderContextKey, {
  sliderProps: props,
  disabled,
  range: slideRange,
  cls,
  getOffsetByStep
})
</script>
