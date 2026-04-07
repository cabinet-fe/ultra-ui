<template>
  <div ref="thumb" :class="cls.e('thumb')" :style></div>
</template>
<script lang="ts" setup>
import { computed, inject, useTemplateRef, watch } from 'vue'
import { sliderContextKey } from './di'
import { useDrag, useUpdateLock } from '@ultra-ui/compositions'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const { cls, range, disabled, sliderProps, getOffsetByStep } =
  inject(sliderContextKey)!

const thumbRef = useTemplateRef('thumb')

const style = computed(() => {
  if (sliderProps.vertical) {
    return {
      transform: `translate(0, ${props.modelValue}px)`
    }
  }
  return {
    transform: `translate(${props.modelValue}px, 0)`
  }
})

const { updateAndLock, update } = useUpdateLock()

function updateModel(offset: number) {
  offset = getOffsetByStep(offset)
  emit('update:modelValue', offset)
  return offset
}

const dragger = useDrag({
  target: computed(() => (disabled.value ? null : thumbRef.value)),

  onDrag({ offsetX, offsetY }) {
    updateAndLock(() => {
      updateModel(sliderProps.vertical ? offsetY : offsetX)
    })
  },
  rangeX: range,
  rangeY: range,
  onDragEnd({ offsetX, offsetY }) {
    updateAndLock(() => {
      const offset = updateModel(sliderProps.vertical ? offsetY : offsetX)
      updateDragger(offset)
    })
  }
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
  offset => {
    update(() => updateDragger(offset))
  }
)
</script>
