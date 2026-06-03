<template>
  <div ref="thumb" :class="cls.e('thumb')" :style></div>
</template>
<script lang="ts" setup>
import { useDrag, useUserAction } from '@veltra/compositions'
import { computed, inject, useTemplateRef, watch } from 'vue'

import { sliderContextKey } from './di'

const props = defineProps<{ modelValue: number }>()

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()

const { cls, range, disabled, sliderProps, getOffsetByStep } = inject(sliderContextKey)!

const thumbRef = useTemplateRef('thumb')

const style = computed(() => {
  if (sliderProps.vertical) {
    return { transform: `translate(0, ${props.modelValue}px)` }
  }
  return { transform: `translate(${props.modelValue}px, 0)` }
})

const { userAction, isUserActive } = useUserAction()

function updateModel(offset: number) {
  offset = getOffsetByStep(offset)
  emit('update:modelValue', offset)
  return offset
}

const dragger = useDrag({
  target: computed(() => (disabled.value ? null : thumbRef.value)),

  onDrag: userAction(({ offsetX, offsetY }) => {
    updateModel(sliderProps.vertical ? offsetY : offsetX)
  }),
  rangeX: range,
  rangeY: range,
  onDragEnd: userAction(({ offsetX, offsetY }) => {
    const offset = updateModel(sliderProps.vertical ? offsetY : offsetX)
    updateDragger(offset)
  })
})

function updateDragger(offset: number) {
  if (sliderProps.vertical) {
    dragger.update({ offsetY: offset })
  } else {
    dragger.update({ offsetX: offset })
  }
}

watch(
  () => props.modelValue,
  (offset) => {
    if (isUserActive()) return
    updateDragger(offset)
  }
)
</script>
