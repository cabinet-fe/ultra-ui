<template>
  <div ref="thumb" :class="cls.e('thumb')" :style></div>
</template>
<script lang="ts" setup>
import { computed, inject, useTemplateRef, watch } from 'vue'
import { sliderContextKey } from './di'
import { useDrag, useUpdateLock } from '@ui/compositions'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const { cls, range, disabled } = inject(sliderContextKey)!

const thumbRef = useTemplateRef('thumb')

const style = computed(() => ({
  transform: `translate(${props.modelValue}px, 0)`
}))

const { updateAndLock, update } = useUpdateLock()

function updateModel(v: number) {
  emit('update:modelValue', v)
}

const dragger = useDrag({
  target: computed(() => (disabled.value ? null : thumbRef.value)),

  onDrag({ offsetX }) {
    updateAndLock(() => {
      updateModel(offsetX)
    })
  },
  rangeX: range,
  onDragEnd({ offsetX }) {
    updateAndLock(() => {
      updateModel(offsetX)
      dragger.update({ offsetX })
    })
  }
})

watch(
  () => props.modelValue,
  v => {
    update(() => {
      dragger.update({ offsetX: v })
    })
  }
)
</script>
