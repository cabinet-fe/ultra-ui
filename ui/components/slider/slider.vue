<template>
  <div
    v-if="!readonly"
    :class="className"
    ref="sliderRef"
    @click="handleClickSlider"
  >
    <div :class="cls.e('bar')" :style="barStyles" />

    <slider-thumb v-model="offset1" @click.stop />
    <slider-thumb v-if="range" v-model="offset2" @click.stop />
  </div>

  <div v-else>
    {{ props.modelValue }}
  </div>
</template>

<script lang="ts" setup generic="T extends number | [number, number]">
import type { SliderProps, SliderEmits } from '@ui/types'
import { bem } from '@ui/utils'
import { computed, provide, watch } from 'vue'
import { sliderContextKey } from './di'
import SliderThumb from './slider-thumb.vue'
import {
  useFormComponent,
  useFormFallbackProps,
  useUpdateLock
} from '@ui/compositions'
import { useSlider } from './use-slider'

defineOptions({
  name: 'Slider'
})

const props = withDefaults(defineProps<SliderProps<T>>(), {
  min: 0,
  max: 100,
  disabled: undefined
})

const emit = defineEmits<SliderEmits<T>>()

const cls = bem('slider')

const { formProps } = useFormComponent()

const { size, disabled, readonly } = useFormFallbackProps([
  formProps ?? {},
  props
])

const className = computed(() => {
  return [
    cls.b,
    cls.m(size.value),
    bem.is('disabled', disabled.value),
    bem.is('range', props.range)
  ]
})

const {
  offset1,
  offset2,
  sliderRef,
  slideRange,
  sliderSize,
  sliderOffset2Value,
  value2SliderOffset
} = useSlider(props)

const barStyles = computed(() => {
  if (!props.range) {
    return {
      left: 0,
      width: `${offset1.value}px`
    }
  }
  return {
    left: `${Math.min(offset1.value, offset2.value)}px`,
    width: `${Math.abs(offset1.value - offset2.value)}px`
  }
})

const { updateAndLock, update } = useUpdateLock()

// 回显
watch(
  [() => props.modelValue, sliderSize],
  ([v, size]) => {
    update(() => {
      if (v === undefined || size === 0) return
      if (props.range) {
        offset1.value = value2SliderOffset(v[0])
        offset2.value = value2SliderOffset(v[1])
      } else {
        offset1.value = value2SliderOffset(v as number)
      }
    })
  },
  { immediate: true }
)

watch([offset1, offset2], v => {
  updateAndLock(() => {
    if (props.range) {
      emit('update:modelValue', v.map(sliderOffset2Value).sort() as T)
    } else {
      emit('update:modelValue', sliderOffset2Value(v[0]) as T)
    }
  })
})

function handleClickSlider(e: MouseEvent) {
  if (disabled.value || props.range) return

  // 获取点击位置相对于滑块的偏移量
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const offsetX = e.clientX - rect.left

  offset1.value = offsetX
}

provide(sliderContextKey, {
  sliderProps: props,
  disabled,
  range: slideRange,
  cls,
  value2SliderOffset,
  sliderOffset2Value
})
</script>
