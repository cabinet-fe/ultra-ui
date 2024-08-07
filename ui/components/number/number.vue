<template>
  {{ formatted }}
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import type { NumberProps } from '@ui/types/components/number'
import { Tween, n } from 'cat-kit/fe'

defineOptions({
  name: 'Number'
})

const props = withDefaults(defineProps<NumberProps>(), {
  duration: 800,
  format: 'decimal',
  precision: 0
})

const number = reactive({
  value: 0
})

const tween = computed(() =>
  props.tween
    ? new Tween(number, {
        duration: props.duration,
        easingFunction: Tween.easing.easeInOutQuad
      })
    : null
)

const formatter = computed(() => {
  return n.formatter({
    currency: props.format === 'currency' ? 'CNY' : undefined,
    style: props.format,
    precision: props.precision
  })
})

const formatted = computed(() => {
  return formatter.value.format(number.value)
})

watch(
  () => props.value,
  () => {
    props.tween
      ? tween.value?.to({ value: props.value })
      : (number.value = props.value)
  },
  { immediate: true }
)
</script>
